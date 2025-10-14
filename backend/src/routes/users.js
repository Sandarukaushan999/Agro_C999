const express = require('express')
const { body, validationResult } = require('express-validator')
const User = require('../models/SimpleUser')
const auth = require('../middleware/auth')
const logger = require('../utils/logger')

const router = express.Router()

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }

    const { page = 1, limit = 10, search = '' } = req.query
    const skip = (page - 1) * limit

    let query = {}
    if (search) {
      query = {
        $or: [
          { name: new RegExp(search, 'i') },
          { email: new RegExp(search, 'i') }
        ]
      }
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    const total = await User.countDocuments(query)

    res.json({
      success: true,
      users,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    })
  } catch (error) {
    logger.error('Get users error:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    })
  }
})

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const userId = req.params.id

    // Check if user is accessing their own data or is admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }

    const user = await User.findById(userId).select('-password')
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    res.json({
      success: true,
      user
    })
  } catch (error) {
    logger.error('Get user error:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching user'
    })
  }
})

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private
router.put('/:id', auth, [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').optional().isEmail().withMessage('Please include a valid email'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Invalid role')
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

    const userId = req.params.id
    const { name, email, role, isActive } = req.body

    // Check if user is updating their own data or is admin
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }

    // Only admin can change role and status
    const updateData = {}
    if (name) updateData.name = name
    if (email) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ email, _id: { $ne: userId } })
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        })
      }
      updateData.email = email
    }
    if (req.user.role === 'admin') {
      if (role) updateData.role = role
      if (typeof isActive === 'boolean') updateData.isActive = isActive
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    logger.info(`User ${userId} updated by ${req.user.email}`)

    res.json({
      success: true,
      message: 'User updated successfully',
      user
    })
  } catch (error) {
    logger.error('Update user error:', error)
    res.status(500).json({
      success: false,
      message: 'Error updating user'
    })
  }
})

// @route   DELETE /api/users/:id
// @desc    Delete user (Admin only)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }

    const userId = req.params.id

    // Prevent admin from deleting themselves
    if (req.user.id === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      })
    }

    const user = await User.findByIdAndDelete(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      })
    }

    logger.info(`User ${userId} deleted by ${req.user.email}`)

    res.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error) {
    logger.error('Delete user error:', error)
    res.status(500).json({
      success: false,
      message: 'Error deleting user'
    })
  }
})

// @route   GET /api/users/stats/overview
// @desc    Get user statistics (Admin only)
// @access  Private
router.get('/stats/overview', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      })
    }

    const totalUsers = await User.countDocuments()
    const activeUsers = await User.countDocuments({ isActive: true })
    const adminUsers = await User.countDocuments({ role: 'admin' })
    const regularUsers = await User.countDocuments({ role: 'user' })

    const recentUsers = await User.find()
      .select('name email createdAt')
      .sort({ createdAt: -1 })
      .limit(5)

    const avgPredictions = await User.aggregate([
      { $group: { _id: null, avgPredictions: { $avg: '$predictionCount' } } }
    ])

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        adminUsers,
        regularUsers,
        averagePredictions: avgPredictions[0]?.avgPredictions || 0,
        recentUsers
      }
    })
  } catch (error) {
    logger.error('Get user stats error:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching user statistics'
    })
  }
})

module.exports = router
