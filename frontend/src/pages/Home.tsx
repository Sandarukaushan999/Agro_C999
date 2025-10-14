import { motion } from 'framer-motion'
import { Leaf, Upload, BookOpen, Shield, Zap, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/FirebaseAuthContext'

const Home = () => {
  const { currentUser } = useAuth()
  const isAuthenticated = !!currentUser

  const features = [
    {
      icon: Upload,
      title: 'Instant Diagnosis',
      description: 'Upload plant images and get instant disease identification with high accuracy.',
    },
    {
      icon: Shield,
      title: 'Expert Solutions',
      description: 'Get detailed treatment plans and prevention strategies from our expert database.',
    },
    {
      icon: Zap,
      title: 'AI-Powered',
      description: 'Advanced machine learning models trained on thousands of plant disease images.',
    },
    {
      icon: Users,
      title: 'Community Driven',
      description: 'Rate solutions and share experiences to help other farmers.',
    },
  ]

  const stats = [
    { number: '95%', label: 'Accuracy Rate' },
    { number: '50+', label: 'Plant Types' },
    { number: '100+', label: 'Disease Types' },
    { number: '10K+', label: 'Images Analyzed' },
  ]

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
      >
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full mb-8"
          >
            <Leaf className="w-10 h-10 text-white" />
          </motion.div>
          
          <h1 className="text-5xl font-bold text-gray-800 mb-6">
            Identify Plant Diseases with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600">
              AI Precision
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Upload a photo of your plant and get instant, accurate disease identification 
            along with expert treatment solutions. Protect your crops with cutting-edge AI technology.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/upload"
              className="btn-primary px-8 py-4 text-lg"
            >
              <Upload className="w-5 h-5 mr-2" />
              Start Diagnosis
            </Link>
            <Link
              to="/solutions"
              className="btn-outline px-8 py-4 text-lg"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Browse Solutions
            </Link>
          </div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-lg p-8"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl font-bold text-primary-600 mb-2">
                {stat.number}
              </div>
              <div className="text-gray-600">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="py-16"
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            Why Choose Agro_C?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our platform combines advanced AI technology with expert agricultural knowledge 
            to provide the most accurate plant disease identification and treatment solutions.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="card p-6 text-center hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {feature.description}
                </p>
              </motion.div>
            )
          })}
        </div>
      </motion.section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-8 text-center text-white"
        >
          <h2 className="text-3xl font-bold mb-4">
            Ready to Protect Your Plants?
          </h2>
          <p className="text-lg mb-6 opacity-90">
            Join thousands of farmers who trust Agro_C for accurate plant disease diagnosis.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              to="/login"
              className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary-600 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </motion.section>
      )}
    </div>
  )
}

export default Home
