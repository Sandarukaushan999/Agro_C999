const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { db } = require('../config/simpleDatabase')

class SimpleUser {
  constructor(data) {
    this._id = data._id
    this.name = data.name
    this.email = data.email
    this.password = data.password
    this.role = data.role || 'user'
    this.predictionCount = data.predictionCount || 0
    this.isActive = data.isActive !== false
    this.lastLogin = data.lastLogin
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }

  // Instance methods
  async matchPassword(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password)
  }

  getSignedJwtToken() {
    return jwt.sign(
      { id: this._id, email: this.email, role: this.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    )
  }

  // Static methods
  static async create(userData) {
    const { name, email, password } = userData
    
    // Hash password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)
    
    const user = db.createUser({
      name,
      email,
      password: hashedPassword
    })
    
    return new SimpleUser(user)
  }

  static async findOne(query) {
    let user = null
    
    if (query._id) {
      user = db.findUserById(query._id)
    } else if (query.email) {
      user = db.findUserByEmail(query.email)
    }
    
    return user ? new SimpleUser(user) : null
  }

  static async findById(id) {
    const user = db.findUserById(id)
    return user ? new SimpleUser(user) : null
  }

  static async findByIdAndUpdate(id, updateData, options = {}) {
    const user = db.updateUser(id, updateData)
    return user ? new SimpleUser(user) : null
  }

  static async findByIdAndDelete(id) {
    const user = db.findUserById(id)
    if (user) {
      db.users.delete(parseInt(id))
      return new SimpleUser(user)
    }
    return null
  }

  static async countDocuments(query = {}) {
    if (query.role) {
      let count = 0
      for (const user of db.users.values()) {
        if (user.role === query.role) count++
      }
      return count
    }
    return db.users.size
  }

  static async aggregate(pipeline) {
    // Simple aggregation for user stats
    const result = []
    
    if (pipeline[0] && pipeline[0].$group) {
      const group = pipeline[0].$group
      if (group._id === null && group.avgPredictions) {
        let totalPredictions = 0
        let userCount = 0
        
        for (const user of db.users.values()) {
          totalPredictions += user.predictionCount || 0
          userCount++
        }
        
        result.push({
          _id: null,
          avgPredictions: userCount > 0 ? totalPredictions / userCount : 0
        })
      }
    }
    
    return result
  }

  // Save method for updates
  async save() {
    const updatedUser = db.updateUser(this._id, {
      name: this.name,
      email: this.email,
      password: this.password,
      role: this.role,
      predictionCount: this.predictionCount,
      isActive: this.isActive,
      lastLogin: this.lastLogin
    })
    
    if (updatedUser) {
      Object.assign(this, updatedUser)
    }
    
    return this
  }

  // Select method for field selection
  select(fields) {
    if (fields.includes('-password')) {
      const { password, ...userWithoutPassword } = this
      return userWithoutPassword
    }
    return this
  }
}

module.exports = SimpleUser

