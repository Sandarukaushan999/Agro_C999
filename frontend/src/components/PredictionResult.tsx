import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Leaf, 
  Bug, 
  Eye,
  Star,
  MessageCircle
} from 'lucide-react'
import { MLPrediction } from '../services/api'
import { useMutation, useQuery } from '@tanstack/react-query'
import { solutionAPI } from '../services/api'
import toast from 'react-hot-toast'

interface PredictionResultProps {
  prediction: MLPrediction
}

const PredictionResult = ({ prediction }: PredictionResultProps) => {
  const [showExplanation, setShowExplanation] = useState(false)
  const [userRating, setUserRating] = useState<number | null>(null)
  const [comment, setComment] = useState('')

  const isHealthy = prediction.prediction === 'healthy'
  const confidence = Math.round(prediction.confidence * 100)

  // Fetch solution data
  const { data: solution } = useQuery({
    queryKey: ['solution', prediction.plantType, prediction.diseaseType],
    queryFn: () => solutionAPI.getSolution(prediction.plantType, prediction.diseaseType),
    enabled: !isHealthy,
  })

  // Rate solution mutation
  const rateMutation = useMutation({
    mutationFn: (rating: number) => 
      solutionAPI.rateSolution(solution?.data.solution._id, rating),
    onSuccess: () => {
      toast.success('Thank you for your rating!')
    },
    onError: () => {
      toast.error('Failed to submit rating')
    },
  })

  // Add comment mutation
  const commentMutation = useMutation({
    mutationFn: (comment: string) => 
      solutionAPI.addComment(solution?.data.solution._id, comment),
    onSuccess: () => {
      toast.success('Comment added successfully!')
      setComment('')
    },
    onError: () => {
      toast.error('Failed to add comment')
    },
  })

  const handleRating = (rating: number) => {
    setUserRating(rating)
    rateMutation.mutate(rating)
  }

  const handleCommentSubmit = () => {
    if (comment.trim()) {
      commentMutation.mutate(comment)
    }
  }

  return (
    <div className="card p-6 space-y-6">
      {/* Prediction Header */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
            isHealthy 
              ? 'bg-green-100 text-green-600' 
              : 'bg-red-100 text-red-600'
          }`}
        >
          {isHealthy ? (
            <CheckCircle className="w-8 h-8" />
          ) : (
            <XCircle className="w-8 h-8" />
          )}
        </motion.div>
        
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          {isHealthy ? 'Plant is Healthy!' : 'Disease Detected'}
        </h3>
        
        <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <Leaf className="w-4 h-4" />
            <span>Plant: {prediction.plantType}</span>
          </div>
          {!isHealthy && (
            <div className="flex items-center space-x-1">
              <Bug className="w-4 h-4" />
              <span>Disease: {prediction.diseaseType}</span>
            </div>
          )}
          <div className="flex items-center space-x-1">
            <span>Confidence: {confidence}%</span>
          </div>
        </div>
      </div>

      {/* Confidence Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Confidence Level</span>
          <span className="font-medium">{confidence}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${confidence}%` }}
            transition={{ delay: 0.5, duration: 1 }}
            className={`h-2 rounded-full ${
              confidence >= 80 
                ? 'bg-green-500' 
                : confidence >= 60 
                ? 'bg-yellow-500' 
                : 'bg-red-500'
            }`}
          />
        </div>
      </div>

      {/* Explanation Toggle */}
      {prediction.explanation && (
        <div className="text-center">
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="btn-outline px-4 py-2"
          >
            <Eye className="w-4 h-4 mr-2" />
            {showExplanation ? 'Hide' : 'Show'} AI Explanation
          </button>
        </div>
      )}

      {/* Explanation Image */}
      {showExplanation && prediction.explanation && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="text-center"
        >
          <img
            src={prediction.explanation}
            alt="AI Explanation"
            className="max-w-full h-auto rounded-lg shadow-md mx-auto"
          />
          <p className="text-sm text-gray-600 mt-2">
            Heat map showing areas the AI focused on for diagnosis
          </p>
        </motion.div>
      )}

      {/* Solution Section */}
      {!isHealthy && solution && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="border-t pt-6"
        >
          <div className="space-y-6">
            {/* Solution Content */}
            <div>
              <h4 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
                Treatment Solution
              </h4>
              
              <div className="space-y-4">
                <div>
                  <h5 className="font-semibold text-gray-700 mb-2">Description:</h5>
                  <p className="text-gray-600">{solution.data.solution.description || 'No description available'}</p>
                </div>
                
                <div>
                  <h5 className="font-semibold text-gray-700 mb-2">Symptoms:</h5>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    {(solution.data.solution.symptoms || []).map((symptom: string, index: number) => (
                      <li key={index}>{symptom}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h5 className="font-semibold text-gray-700 mb-2">Treatment:</h5>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    {(solution.data.solution.treatment || []).map((treatment: string, index: number) => (
                      <li key={index}>{treatment}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h5 className="font-semibold text-gray-700 mb-2">Prevention:</h5>
                  <ul className="list-disc list-inside text-gray-600 space-y-1">
                    {(solution.data.solution.prevention || []).map((prevention: string, index: number) => (
                      <li key={index}>{prevention}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Rating Section */}
            <div className="border-t pt-4">
              <h5 className="font-semibold text-gray-700 mb-3">Rate this solution:</h5>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => handleRating(rating)}
                    className={`p-1 ${
                      userRating && rating <= userRating
                        ? 'text-yellow-400'
                        : 'text-gray-300 hover:text-yellow-400'
                    }`}
                  >
                    <Star className="w-6 h-6 fill-current" />
                  </button>
                ))}
                <span className="text-sm text-gray-600 ml-2">
                  ({solution.data.solution.totalRatings || 0} ratings, avg: {(solution.data.solution.averageRating || 0).toFixed(1)})
                </span>
              </div>
            </div>

            {/* Comments Section */}
            <div className="border-t pt-4">
              <h5 className="font-semibold text-gray-700 mb-3 flex items-center">
                <MessageCircle className="w-4 h-4 mr-2" />
                Comments & Suggestions
              </h5>
              
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your experience or suggestions..."
                    className="input flex-1"
                  />
                  <button
                    onClick={handleCommentSubmit}
                    disabled={!comment.trim() || commentMutation.isPending}
                    className="btn-primary px-4 py-2 disabled:opacity-50"
                  >
                    Add Comment
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Low Confidence Warning */}
      {confidence < 60 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
        >
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
            <div>
              <h5 className="font-semibold text-yellow-800">Low Confidence Prediction</h5>
              <p className="text-sm text-yellow-700">
                This prediction has low confidence. Please consult with a plant specialist for accurate diagnosis.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default PredictionResult
