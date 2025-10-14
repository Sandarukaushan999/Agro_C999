const mongoose = require('mongoose')

const predictionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  originalFileName: {
    type: String,
    required: true
  },
  prediction: {
    type: String,
    required: true,
    enum: ['healthy', 'diseased']
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  plantType: {
    type: String,
    required: true
  },
  diseaseType: {
    type: String,
    default: null
  },
  explanationUrl: {
    type: String,
    default: null
  },
  mlModelVersion: {
    type: String,
    default: '1.0'
  },
  processingTime: {
    type: Number, // in milliseconds
    default: 0
  },
  userFeedback: {
    isCorrect: {
      type: Boolean,
      default: null
    },
    feedback: {
      type: String,
      default: null
    },
    feedbackDate: {
      type: Date,
      default: null
    }
  },
  metadata: {
    imageSize: {
      width: Number,
      height: Number
    },
    fileSize: Number,
    mimeType: String
  }
}, {
  timestamps: true
})

// Index for efficient queries
predictionSchema.index({ user: 1, createdAt: -1 })
predictionSchema.index({ plantType: 1, diseaseType: 1 })
predictionSchema.index({ prediction: 1, confidence: 1 })

module.exports = mongoose.model('Prediction', predictionSchema)
