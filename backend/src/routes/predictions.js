const express = require('express')
const multer = require('multer')
const axios = require('axios')
const sharp = require('sharp')
const { v4: uuidv4 } = require('uuid')
const path = require('path')
const fs = require('fs').promises

const Prediction = require('../models/SimplePrediction')
const Solution = require('../models/SimpleSolution')
const auth = require('../middleware/auth')
const logger = require('../utils/logger')

const router = express.Router()

// Configure multer for file uploads
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'), false)
    }
  }
})

// @route   POST /api/predictions
// @desc    Upload image and get prediction
// @access  Private
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      })
    }

    const startTime = Date.now()
    const userId = req.user.id
    const originalFileName = req.file.originalname

    // Process image with Sharp
    const processedImageBuffer = await sharp(req.file.buffer)
      .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer()

    // Get image metadata
    const metadata = await sharp(req.file.buffer).metadata()

    // Save processed image to uploads directory
    const uploadDir = path.join(__dirname, '../../uploads')
    await fs.mkdir(uploadDir, { recursive: true })
    
    const fileName = `${uuidv4()}.jpg`
    const filePath = path.join(uploadDir, fileName)
    await fs.writeFile(filePath, processedImageBuffer)

    // Prepare form data for ML service
    const formData = new FormData()
    const blob = new Blob([processedImageBuffer], { type: 'image/jpeg' })
    formData.append('image', blob, fileName)

    // Call ML service
    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000'
    const mlResponse = await axios.post(`${mlServiceUrl}/predict`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000 // 30 second timeout
    })

    const mlResult = mlResponse.data
    const processingTime = Date.now() - startTime

    // Save prediction to database
    const prediction = await Prediction.create({
      user: userId,
      imageUrl: `/uploads/${fileName}`,
      originalFileName,
      prediction: mlResult.prediction,
      confidence: mlResult.confidence,
      plantType: mlResult.plantType,
      diseaseType: mlResult.diseaseType || null,
      explanationUrl: mlResult.explanation || null,
      processingTime,
      metadata: {
        imageSize: {
          width: metadata.width,
          height: metadata.height
        },
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      }
    })

    // Update user prediction count
    const user = await User.findById(userId)
    if (user) {
      user.predictionCount = (user.predictionCount || 0) + 1
      await user.save()
    }

    // Get solution if disease is detected
    let solution = null
    if (mlResult.prediction === 'diseased' && mlResult.plantType && mlResult.diseaseType) {
      solution = await Solution.findOne({
        plant: mlResult.plantType.toLowerCase(),
        disease: mlResult.diseaseType.toLowerCase()
      })
    }

    logger.info(`Prediction completed for user ${userId}: ${mlResult.prediction} (${mlResult.confidence})`)

    res.json({
      success: true,
      prediction: {
        id: prediction._id,
        prediction: mlResult.prediction,
        confidence: mlResult.confidence,
        plantType: mlResult.plantType,
        diseaseType: mlResult.diseaseType,
        explanation: mlResult.explanation,
        processingTime,
        solution: solution ? {
          id: solution._id,
          description: solution.description,
          symptoms: solution.symptoms,
          treatment: solution.treatment,
          prevention: solution.prevention,
          averageRating: solution.averageRating,
          totalRatings: solution.totalRatings
        } : null
      }
    })

  } catch (error) {
    logger.error('Prediction error:', error)
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB.'
      })
    }

    if (error.message === 'Invalid file type. Only images are allowed.') {
      return res.status(400).json({
        success: false,
        message: error.message
      })
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return res.status(503).json({
        success: false,
        message: 'ML service is currently unavailable. Please try again later.'
      })
    }

    res.status(500).json({
      success: false,
      message: 'Error processing prediction'
    })
  }
})

// @route   GET /api/predictions/:userId
// @desc    Get user's prediction history
// @access  Private
router.get('/:userId', auth, async (req, res) => {
  try {
    const userId = req.params.userId
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    // Check if user is accessing their own data or is admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }

    const predictions = await Prediction.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email')

    const total = await Prediction.countDocuments({ user: userId })

    res.json({
      success: true,
      predictions,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    })
  } catch (error) {
    logger.error('Get predictions error:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching predictions'
    })
  }
})

// @route   PUT /api/predictions/:id/feedback
// @desc    Submit user feedback for prediction
// @access  Private
router.put('/:id/feedback', auth, async (req, res) => {
  try {
    const predictionId = req.params.id
    const { isCorrect, feedback } = req.body

    const prediction = await Prediction.findOne({
      _id: predictionId,
      user: req.user.id
    })

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found'
      })
    }

    prediction.userFeedback = {
      isCorrect,
      feedback,
      feedbackDate: new Date()
    }

    await prediction.save()

    logger.info(`User feedback submitted for prediction ${predictionId}: ${isCorrect}`)

    res.json({
      success: true,
      message: 'Feedback submitted successfully'
    })
  } catch (error) {
    logger.error('Feedback submission error:', error)
    res.status(500).json({
      success: false,
      message: 'Error submitting feedback'
    })
  }
})

// @route   GET /api/predictions/stats/overview
// @desc    Get prediction statistics
// @access  Private (Admin only)
router.get('/stats/overview', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }

    const totalPredictions = await Prediction.countDocuments()
    const healthyPredictions = await Prediction.countDocuments({ prediction: 'healthy' })
    const diseasedPredictions = await Prediction.countDocuments({ prediction: 'diseased' })
    
    const avgConfidence = await Prediction.aggregate([
      { $group: { _id: null, avgConfidence: { $avg: '$confidence' } } }
    ])

    const topPlants = await Prediction.aggregate([
      { $group: { _id: '$plantType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ])

    const topDiseases = await Prediction.aggregate([
      { $match: { diseaseType: { $ne: null } } },
      { $group: { _id: '$diseaseType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ])

    res.json({
      success: true,
      stats: {
        totalPredictions,
        healthyPredictions,
        diseasedPredictions,
        averageConfidence: avgConfidence[0]?.avgConfidence || 0,
        topPlants,
        topDiseases
      }
    })
  } catch (error) {
    logger.error('Stats fetch error:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics'
    })
  }
})

module.exports = router
