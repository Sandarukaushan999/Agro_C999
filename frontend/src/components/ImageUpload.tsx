import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import { predictionAPI, MLPrediction } from '../services/api'
import { useAuth } from '../contexts/FirebaseAuthContext'
import toast from 'react-hot-toast'
import PredictionResult from './PredictionResult'

const ImageUpload = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [prediction, setPrediction] = useState<MLPrediction | null>(null)
  const [plant, setPlant] = useState<'potato' | 'tomato'>('tomato')
  const { currentUser, savePrediction } = useAuth()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setPrediction(null) // Clear previous prediction
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  const predictMutation = useMutation({
    mutationFn: async (file: File) => {
      // Convert file to base64 for the test endpoint
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })
      
      const response = await predictionAPI.testPredict(base64, plant)
      return response.data.prediction
    },
    onSuccess: async (data) => {
      setPrediction(data)
      toast.success('Prediction completed!')
      
      // Save prediction to Firebase if user is logged in
      if (currentUser && selectedFile && preview) {
        try {
          await savePrediction(
            preview,
            data.prediction,
            data.confidence,
            selectedFile.name
          )
          toast.success('Prediction saved to your history!')
        } catch (error) {
          console.error('Error saving prediction:', error)
          toast.error('Failed to save prediction to history')
        }
      }
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Prediction failed'
      toast.error(message)
    },
  })

  const handlePredict = () => {
    if (selectedFile) {
      predictMutation.mutate(selectedFile)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setPreview(null)
    setPrediction(null)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Upload Area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-8"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Upload Plant Image
        </h2>
        {/* Plant Selector */}
        <div className="mb-6 flex items-center justify-center gap-4">
          <label className="text-sm font-medium text-gray-700">Plant:</label>
          <select
            className="select border-gray-300 rounded-md px-3 py-2 text-sm"
            value={plant}
            onChange={(e) => setPlant(e.target.value as 'potato' | 'tomato')}
          >
            <option value="tomato">Tomato</option>
            <option value="potato">Potato</option>
          </select>
        </div>
        
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
            }
          `}
        >
          <input {...getInputProps()} />
          
          {preview ? (
            <div className="space-y-4">
              <div className="relative inline-block">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-64 max-w-full rounded-lg shadow-md"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveFile()
                  }}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-gray-600">
                {selectedFile?.name} ({(selectedFile?.size! / 1024 / 1024).toFixed(2)} MB)
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-gray-400" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-700">
                  {isDragActive ? 'Drop the image here' : 'Drag & drop an image here'}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  or click to browse files
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Supports: JPG, PNG, GIF, WebP (max 10MB)
                </p>
              </div>
            </div>
          )}
        </div>

        {selectedFile && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 text-center"
          >
            <button
              onClick={handlePredict}
              disabled={predictMutation.isPending}
              className="btn-primary px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {predictMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Analyze Plant
                </>
              )}
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Prediction Result */}
      {prediction && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <PredictionResult prediction={prediction} />
        </motion.div>
      )}
    </div>
  )
}

export default ImageUpload
