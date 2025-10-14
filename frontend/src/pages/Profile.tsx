import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/FirebaseAuthContext'
import { User, Calendar, Image, TrendingUp, Edit3, Filter } from 'lucide-react'

const Profile: React.FC = () => {
  const { currentUser, userProfile, updateUserProfile, getPredictionHistory } = useAuth()
  const [predictionHistory, setPredictionHistory] = useState<any[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'thisWeek' | 'thisMonth'>('all')

  useEffect(() => {
    if (currentUser) {
      setDisplayName(userProfile?.displayName || currentUser.displayName || '')
      loadPredictionHistory()
    }
  }, [currentUser, userProfile])

  useEffect(() => {
    if (currentUser) {
      loadPredictionHistory()
    }
  }, [filter])

  const loadPredictionHistory = async () => {
    try {
      const history = await getPredictionHistory(filter)
      setPredictionHistory(history)
    } catch (error) {
      console.error('Error loading prediction history:', error)
    }
  }

  const handleUpdateProfile = async () => {
    if (!displayName.trim()) return
    
    try {
      setLoading(true)
      await updateUserProfile(displayName.trim())
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
  }

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile</h1>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600">Please log in to view your profile.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile</h1>
      
      {/* User Info Card */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
            {currentUser.photoURL ? (
              <img 
                src={currentUser.photoURL} 
                alt="Profile" 
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <User className="w-8 h-8 text-white" />
            )}
          </div>
          <div className="flex-1">
            {isEditing ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="text-2xl font-bold text-gray-900 border border-gray-300 rounded px-2 py-1"
                />
                <button
                  onClick={handleUpdateProfile}
                  disabled={loading}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setDisplayName(userProfile?.displayName || currentUser.displayName || '')
                  }}
                  className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <h2 className="text-2xl font-bold text-gray-900">
                  {userProfile?.displayName || currentUser.displayName || 'User'}
                </h2>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            )}
            <p className="text-gray-600">{currentUser.email}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">
              Joined: {userProfile?.createdAt ? formatDate(userProfile.createdAt) : 'Unknown'}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">
              Predictions: {predictionHistory.length}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">
              Last Login: {userProfile?.lastLoginAt ? formatDate(userProfile.lastLoginAt) : 'Unknown'}
            </span>
          </div>
        </div>
      </div>

      {/* Prediction History */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <Image className="w-5 h-5 mr-2" />
            Prediction History
          </h3>
          
          {/* Filter Dropdown */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'thisWeek' | 'thisMonth')}
              className="border border-gray-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Time</option>
              <option value="thisWeek">This Week</option>
              <option value="thisMonth">This Month</option>
            </select>
          </div>
        </div>
        
        {predictionHistory.length === 0 ? (
          <div className="text-center py-8">
            <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">
              {filter === 'all' 
                ? 'No predictions yet. Upload an image to get started!' 
                : `No predictions found for ${filter === 'thisWeek' ? 'this week' : 'this month'}.`
              }
            </p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="text-primary-600 hover:text-primary-700 text-sm"
              >
                View all predictions
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {predictionHistory.map((prediction) => (
              <div key={prediction.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-4">
                  <img 
                    src={prediction.imageUrl} 
                    alt={prediction.imageName}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{prediction.prediction}</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Confidence: {(prediction.confidence * 100).toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-500">
                      {prediction.imageName} • {formatDate(prediction.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Profile
