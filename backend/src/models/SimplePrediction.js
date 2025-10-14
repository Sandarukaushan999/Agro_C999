const { db } = require('../config/simpleDatabase')

class SimplePrediction {
  constructor(data) {
    this._id = data._id
    this.user = data.user
    this.imageUrl = data.imageUrl
    this.originalFileName = data.originalFileName
    this.prediction = data.prediction
    this.confidence = data.confidence
    this.plantType = data.plantType
    this.diseaseType = data.diseaseType
    this.explanationUrl = data.explanationUrl
    this.processingTime = data.processingTime
    this.metadata = data.metadata
    this.userFeedback = data.userFeedback
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }

  // Static methods
  static async create(predictionData) {
    const prediction = db.createPrediction(predictionData)
    return new SimplePrediction(prediction)
  }

  static async find(query = {}, options = {}) {
    const { sort = {}, skip = 0, limit = 10, populate } = options
    
    let predictions = []
    
    if (query.user) {
      predictions = db.findPredictionsByUser(query.user, limit, skip)
    } else {
      // Get all predictions
      predictions = Array.from(db.predictions.values())
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(skip, skip + limit)
    }
    
    // Apply populate if needed
    if (populate && populate.user) {
      predictions = predictions.map(pred => {
        const user = db.findUserById(pred.user)
        return {
          ...pred,
          user: user ? { _id: user._id, name: user.name, email: user.email } : null
        }
      })
    }
    
    return predictions.map(p => new SimplePrediction(p))
  }

  static async findOne(query) {
    let prediction = null
    
    if (query._id) {
      prediction = db.predictions.get(parseInt(query._id))
    } else if (query.user && query._id) {
      // Find by user and prediction id
      prediction = db.predictions.get(parseInt(query._id))
      if (prediction && prediction.user !== parseInt(query.user)) {
        prediction = null
      }
    }
    
    return prediction ? new SimplePrediction(prediction) : null
  }

  static async findByIdAndUpdate(id, updateData, options = {}) {
    const prediction = db.updatePrediction(id, updateData)
    return prediction ? new SimplePrediction(prediction) : null
  }

  static async countDocuments(query = {}) {
    if (query.user) {
      return db.findPredictionsByUser(query.user).length
    } else if (query.prediction) {
      let count = 0
      for (const pred of db.predictions.values()) {
        if (pred.prediction === query.prediction) count++
      }
      return count
    }
    return db.predictions.size
  }

  static async aggregate(pipeline) {
    const result = []
    
    // Handle average confidence aggregation
    if (pipeline[0] && pipeline[0].$group) {
      const group = pipeline[0].$group
      if (group._id === null && group.avgConfidence) {
        let totalConfidence = 0
        let count = 0
        
        for (const pred of db.predictions.values()) {
          totalConfidence += pred.confidence || 0
          count++
        }
        
        result.push({
          _id: null,
          avgConfidence: count > 0 ? totalConfidence / count : 0
        })
      }
    }
    
    // Handle group by plant type
    if (pipeline[0] && pipeline[0].$group && pipeline[0].$group._id === '$plantType') {
      const plantCounts = {}
      for (const pred of db.predictions.values()) {
        const plantType = pred.plantType || 'unknown'
        plantCounts[plantType] = (plantCounts[plantType] || 0) + 1
      }
      
      for (const [plantType, count] of Object.entries(plantCounts)) {
        result.push({ _id: plantType, count })
      }
    }
    
    // Handle group by disease type
    if (pipeline[0] && pipeline[0].$group && pipeline[0].$group._id === '$diseaseType') {
      const diseaseCounts = {}
      for (const pred of db.predictions.values()) {
        const diseaseType = pred.diseaseType || 'unknown'
        if (diseaseType !== null) {
          diseaseCounts[diseaseType] = (diseaseCounts[diseaseType] || 0) + 1
        }
      }
      
      for (const [diseaseType, count] of Object.entries(diseaseCounts)) {
        result.push({ _id: diseaseType, count })
      }
    }
    
    // Apply sorting and limiting
    if (pipeline[1] && pipeline[1].$sort) {
      const sortField = Object.keys(pipeline[1].$sort)[0]
      const sortOrder = pipeline[1].$sort[sortField]
      result.sort((a, b) => {
        if (sortField === 'count') {
          return sortOrder === -1 ? b.count - a.count : a.count - b.count
        }
        return 0
      })
    }
    
    if (pipeline[2] && pipeline[2].$limit) {
      result.splice(pipeline[2].$limit)
    }
    
    return result
  }

  // Save method for updates
  async save() {
    const updatedPrediction = db.updatePrediction(this._id, {
      user: this.user,
      imageUrl: this.imageUrl,
      originalFileName: this.originalFileName,
      prediction: this.prediction,
      confidence: this.confidence,
      plantType: this.plantType,
      diseaseType: this.diseaseType,
      explanationUrl: this.explanationUrl,
      processingTime: this.processingTime,
      metadata: this.metadata,
      userFeedback: this.userFeedback
    })
    
    if (updatedPrediction) {
      Object.assign(this, updatedPrediction)
    }
    
    return this
  }
}

module.exports = SimplePrediction

