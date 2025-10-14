// Simple test script to verify Firebase setup
const { initializeApp } = require('firebase/app');
const { getAuth } = require('firebase/auth');
const { getFirestore } = require('firebase/firestore');

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBgr4lkJE_7Ni0IZS4FQp5NuROUQtCtpuI",
  authDomain: "cagro-f5c27.firebaseapp.com",
  projectId: "cagro-f5c27",
  storageBucket: "cagro-f5c27.firebasestorage.app",
  messagingSenderId: "338841550633",
  appId: "1:338841550633:web:b958c09604e5359de44138",
  measurementId: "G-8ET7ST825F"
};

try {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  
  console.log('✅ Firebase initialized successfully!');
  console.log('✅ Auth service connected');
  console.log('✅ Firestore service connected');
  console.log('✅ Project ID:', firebaseConfig.projectId);
  
} catch (error) {
  console.error('❌ Firebase initialization failed:', error.message);
  process.exit(1);
}




