// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBgr4lkJE_7Ni0IZS4FQp5NuROUQtCtpuI",
  authDomain: "cagro-f5c27.firebaseapp.com",
  projectId: "cagro-f5c27",
  storageBucket: "cagro-f5c27.firebasestorage.app",
  messagingSenderId: "338841550633",
  appId: "1:338841550633:web:b958c09604e5359de44138",
  measurementId: "G-8ET7ST825F"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

export default app;




