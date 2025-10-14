const mongoose = require('mongoose')

const solutionSchema = new mongoose.Schema({
  plant: {
    type: String,
    required: true,
    trim: true
  },
  disease: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  symptoms: [{
    type: String,
    required: true
  }],
  treatment: [{
    type: String,
    required: true
  }],
  prevention: [{
    type: String,
    required: true
  }],
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  affectedParts: [{
    type: String
  }],
  seasonality: [{
    type: String,
    enum: ['spring', 'summer', 'fall', 'winter', 'year-round']
  }],
  environmentalFactors: [{
    type: String
  }],
  organicTreatment: [{
    type: String
  }],
  chemicalTreatment: [{
    type: String
  }],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  lastUpdatedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Compound index for efficient queries
solutionSchema.index({ plant: 1, disease: 1 }, { unique: true })
solutionSchema.index({ plant: 1 })
solutionSchema.index({ disease: 1 })
solutionSchema.index({ averageRating: -1 })

module.exports = mongoose.model('Solution', solutionSchema)
