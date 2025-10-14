const admin = require('firebase-admin')

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  const serviceAccount = {
    type: "service_account",
    project_id: "cagro-f5c27",
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: "https://accounts.google.com/o/oauth2/auth",
    token_uri: "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: "cagro-f5c27"
  })
}

const firebaseAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token, authorization denied'
      })
    }

    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(token)
    
    // Add user info to request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture
    }
    
    next()
  } catch (error) {
    console.error('Firebase auth error:', error)
    res.status(401).json({
      success: false,
      message: 'Token is not valid'
    })
  }
}

module.exports = firebaseAuth




