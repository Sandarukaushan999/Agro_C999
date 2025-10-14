import { Routes, Route } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Upload from './pages/Upload'
import Solutions from './pages/Solutions'
import Profile from './pages/Profile'
import Login from './pages/Login'
import Register from './pages/Register'
import { FirebaseAuthProvider } from './contexts/FirebaseAuthContext'

function App() {
  return (
    <FirebaseAuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
        <Navbar />
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="container mx-auto px-4 py-8"
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/solutions" element={<Solutions />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </motion.main>
      </div>
    </FirebaseAuthProvider>
  )
}

export default App
