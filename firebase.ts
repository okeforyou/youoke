// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from 'firebase/app'
// https://firebase.google.com/docs/web/setup#available-libraries
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY || 'dummy-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'dummy.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'dummy-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'dummy.appspot.com',
};

// Initialize Firebase only if config is valid
let app;
let auth;
let database;

try {
  // Check if Firebase is already initialized
  if (!getApps().length && firebaseConfig.apiKey !== 'dummy-api-key') {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    database = getFirestore(app);
  } else if (getApps().length > 0) {
    app = getApps()[0];
    auth = getAuth(app);
    database = getFirestore(app);
  } else {
    // Firebase not configured - use mock values
    console.warn('Firebase not configured. Using mock values.');
    app = null;
    auth = null;
    database = null;
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  app = null;
  auth = null;
  database = null;
}

export { app, auth, database };
