const express = require('express')
const jwt = require('jsonwebtoken')
const { body, validationResult } = require('express-validator')
const User = require('../models/SimpleUser')
const auth = require('../middleware/auth')
const logger = require('../utils/logger')

const router = express.Router()

// @route   POST /auth/register
// @desc    Register user
// @access  Public
router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Please include a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
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

    const { name, email, password } = req.body

    // Check if user exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      })
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password
    })

    // Generate token
    const token = user.getSignedJwtToken()

    logger.info(`New user registered: ${email}`)

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error) {
    logger.error('Registration error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    })
  }
})

// @route   POST /auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please include a valid email'),
  body('password').exists().withMessage('Password is required')
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

    const { email, password } = req.body

    // Check for user
    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      })
    }

    // Check password
    const isMatch = await user.matchPassword(password)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      })
    }

    // Update last login
    user.lastLogin = new Date()
    await user.save()

    // Generate token
    const token = user.getSignedJwtToken()

    logger.info(`User logged in: ${email}`)

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        predictionCount: user.predictionCount
      }
    })
  } catch (error) {
    logger.error('Login error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    })
  }
})

// @route   GET /auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        predictionCount: user.predictionCount,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    })
  } catch (error) {
    logger.error('Profile fetch error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile'
    })
  }
})

// @route   PUT /auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').optional().isEmail().withMessage('Please include a valid email')
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

    const { name, email } = req.body
    const updateData = {}

    if (name) updateData.name = name
    if (email) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ email, _id: { $ne: req.user.id } })
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        })
      }
      updateData.email = email
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    )

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        predictionCount: user.predictionCount
      }
    })
  } catch (error) {
    logger.error('Profile update error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error updating profile'
    })
  }
})

// @route   POST /auth/logout
// @desc    Logout user (client-side token removal)
// @access  Private
router.post('/logout', auth, async (req, res) => {
  try {
    logger.info(`User logged out: ${req.user.email}`)
    
    res.json({
      success: true,
      message: 'Logout successful'
    })
  } catch (error) {
    logger.error('Logout error:', error)
    res.status(500).json({
      success: false,
      message: 'Server error during logout'
    })
  }
})

module.exports = router
