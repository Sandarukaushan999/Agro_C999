const express = require('express')
const { body, validationResult } = require('express-validator')
const Solution = require('../models/SimpleSolution')
const Comment = require('../models/SimpleComment')
const User = require('../models/SimpleUser')
const auth = require('../middleware/auth')
const logger = require('../utils/logger')

const router = express.Router()

// @route   GET /api/solutions
// @desc    Get all solutions
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { plant, disease, page = 1, limit = 10 } = req.query
    const skip = (page - 1) * limit

    let query = { isActive: true }
    
    if (plant) {
      query.plant = new RegExp(plant, 'i')
    }
    
    if (disease) {
      query.disease = new RegExp(disease, 'i')
    }

    const solutions = await Solution.find(query, {
      sort: { averageRating: -1, totalRatings: -1 },
      skip: skip,
      limit: parseInt(limit),
      populate: { createdBy: 'name', lastUpdatedBy: 'name' }
    })

    const total = await Solution.countDocuments(query)

    res.json({
      success: true,
      solutions,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    })
  } catch (error) {
    logger.error('Get solutions error:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching solutions'
    })
  }
})

// @route   GET /api/solutions/:plant/:disease
// @desc    Get specific solution by plant and disease
// @access  Public
router.get('/:plant/:disease', async (req, res) => {
  try {
    const { plant, disease } = req.params
    
    const solution = await Solution.findOne({
      plant: plant.toLowerCase(),
      disease: disease.toLowerCase(),
      isActive: true
    })

    if (!solution) {
      return res.status(404).json({
        success: false,
        message: 'Solution not found'
      })
    }

    res.json({
      success: true,
      solution
    })
  } catch (error) {
    logger.error('Get solution error:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching solution'
    })
  }
})

// @route   POST /api/solutions/:id/rate
// @desc    Rate a solution
// @access  Private
router.post('/:id/rate', auth, [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      })
    }

    const solutionId = req.params.id
    const { rating } = req.body
    const userId = req.user.id

    const solution = await Solution.findById(solutionId)
    if (!solution) {
      return res.status(404).json({
        success: false,
        message: 'Solution not found'
      })
    }

    // Check if user already rated this solution
    const existingComment = await Comment.findOne({
      solution: solutionId,
      user: userId
    })

    if (existingComment) {
      // Update existing rating
      const oldRating = existingComment.rating
      existingComment.rating = rating
      await existingComment.save()

      // Update solution average rating
      const totalRatings = solution.totalRatings
      const currentSum = solution.averageRating * totalRatings
      const newSum = currentSum - oldRating + rating
      solution.averageRating = newSum / totalRatings
      await solution.save()
    } else {
      // Create new rating
      await Comment.create({
        solution: solutionId,
        user: userId,
        content: '', // Empty content for rating-only
        rating: rating
      })

      // Update solution statistics
      const totalRatings = solution.totalRatings + 1
      const currentSum = solution.averageRating * solution.totalRatings
      solution.averageRating = (currentSum + rating) / totalRatings
      solution.totalRatings = totalRatings
      await solution.save()
    }

    logger.info(`User ${userId} rated solution ${solutionId} with ${rating} stars`)

    res.json({
      success: true,
      message: 'Rating submitted successfully',
      averageRating: solution.averageRating,
      totalRatings: solution.totalRatings
    })
  } catch (error) {
    logger.error('Rate solution error:', error)
    res.status(500).json({
      success: false,
      message: 'Error submitting rating'
    })
  }
})

// @route   POST /api/solutions/:id/comments
// @desc    Add comment to solution
// @access  Private
router.post('/:id/comments', auth, [
  body('comment').trim().isLength({ min: 1, max: 1000 }).withMessage('Comment must be between 1 and 1000 characters'),
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5')
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      })
    }

    const solutionId = req.params.id
    const { comment, rating } = req.body
    const userId = req.user.id

    const solution = await Solution.findById(solutionId)
    if (!solution) {
      return res.status(404).json({
        success: false,
        message: 'Solution not found'
      })
    }

    // Check if user already commented on this solution
    const existingComment = await Comment.findOne({
      solution: solutionId,
      user: userId
    })

    if (existingComment) {
      // Update existing comment
      existingComment.content = comment
      if (rating) {
        existingComment.rating = rating
      }
      await existingComment.save()
    } else {
      // Create new comment
      await Comment.create({
        solution: solutionId,
        user: userId,
        content: comment,
        rating: rating || 3 // Default rating if not provided
      })

      // Update solution statistics if rating provided
      if (rating) {
        const totalRatings = solution.totalRatings + 1
        const currentSum = solution.averageRating * solution.totalRatings
        solution.averageRating = (currentSum + rating) / totalRatings
        solution.totalRatings = totalRatings
        await solution.save()
      }
    }

    logger.info(`User ${userId} added comment to solution ${solutionId}`)

    res.json({
      success: true,
      message: 'Comment added successfully'
    })
  } catch (error) {
    logger.error('Add comment error:', error)
    res.status(500).json({
      success: false,
      message: 'Error adding comment'
    })
  }
})

