const mongoose = require('mongoose')
const logger = require('./utils/logger')

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/agro_c'
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })

    logger.info(`MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    logger.error('Database connection error:', error)
    process.exit(1)
  }
}

module.exports = { connectDB }
