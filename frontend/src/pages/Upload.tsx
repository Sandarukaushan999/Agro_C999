import ImageUpload from '../components/ImageUpload'
import { motion } from 'framer-motion'

const Upload = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen py-8"
    >
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Plant Disease Diagnosis
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Upload a clear image of your plant leaf and our AI will analyze it to identify 
          any diseases and provide treatment recommendations.
        </p>
      </div>
      
      <ImageUpload />
    </motion.div>
  )
}

export default Upload
