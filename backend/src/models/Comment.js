const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema({
  solution: {
    type: mongoose.Schema.ObjectId,
    ref: 'Solution',
    required: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: [1000, 'Comment cannot be more than 1000 characters']
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  likes: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  dislikes: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Index for efficient queries
commentSchema.index({ solution: 1, createdAt: -1 })
commentSchema.index({ user: 1 })
commentSchema.index({ rating: 1 })

module.exports = mongoose.model('Comment', commentSchema)
