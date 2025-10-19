require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')
const mongoose = require('mongoose')
const path = require('path')
const axios = require('axios')

const authRoutes = require('./routes/auth')
const predictionRoutes = require('./routes/predictions')
const solutionRoutes = require('./routes/solutions')
const userRoutes = require('./routes/users')

const logger = require('./utils/logger')
const errorHandler = require('./middleware/errorHandler')
const { connectDB } = require('./config/simpleDatabase')

const app = express()
const PORT = process.env.PORT || 5000

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}))

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))

// Compression and logging
app.use(compression())
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(limiter)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// Test endpoint for ML service (no auth required)
app.post('/api/test-predict', async (req, res) => {
  try {
    const { imageData, plant } = req.body
    
    if (!imageData) {
      return res.status(400).json({
        success: false,
        message: 'No image data provided'
      })
    }

    // Convert base64 to buffer
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '')
    const imageBuffer = Buffer.from(base64Data, 'base64')

    // Create FormData for ML service
    const FormData = require('form-data')
    const formData = new FormData()
    formData.append('file', imageBuffer, {
      filename: 'test.jpg',
      contentType: 'image/jpeg'
    })

    // Optionally request plant switch before prediction
    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000'

    if (plant && ['potato', 'tomato'].includes(String(plant).toLowerCase())) {
      try {
        await axios.post(`${mlServiceUrl}/model/switch`, { plant: String(plant).toLowerCase() }, { timeout: 10000 })
      } catch (switchErr) {
        logger.warn('Model switch request failed:', switchErr.message)
      }
    }

    // Call ML service directly
    logger.info(`Calling ML service at ${mlServiceUrl}/predict`)
    
    const mlResponse = await axios.post(`${mlServiceUrl}/predict`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 30000
    })

    logger.info('ML service response received:', mlResponse.status)

    res.json({
      success: true,
      prediction: mlResponse.data
    })
  } catch (error) {
    logger.error('Test prediction error:', error.message)
    logger.error('Error details:', error.response?.data || error.stack)
    
    res.status(500).json({
      success: false,
      message: 'Error testing prediction: ' + (error.response?.data?.detail || error.message)
    })
  }
})

// API routes
app.use('/auth', authRoutes)
app.use('/api/predictions', predictionRoutes)
app.use('/api/solutions', solutionRoutes)
app.use('/api/users', userRoutes)

// Catch-all route for undefined endpoints
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  })
})

// Error handling middleware
app.use(errorHandler)

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDB()
    logger.info('Connected to MongoDB')
    
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`)
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`)
    })
  } catch (error) {
    logger.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err)
  process.exit(1)
})

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err)
  process.exit(1)
})

startServer()

module.exports = app
