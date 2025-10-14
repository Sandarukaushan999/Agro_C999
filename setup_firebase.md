# Firebase Setup Instructions

## 1. Firebase Console Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `cagro-f5c27`
3. Go to Project Settings (gear icon)
4. Go to Service Accounts tab
5. Click "Generate new private key"
6. Download the JSON file

## 2. Backend Environment Variables

Create a `.env` file in the `backend` directory with the following variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/agro_c

# JWT
JWT_SECRET=your_jwt_secret_here

# Firebase Admin SDK (from the downloaded JSON file)
FIREBASE_PRIVATE_KEY_ID=your_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_CLIENT_ID=your_client_id

# Server
PORT=5000
NODE_ENV=development
```

## 3. Firebase Authentication Setup

1. In Firebase Console, go to Authentication
2. Click "Get started"
3. Go to Sign-in method tab
4. Enable the following providers:
   - Email/Password
   - Google

## 4. Firestore Database Setup

1. In Firebase Console, go to Firestore Database
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location for your database

## 5. Firebase Security Rules

Update your Firestore security rules to allow authenticated users to read/write their own data:

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

## 6. Testing the Setup

1. Start the backend server: `cd backend && npm start`
2. Start the frontend: `cd frontend && npm run dev`
3. Try registering a new user
4. Try signing in with Google
5. Upload an image and check if prediction is saved to Firestore

## 7. Troubleshooting

- Make sure all environment variables are set correctly
- Check Firebase Console for any authentication errors
- Verify Firestore rules are properly configured
- Check browser console for any JavaScript errors




