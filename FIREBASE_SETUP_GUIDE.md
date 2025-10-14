# 🔥 Firebase Setup Guide - Fix Authentication & Firestore Issues

## 🚨 **Current Issues & Solutions**

### **Issue 1: Cross-Origin-Opener-Policy Error**
✅ **FIXED** - Updated `vite.config.ts` with proper headers

### **Issue 2: Firestore Connection Errors**
❌ **NEEDS SETUP** - Firestore database not configured

---

## 📋 **Step-by-Step Firebase Setup**

### **1. Firebase Console Setup**

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project**: `cagro-f5c27`
3. **Enable Authentication**:
   - Go to "Authentication" → "Get started"
   - Go to "Sign-in method" tab
   - Enable "Email/Password"
   - Enable "Google" (add your domain: `localhost:5174`)

### **2. Create Firestore Database**

1. **Go to Firestore Database**:
   - Click "Create database"
   - Choose "Start in test mode" (for development)
   - Select a location (choose closest to you)

2. **Set up Security Rules**:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Users can read/write their own user document
       match /users/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       
       // Users can read/write their own predictions
       match /users/{userId}/predictions/{predictionId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
       
       // Anyone can read solutions, authenticated users can write
       match /solutions/{solutionId} {
         allow read: if true;
         allow write: if request.auth != null;
       }
     }
   }
   ```

### **3. Backend Environment Setup**

Create a `.env` file in the `backend` directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/agro_c

# JWT
JWT_SECRET=your_jwt_secret_here

# Firebase Admin SDK (get from Firebase Console → Project Settings → Service Accounts)
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_CLIENT_ID=your_client_id

# Server
PORT=5000
NODE_ENV=development
```

**To get Firebase Admin SDK credentials:**
1. Go to Firebase Console → Project Settings
2. Go to "Service Accounts" tab
3. Click "Generate new private key"
4. Download the JSON file
5. Copy the values to your `.env` file

### **4. Restart Development Server**

After making changes to `vite.config.ts`, restart your development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
cd frontend
npm run dev
```

---

## 🧪 **Testing the Setup**

### **Test 1: Authentication**
1. Go to `http://localhost:5174`
2. Try registering with email/password
3. Try Google sign-in
4. Check if user appears in Firebase Console → Authentication

### **Test 2: Firestore**
1. After signing in, go to Profile page
2. Upload an image for prediction
3. Check if data appears in Firebase Console → Firestore Database

### **Test 3: Error Handling**
- The app should now work even if Firestore is not set up
- Authentication will work independently
- Prediction saving will show error messages if Firestore fails

---

## 🔧 **Troubleshooting**

### **If Google Sign-in Still Fails:**
1. Check browser console for COOP errors
2. Try in incognito mode
3. Clear browser cache
4. Make sure `localhost:5174` is added to authorized domains in Firebase

### **If Firestore Still Fails:**
1. Check Firebase Console → Firestore Database exists
2. Verify security rules are set correctly
3. Check if project ID matches: `cagro-f5c27`
4. Try creating a test document manually in Firestore

### **If Backend Auth Fails:**
1. Verify `.env` file has correct Firebase credentials
2. Check if Firebase Admin SDK is installed: `npm list firebase-admin`
3. Restart backend server after adding `.env`

---

## 📱 **Current Status**

✅ **Fixed Issues:**
- Cross-Origin-Opener-Policy error
- Added error handling for Firestore operations
- App works even if Firestore is not configured

⏳ **Next Steps:**
1. Set up Firestore database in Firebase Console
2. Configure security rules
3. Add Firebase Admin SDK credentials to backend
4. Test complete authentication flow

The application should now work for authentication even without Firestore setup, and will gracefully handle Firestore errors when they occur.




