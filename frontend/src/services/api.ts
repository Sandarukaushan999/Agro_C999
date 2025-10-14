import axios from 'axios'

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000'
const ML_SERVICE_URL = (import.meta as any).env?.VITE_ML_SERVICE_URL || 'http://localhost:8000'

// Create axios instances
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const mlClient = axios.create({
  baseURL: ML_SERVICE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config) => {
    // Try to get Firebase token first
    const firebaseToken = localStorage.getItem('firebaseToken')
    if (firebaseToken) {
      config.headers.Authorization = `Bearer ${firebaseToken}`
    } else {
      // Fallback to JWT token
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API endpoints
export const authAPI = {
  login: (credentials: LoginCredentials) =>
    apiClient.post('/auth/login', credentials),
  register: (userData: RegisterData) =>
    apiClient.post('/auth/register', userData),
  logout: () => apiClient.post('/auth/logout'),
  getProfile: () => apiClient.get('/auth/profile'),
}

export const predictionAPI = {
  uploadImage: (formData: FormData) =>
    apiClient.post('/api/predictions', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  getPredictionHistory: (userId: string) =>
    apiClient.get(`/api/predictions/${userId}`),
  // Test endpoint (no auth required)
  testPredict: (imageData: string) =>
    apiClient.post('/api/test-predict', { imageData }),
}

export const solutionAPI = {
  getSolutions: () => apiClient.get('/api/solutions'),
  getSolution: (plant: string, disease: string) =>
    apiClient.get(`/api/solutions/${plant}/${disease}`),
  rateSolution: (solutionId: string, rating: number) =>
    apiClient.post(`/api/solutions/${solutionId}/rate`, { rating }),
  addComment: (solutionId: string, comment: string) =>
    apiClient.post(`/api/solutions/${solutionId}/comments`, { comment }),
  getComments: (solutionId: string) =>
    apiClient.get(`/api/solutions/${solutionId}/comments`),
}

export const mlAPI = {
  predict: (formData: FormData) =>
    mlClient.post('/predict', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
  getHealth: () => mlClient.get('/health'),
}

// Types
export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
}

export interface User {
  id: string
  name: string
  email: string
  createdAt: string
}

export interface Prediction {
  id: string
  userId: string
  imageUrl: string
  prediction: string
  confidence: number
  plantType: string
  diseaseType: string
  explanationUrl?: string
  createdAt: string
}

export interface Solution {
  id: string
  plant: string
  disease: string
  description: string
  symptoms: string[]
  treatment: string[]
  prevention: string[]
  averageRating: number
  totalRatings: number
}

export interface Comment {
  id: string
  userId: string
  userName: string
  content: string
  rating: number
  createdAt: string
}

export interface MLPrediction {
  prediction: string
  confidence: number
  plantType: string
  diseaseType: string
  explanation?: string
}