// @route   GET /api/solutions/:id/comments
// @desc    Get comments for a solution
// @access  Public
router.get('/:id/comments', async (req, res) => {
  try {
    const solutionId = req.params.id
    const { page = 1, limit = 10 } = req.query
    const skip = (page - 1) * limit

    const comments = await Comment.find({
      solution: solutionId,
      isActive: true,
      content: { $ne: '' } // Only comments with content
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'name')

    const total = await Comment.countDocuments({
      solution: solutionId,
      isActive: true,
      content: { $ne: '' }
    })

    res.json({
      success: true,
      comments,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    })
  } catch (error) {
    logger.error('Get comments error:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching comments'
    })
  }
})

// @route   POST /api/solutions/:id/comments/:commentId/like
// @desc    Like/unlike a comment
// @access  Private
router.post('/:id/comments/:commentId/like', auth, async (req, res) => {
  try {
    const { commentId } = req.params
    const userId = req.user.id

    const comment = await Comment.findById(commentId)
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      })
    }

    const isLiked = comment.likes.includes(userId)
    const isDisliked = comment.dislikes.includes(userId)

    if (isLiked) {
      // Unlike
      comment.likes.pull(userId)
    } else {
      // Like
      comment.likes.push(userId)
      if (isDisliked) {
        comment.dislikes.pull(userId)
      }
    }

    await comment.save()

    res.json({
      success: true,
      message: isLiked ? 'Comment unliked' : 'Comment liked',
      likes: comment.likes.length,
      dislikes: comment.dislikes.length
    })
  } catch (error) {
    logger.error('Like comment error:', error)
    res.status(500).json({
      success: false,
      message: 'Error liking comment'
    })
  }
})

// @route   POST /api/solutions/:id/comments/:commentId/dislike
// @desc    Dislike/undislike a comment
// @access  Private
router.post('/:id/comments/:commentId/dislike', auth, async (req, res) => {
  try {
    const { commentId } = req.params
    const userId = req.user.id

    const comment = await Comment.findById(commentId)
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found'
      })
    }

    const isDisliked = comment.dislikes.includes(userId)
    const isLiked = comment.likes.includes(userId)

    if (isDisliked) {
      // Undislike
      comment.dislikes.pull(userId)
    } else {
      // Dislike
      comment.dislikes.push(userId)
      if (isLiked) {
        comment.likes.pull(userId)
      }
    }

    await comment.save()

    res.json({
      success: true,
      message: isDisliked ? 'Comment undisliked' : 'Comment disliked',
      likes: comment.likes.length,
      dislikes: comment.dislikes.length
    })
  } catch (error) {
    logger.error('Dislike comment error:', error)
    res.status(500).json({
      success: false,
      message: 'Error disliking comment'
    })
  }
})

// @route   GET /api/solutions/stats/overview
// @desc    Get solution statistics
// @access  Public
router.get('/stats/overview', async (req, res) => {
  try {
    const totalSolutions = await Solution.countDocuments({ isActive: true })
    const totalComments = await Comment.countDocuments({ isActive: true })
    const totalRatings = await Comment.countDocuments({ rating: { $exists: true } })
    
    const avgRating = await Comment.aggregate([
      { $match: { rating: { $exists: true } } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ])

    const topPlants = await Solution.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$plant', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ])

    const topDiseases = await Solution.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$disease', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ])

    res.json({
      success: true,
      stats: {
        totalSolutions,
        totalComments,
        totalRatings,
        averageRating: avgRating[0]?.avgRating || 0,
        topPlants,
        topDiseases
      }
    })
  } catch (error) {
    logger.error('Get solution stats error:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching solution statistics'
    })
  }
})

module.exports = router
