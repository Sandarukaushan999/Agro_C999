const logger = require('../utils/logger')

// Simple in-memory database for development
class SimpleDatabase {
  constructor() {
    this.users = new Map()
    this.predictions = new Map()
    this.solutions = new Map()
    this.comments = new Map()
    this.nextId = 1
  }

  // User operations
  createUser(userData) {
    const id = this.nextId++
    const user = {
      _id: id,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
      predictionCount: 0,
      isActive: true,
      role: 'user'
    }
    this.users.set(id, user)
    return user
  }

  findUserById(id) {
    return this.users.get(parseInt(id))
  }

  findUserByEmail(email) {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user
      }
    }
    return null
  }

  updateUser(id, updateData) {
    const user = this.users.get(parseInt(id))
    if (user) {
      Object.assign(user, updateData, { updatedAt: new Date() })
      return user
    }
    return null
  }

  // Prediction operations
  createPrediction(predictionData) {
    const id = this.nextId++
    const prediction = {
      _id: id,
      ...predictionData,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    this.predictions.set(id, prediction)
    return prediction
  }

  findPredictionsByUser(userId, limit = 10, skip = 0) {
    const userPredictions = []
    for (const prediction of this.predictions.values()) {
      if (prediction.user === parseInt(userId)) {
        userPredictions.push(prediction)
      }
    }
    return userPredictions
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(skip, skip + limit)
  }

  updatePrediction(id, updateData) {
    const prediction = this.predictions.get(parseInt(id))
    if (prediction) {
      Object.assign(prediction, updateData, { updatedAt: new Date() })
      return prediction
    }
    return null
  }

  // Solution operations
  createSolution(solutionData) {
    const id = this.nextId++
    const solution = {
      _id: id,
      ...solutionData,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      averageRating: 0,
      totalRatings: 0
    }
    this.solutions.set(id, solution)
    return solution
  }

  findSolutionByPlantAndDisease(plant, disease) {
    for (const solution of this.solutions.values()) {
      if (solution.plant === plant.toLowerCase() && 
          solution.disease === disease.toLowerCase() && 
          solution.isActive) {
        return solution
      }
    }
    return null
  }

  findSolutions(query = {}, limit = 10, skip = 0) {
    const solutions = []
    for (const solution of this.solutions.values()) {
      if (solution.isActive) {
        if (query.plant && !solution.plant.includes(query.plant.toLowerCase())) continue
        if (query.disease && !solution.disease.includes(query.disease.toLowerCase())) continue
        solutions.push(solution)
      }
    }
    return solutions
      .sort((a, b) => b.averageRating - a.averageRating)
      .slice(skip, skip + limit)
  }

  updateSolution(id, updateData) {
    const solution = this.solutions.get(parseInt(id))
    if (solution) {
      Object.assign(solution, updateData, { updatedAt: new Date() })
      return solution
    }
    return null
  }

  // Comment operations
  createComment(commentData) {
    const id = this.nextId++
    const comment = {
      _id: id,
      ...commentData,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      likes: [],
      dislikes: []
    }
    this.comments.set(id, comment)
    return comment
  }

  findCommentsBySolution(solutionId, limit = 10, skip = 0) {
    const solutionComments = []
    for (const comment of this.comments.values()) {
      if (comment.solution === parseInt(solutionId) && 
          comment.isActive && 
          comment.content) {
        solutionComments.push(comment)
      }
    }
    return solutionComments
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(skip, skip + limit)
  }

  findCommentBySolutionAndUser(solutionId, userId) {
    for (const comment of this.comments.values()) {
      if (comment.solution === parseInt(solutionId) && 
          comment.user === parseInt(userId)) {
        return comment
      }
    }
    return null
  }

  updateComment(id, updateData) {
    const comment = this.comments.get(parseInt(id))
    if (comment) {
      Object.assign(comment, updateData, { updatedAt: new Date() })
      return comment
    }
    return null
  }

  // Statistics
  getStats() {
    return {
      totalUsers: this.users.size,
      totalPredictions: this.predictions.size,
      totalSolutions: this.solutions.size,
      totalComments: this.comments.size
    }
  }
}

// Global instance
const db = new SimpleDatabase()

// Initialize with some sample data
function initializeDatabase() {
  logger.info('Initializing simple database with sample data...')
  
  // Create sample solutions
  const sampleSolutions = [
    {
      plant: 'potato',
      disease: 'unknown_disease',
      title: 'General Potato Disease Treatment',
      description: 'General treatment for potato diseases including proper watering, soil management, and fungicide application.',
      symptoms: ['Yellowing leaves', 'Brown spots', 'Wilting', 'Stunted growth'],
      treatment: [
        'Remove affected plant parts',
        'Apply copper-based fungicide',
        'Improve soil drainage',
        'Ensure proper spacing between plants'
      ],
      prevention: [
        'Crop rotation',
        'Proper watering schedule',
        'Regular inspection',
        'Use disease-resistant varieties'
      ],
      createdBy: 1,
      lastUpdatedBy: 1
    }
  ]

  sampleSolutions.forEach(solution => {
    db.createSolution(solution)
  })

  logger.info('Database initialized with sample data')
}

// Connect function (compatible with MongoDB connection)
const connectDB = async () => {
  try {
    initializeDatabase()
    logger.info('Simple database connected successfully')
    return true
  } catch (error) {
    logger.error('Database connection error:', error)
    throw error
  }
}

module.exports = { connectDB, db }
