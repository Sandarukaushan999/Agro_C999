const { db } = require('../config/simpleDatabase')

class SimpleComment {
  constructor(data) {
    this._id = data._id
    this.solution = data.solution
    this.user = data.user
    this.content = data.content
    this.rating = data.rating
    this.likes = data.likes || []
    this.dislikes = data.dislikes || []
    this.isActive = data.isActive !== false
    this.createdAt = data.createdAt
    this.updatedAt = data.updatedAt
  }

  // Static methods
  static async create(commentData) {
    const comment = db.createComment(commentData)
    return new SimpleComment(comment)
  }

  static async find(query = {}, options = {}) {
    const { sort = {}, skip = 0, limit = 10, populate } = options
    
    let comments = []
    
    if (query.solution) {
      comments = db.findCommentsBySolution(query.solution, limit, skip)
    } else {
      // Get all comments
      comments = Array.from(db.comments.values())
        .filter(comment => comment.isActive)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(skip, skip + limit)
    }
    
    // Apply additional filters
    if (query.isActive !== false) {
      comments = comments.filter(comment => comment.isActive)
    }
    
    if (query.content && query.content.$ne) {
      comments = comments.filter(comment => comment.content !== query.content.$ne)
    }
    
    if (query.rating && query.rating.$exists) {
      comments = comments.filter(comment => comment.rating !== undefined)
    }
    
    // Apply populate if needed
    if (populate && populate.user) {
      comments = comments.map(comment => {
        const user = db.findUserById(comment.user)
        return {
          ...comment,
          user: user ? { _id: user._id, name: user.name } : null
        }
      })
    }
    
    return comments.map(c => new SimpleComment(c))
  }

  static async findOne(query) {
    let comment = null
    
    if (query._id) {
      comment = db.comments.get(parseInt(query._id))
    } else if (query.solution && query.user) {
      comment = db.findCommentBySolutionAndUser(query.solution, query.user)
    }
    
    if (comment && query.isActive !== false && !comment.isActive) {
      return null
    }
    
    return comment ? new SimpleComment(comment) : null
  }

  static async findById(id) {
    const comment = db.comments.get(parseInt(id))
    return comment ? new SimpleComment(comment) : null
  }

  static async findByIdAndUpdate(id, updateData, options = {}) {
    const comment = db.updateComment(id, updateData)
    return comment ? new SimpleComment(comment) : null
  }

  static async countDocuments(query = {}) {
    let count = 0
    
    for (const comment of db.comments.values()) {
      if (query.isActive !== false && !comment.isActive) continue
      if (query.solution && comment.solution !== parseInt(query.solution)) continue
      if (query.content && query.content.$ne && comment.content === query.content.$ne) continue
      if (query.rating && query.rating.$exists && comment.rating === undefined) continue
      
      count++
    }
    
    return count
  }

  static async aggregate(pipeline) {
    const result = []
    
    // Handle average rating aggregation
    if (pipeline[0] && pipeline[0].$group) {
      const group = pipeline[0].$group
      if (group._id === null && group.avgRating) {
        let totalRating = 0
        let count = 0
        
        for (const comment of db.comments.values()) {
          if (comment.isActive && comment.rating !== undefined) {
            totalRating += comment.rating
            count++
          }
        }
        
        result.push({
          _id: null,
          avgRating: count > 0 ? totalRating / count : 0
        })
      }
    }
    
    return result
  }

  // Instance methods
  async save() {
    const updatedComment = db.updateComment(this._id, {
      solution: this.solution,
      user: this.user,
      content: this.content,
      rating: this.rating,
      likes: this.likes,
      dislikes: this.dislikes,
      isActive: this.isActive
    })
    
    if (updatedComment) {
      Object.assign(this, updatedComment)
    }
    
    return this
  }

  // Array methods for likes/dislikes
  push(item) {
    this.likes.push(item)
  }

  pull(item) {
    const index = this.likes.indexOf(item)
    if (index > -1) {
      this.likes.splice(index, 1)
    }
  }
}

module.exports = SimpleComment




