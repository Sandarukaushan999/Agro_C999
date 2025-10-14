import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  UserCredential
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Temporary flag to disable Firestore operations to prevent 400 errors
const DISABLE_FIRESTORE = true;

// Types
interface PredictionHistory {
  id: string;
  imageUrl: string;
  prediction: string;
  confidence: number;
  timestamp: Timestamp;
  imageName: string;
}

interface Solution {
  id: string;
  disease: string;
  solution: string;
  prevention: string;
  timestamp: Timestamp;
}

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Timestamp;
  lastLoginAt: Timestamp;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<UserCredential>;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signInWithGoogle: () => Promise<UserCredential>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (displayName: string, photoURL?: string) => Promise<void>;
  savePrediction: (imageUrl: string, prediction: string, confidence: number, imageName: string) => Promise<string>;
  getPredictionHistory: (filter?: 'all' | 'thisWeek' | 'thisMonth') => Promise<PredictionHistory[]>;
  saveSolution: (disease: string, solution: string, prevention: string) => Promise<string>;
  getSolutions: () => Promise<Solution[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const FirebaseAuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Google Auth Provider
  const googleProvider = new GoogleAuthProvider();

  // Sign up with email and password
  const signUp = async (email: string, password: string, displayName: string): Promise<UserCredential> => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });

    // Get Firebase token
    const token = await result.user.getIdToken();
    localStorage.setItem('firebaseToken', token);

    // Create user profile in Firestore (only if Firestore is enabled)
    if (!DISABLE_FIRESTORE) {
      try {
        const userProfile: UserProfile = {
          uid: result.user.uid,
          email: result.user.email!,
          displayName: displayName,
          photoURL: result.user.photoURL || undefined,
          createdAt: Timestamp.now(),
          lastLoginAt: Timestamp.now()
        };

        await setDoc(doc(db, 'users', result.user.uid), userProfile);
        setUserProfile(userProfile);
      } catch (error) {
        console.warn('Failed to save user profile to Firestore:', error);
        // Continue without Firestore - user can still use the app
      }
    } else {
      // Create a local user profile without Firestore
      const userProfile: UserProfile = {
        uid: result.user.uid,
        email: result.user.email!,
        displayName: displayName,
        photoURL: result.user.photoURL || undefined,
        createdAt: Timestamp.now(),
        lastLoginAt: Timestamp.now()
      };
      setUserProfile(userProfile);
    }

    return result;
  };

  // Sign in with email and password
  const signIn = async (email: string, password: string): Promise<UserCredential> => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    
    // Get Firebase token
    const token = await result.user.getIdToken();
    localStorage.setItem('firebaseToken', token);

    // Update last login time (only if Firestore is enabled)
    if (!DISABLE_FIRESTORE && userProfile) {
      try {
        await setDoc(doc(db, 'users', result.user.uid), {
          ...userProfile,
          lastLoginAt: Timestamp.now()
        }, { merge: true });
      } catch (error) {
        console.warn('Failed to update last login time in Firestore:', error);
      }
    }

    return result;
  };

  // Sign in with Google
  const signInWithGoogle = async (): Promise<UserCredential> => {
    const result = await signInWithPopup(auth, googleProvider);
    
    // Get Firebase token
    const token = await result.user.getIdToken();
    localStorage.setItem('firebaseToken', token);

    // Check if user profile exists, if not create one (only if Firestore is enabled)
    if (!DISABLE_FIRESTORE) {
      try {
        const userDoc = await getDoc(doc(db, 'users', result.user.uid));
        if (!userDoc.exists()) {
          const userProfile: UserProfile = {
            uid: result.user.uid,
            email: result.user.email!,
            displayName: result.user.displayName || 'User',
            photoURL: result.user.photoURL || undefined,
            createdAt: Timestamp.now(),
            lastLoginAt: Timestamp.now()
          };
          await setDoc(doc(db, 'users', result.user.uid), userProfile);
          setUserProfile(userProfile);
        } else {
          // Update last login time
          await setDoc(doc(db, 'users', result.user.uid), {
            lastLoginAt: Timestamp.now()
          }, { merge: true });
        }
      } catch (error) {
        console.warn('Failed to handle Google sign-in with Firestore:', error);
        // Create local profile as fallback
        const userProfile: UserProfile = {
          uid: result.user.uid,
          email: result.user.email!,
          displayName: result.user.displayName || 'User',
          photoURL: result.user.photoURL || undefined,
          createdAt: Timestamp.now(),
          lastLoginAt: Timestamp.now()
        };
        setUserProfile(userProfile);
      }
    } else {
      // Create local profile without Firestore
      const userProfile: UserProfile = {
        uid: result.user.uid,
        email: result.user.email!,
        displayName: result.user.displayName || 'User',
        photoURL: result.user.photoURL || undefined,
        createdAt: Timestamp.now(),
        lastLoginAt: Timestamp.now()
      };
      setUserProfile(userProfile);
    }

    return result;
  };

  // Logout
  const logout = async (): Promise<void> => {
    await signOut(auth);
    localStorage.removeItem('firebaseToken');
    setUserProfile(null);
  };

  // Reset password
  const resetPassword = async (email: string): Promise<void> => {
    await sendPasswordResetEmail(auth, email);
  };

  // Update user profile
  const updateUserProfile = async (displayName: string, photoURL?: string): Promise<void> => {
    if (currentUser) {
      await updateProfile(currentUser, { displayName, photoURL });
      
      // Update Firestore profile
      await setDoc(doc(db, 'users', currentUser.uid), {
        displayName,
        photoURL
      }, { merge: true });
      
      // Update local state
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          displayName,
          photoURL
        });
      }
    }
  };

  // Save prediction to user's history
  const savePrediction = async (
    imageUrl: string, 
    prediction: string, 
    confidence: number, 
    imageName: string
  ): Promise<string> => {
    if (!currentUser) throw new Error('User must be logged in to save predictions');
    
    if (DISABLE_FIRESTORE) {
      // Save to local storage with user association
      const predictionData: PredictionHistory = {
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        imageUrl,
        prediction,
        confidence,
        timestamp: Timestamp.now(),
        imageName
      };
      
      // Get existing predictions from localStorage for this user
      const userPredictionsKey = `predictions_${currentUser.uid}`;
      const existingPredictions = JSON.parse(localStorage.getItem(userPredictionsKey) || '[]');
      existingPredictions.push(predictionData);
      
      // Save back to localStorage
      localStorage.setItem(userPredictionsKey, JSON.stringify(existingPredictions));
      
      console.log('Prediction saved to local storage:', predictionData.id);
      return predictionData.id;
    }
    
    try {
      const predictionData: Omit<PredictionHistory, 'id'> = {
        imageUrl,
        prediction,
        confidence,
        timestamp: Timestamp.now(),
        imageName
      };
      
      const docRef = await addDoc(collection(db, 'users', currentUser.uid, 'predictions'), predictionData);
      return docRef.id;
    } catch (error) {
      console.error('Failed to save prediction to Firestore:', error);
      throw new Error('Failed to save prediction. Please try again.');
    }
  };

  // Get user's prediction history with optional filtering
  const getPredictionHistory = async (filter: 'all' | 'thisWeek' | 'thisMonth' = 'all'): Promise<PredictionHistory[]> => {
    if (!currentUser) return [];
    
    if (DISABLE_FIRESTORE) {
      // Load predictions from localStorage for this user
      try {
        const userPredictionsKey = `predictions_${currentUser.uid}`;
        const predictionsData = localStorage.getItem(userPredictionsKey);
        if (!predictionsData) {
          console.log('No predictions found in local storage for user:', currentUser.uid);
          return [];
        }
        
        let predictions = JSON.parse(predictionsData);
        
        // Apply filtering
        if (filter !== 'all') {
          const now = new Date();
          const filterDate = new Date();
          
          if (filter === 'thisWeek') {
            // Get start of this week (Sunday)
            const dayOfWeek = now.getDay();
            filterDate.setDate(now.getDate() - dayOfWeek);
            filterDate.setHours(0, 0, 0, 0);
          } else if (filter === 'thisMonth') {
            // Get start of this month
            filterDate.setDate(1);
            filterDate.setHours(0, 0, 0, 0);
          }
          
          predictions = predictions.filter((prediction: PredictionHistory) => {
            const predictionDate = new Date(prediction.timestamp.seconds * 1000);
            return predictionDate >= filterDate;
          });
        }
        
        // Sort by timestamp descending (newest first)
        predictions.sort((a: PredictionHistory, b: PredictionHistory) => {
          return b.timestamp.seconds - a.timestamp.seconds;
        });
        
        console.log(`Loaded ${predictions.length} predictions from local storage (filter: ${filter})`);
        return predictions;
      } catch (error) {
        console.error('Failed to load predictions from localStorage:', error);
        return [];
      }
    }
    
    try {
      const q = query(
        collection(db, 'users', currentUser.uid, 'predictions'),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PredictionHistory));
    } catch (error) {
      console.error('Failed to load prediction history:', error);
      return []; // Return empty array if Firestore is not available
    }
  };

  // Save solution
  const saveSolution = async (disease: string, solution: string, prevention: string): Promise<string> => {
    if (DISABLE_FIRESTORE) {
      console.log('Firestore disabled - solution not saved to database');
      return 'local-solution-id'; // Return a dummy ID
    }
    
    try {
      const solutionData: Omit<Solution, 'id'> = {
        disease,
        solution,
        prevention,
        timestamp: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, 'solutions'), solutionData);
      return docRef.id;
    } catch (error) {
      console.error('Failed to save solution to Firestore:', error);
      throw new Error('Failed to save solution. Please try again.');
    }
  };

  // Get all solutions
  const getSolutions = async (): Promise<Solution[]> => {
    if (DISABLE_FIRESTORE) {
      console.log('Firestore disabled - returning empty solutions list');
      return [];
    }
    
    try {
      const q = query(collection(db, 'solutions'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Solution));
    } catch (error) {
      console.error('Failed to load solutions from Firestore:', error);
      return []; // Return empty array if Firestore is not available
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Get fresh token and store it
        try {
          const token = await user.getIdToken();
          localStorage.setItem('firebaseToken', token);
        } catch (error) {
          console.warn('Failed to get Firebase token:', error);
        }
        
        // Load user profile from Firestore (only if Firestore is enabled)
        if (!DISABLE_FIRESTORE) {
          try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
              setUserProfile(userDoc.data() as UserProfile);
            }
          } catch (error) {
            console.warn('Failed to load user profile from Firestore:', error);
            // Continue without profile data - user can still use the app
          }
        } else {
          // Create a basic local profile without Firestore
          const userProfile: UserProfile = {
            uid: user.uid,
            email: user.email!,
            displayName: user.displayName || 'User',
            photoURL: user.photoURL || undefined,
            createdAt: Timestamp.now(),
            lastLoginAt: Timestamp.now()
          };
          setUserProfile(userProfile);
        }
      } else {
        localStorage.removeItem('firebaseToken');
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    logout,
    resetPassword,
    updateUserProfile,
    savePrediction,
    getPredictionHistory,
    saveSolution,
    getSolutions
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
