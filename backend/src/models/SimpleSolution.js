const { db } = require('../config/simpleDatabase')

class SimpleSolution {
  constructor(data) {
    this._id = data._id
    this.plant = data.plant
    this.disease = data.disease
    this.title = data.title
    this.description = data.description
    this.symptoms = data.symptoms
    this.treatment = data.treatment
    this.prevention = data.prevention
    this.averageRating = data.averageRating || 0
    this.totalRatings = data.totalRatings || 0
    this.isActive = data.isActive !== false
    this.createdBy = data.createdBy
    this.lastUpdatedBy = data.lastUpdatedBy
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }

  // Static methods
  static async create(solutionData) {
    const solution = db.createSolution(solutionData)
    return new SimpleSolution(solution)
  }

  static async find(query = {}, options = {}) {
    const { sort = {}, skip = 0, limit = 10, populate } = options
    
    const solutions = db.findSolutions(query, limit, skip)
    
    // Apply populate if needed
    if (populate) {
      const populatedSolutions = solutions.map(solution => {
        const populated = { ...solution }
        
        if (populate.createdBy) {
          const createdBy = db.findUserById(solution.createdBy)
          populated.createdBy = createdBy ? { _id: createdBy._id, name: createdBy.name } : null
        }
        
        if (populate.lastUpdatedBy) {
          const lastUpdatedBy = db.findUserById(solution.lastUpdatedBy)
          populated.lastUpdatedBy = lastUpdatedBy ? { _id: lastUpdatedBy._id, name: lastUpdatedBy.name } : null
        }
        
        return populated
      })
      
      return populatedSolutions.map(s => new SimpleSolution(s))
    }
    
    return solutions.map(s => new SimpleSolution(s))
  }

  static async findOne(query) {
    let solution = null
    
    if (query._id) {
      solution = db.solutions.get(parseInt(query._id))
    } else if (query.plant && query.disease) {
      solution = db.findSolutionByPlantAndDisease(query.plant, query.disease)
    }
    
    if (solution && query.isActive !== false && !solution.isActive) {
      return null
    }
    
    return solution ? new SimpleSolution(solution) : null
  }

  static async findById(id) {
    const solution = db.solutions.get(parseInt(id))
    return solution ? new SimpleSolution(solution) : null
  }

  static async findByIdAndUpdate(id, updateData, options = {}) {
    const solution = db.updateSolution(id, updateData)
    return solution ? new SimpleSolution(solution) : null
  }

  static async countDocuments(query = {}) {
    if (query.isActive !== false) {
      let count = 0
      for (const solution of db.solutions.values()) {
        if (solution.isActive) {
          if (query.plant && !solution.plant.includes(query.plant.toLowerCase())) continue
          if (query.disease && !solution.disease.includes(query.disease.toLowerCase())) continue
          count++
        }
      }
      return count
    }
    return db.solutions.size
  }

  static async aggregate(pipeline) {
    const result = []
    
    // Handle group by plant
    if (pipeline[0] && pipeline[0].$group && pipeline[0].$group._id === '$plant') {
      const plantCounts = {}
      for (const solution of db.solutions.values()) {
        if (solution.isActive) {
          const plant = solution.plant
          plantCounts[plant] = (plantCounts[plant] || 0) + 1
        }
      }
      
      for (const [plant, count] of Object.entries(plantCounts)) {
        result.push({ _id: plant, count })
      }
    }
    
    // Handle group by disease
    if (pipeline[0] && pipeline[0].$group && pipeline[0].$group._id === '$disease') {
      const diseaseCounts = {}
      for (const solution of db.solutions.values()) {
        if (solution.isActive) {
          const disease = solution.disease
          diseaseCounts[disease] = (diseaseCounts[disease] || 0) + 1
        }
      }
      
      for (const [disease, count] of Object.entries(diseaseCounts)) {
        result.push({ _id: disease, count })
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
    const updatedSolution = db.updateSolution(this._id, {
      plant: this.plant,
      disease: this.disease,
      title: this.title,
      description: this.description,
      symptoms: this.symptoms,
      treatment: this.treatment,
      prevention: this.prevention,
      averageRating: this.averageRating,
      totalRatings: this.totalRatings,
      isActive: this.isActive,
      createdBy: this.createdBy,
      lastUpdatedBy: this.lastUpdatedBy
    })
    
    if (updatedSolution) {
      Object.assign(this, updatedSolution)
    }
    
    return this
  }
}

module.exports = SimpleSolution




