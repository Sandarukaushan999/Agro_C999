import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/FirebaseAuthContext'
import { Plus, BookOpen, Shield, Lightbulb } from 'lucide-react'

const Solutions: React.FC = () => {
  const { currentUser, getSolutions, saveSolution } = useAuth()
  const [solutions, setSolutions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newSolution, setNewSolution] = useState({
    disease: '',
    solution: '',
    prevention: ''
  })

  useEffect(() => {
    loadSolutions()
  }, [])

  const loadSolutions = async () => {
    try {
      setLoading(true)
      const data = await getSolutions()
      setSolutions(data)
    } catch (error) {
      console.error('Error loading solutions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitSolution = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSolution.disease || !newSolution.solution || !newSolution.prevention) {
      return
    }

    try {
      await saveSolution(newSolution.disease, newSolution.solution, newSolution.prevention)
      setNewSolution({ disease: '', solution: '', prevention: '' })
      setShowAddForm(false)
      loadSolutions()
    } catch (error) {
      console.error('Error saving solution:', error)
    }
  }

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown'
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
    return date.toLocaleDateString()
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Plant Disease Solutions</h1>
        {currentUser && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Solution</span>
          </button>
        )}
      </div>

      {/* Add Solution Form */}
      {showAddForm && currentUser && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Solution</h2>
          <form onSubmit={handleSubmitSolution} className="space-y-4">
            <div>
              <label htmlFor="disease" className="block text-sm font-medium text-gray-700 mb-1">
                Disease Name
              </label>
              <input
                type="text"
                id="disease"
                value={newSolution.disease}
                onChange={(e) => setNewSolution({ ...newSolution, disease: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="solution" className="block text-sm font-medium text-gray-700 mb-1">
                Treatment Solution
              </label>
              <textarea
                id="solution"
                value={newSolution.solution}
                onChange={(e) => setNewSolution({ ...newSolution, solution: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label htmlFor="prevention" className="block text-sm font-medium text-gray-700 mb-1">
                Prevention Tips
              </label>
              <textarea
                id="prevention"
                value={newSolution.prevention}
                onChange={(e) => setNewSolution({ ...newSolution, prevention: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div className="flex space-x-4">
              <button
                type="submit"
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Save Solution
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Solutions List */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading solutions...</p>
          </div>
        ) : solutions.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No solutions available yet.</p>
            {currentUser && (
              <p className="text-gray-500 text-sm mt-2">Be the first to add a solution!</p>
            )}
          </div>
        ) : (
          solutions.map((solution) => (
            <div key={solution.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-green-600" />
                  {solution.disease}
                </h3>
                <span className="text-sm text-gray-500">
                  {formatDate(solution.timestamp)}
                </span>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                    <Lightbulb className="w-4 h-4 mr-2 text-yellow-600" />
                    Treatment Solution
                  </h4>
                  <p className="text-gray-700 bg-green-50 p-3 rounded-md">
                    {solution.solution}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2 flex items-center">
                    <Shield className="w-4 h-4 mr-2 text-blue-600" />
                    Prevention Tips
                  </h4>
                  <p className="text-gray-700 bg-blue-50 p-3 rounded-md">
                    {solution.prevention}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Solutions
