// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from 'firebase/app'
// https://firebase.google.com/docs/web/setup#available-libraries
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getDatabase } from 'firebase/database'
import { getStorage } from 'firebase/storage'

// Force rebuild to pick up new environment variables (Nov 22, 2025)

// Sanitize DATABASE_URL - remove trailing slash if present
const rawDatabaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
  `https://${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'dummy-project'}.firebaseio.com`;
const databaseURL = rawDatabaseURL.replace(/\/$/, '');  // Remove trailing slash

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY || 'dummy-api-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'dummy.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'dummy-project',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'dummy.appspot.com',

  // IMPORTANT: Must include region in databaseURL (asia-southeast1)
  // Fallback URL without region will cause "Maximum call stack size exceeded" error
  // See: FIREBASE-CAST-TROUBLESHOOTING.md for details
  databaseURL: databaseURL,
};

// Initialize Firebase only if config is valid
let app;
let auth;
let database;
let realtimeDb;
let storage;

try {
  // Check if Firebase is already initialized
  if (!getApps().length && firebaseConfig.apiKey !== 'dummy-api-key') {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    database = getFirestore(app);
    realtimeDb = getDatabase(app);
    storage = getStorage(app);
  } else if (getApps().length > 0) {
    app = getApps()[0];
    auth = getAuth(app);
    database = getFirestore(app);
    realtimeDb = getDatabase(app);
    storage = getStorage(app);
  } else {
    // Firebase not configured - use mock values
    console.warn('Firebase not configured. Using mock values.');
    app = null;
    auth = null;
    database = null;
    realtimeDb = null;
    storage = null;
  }
} catch (error) {
  console.error('Firebase initialization error:', error);
  app = null;
  auth = null;
  database = null;
  realtimeDb = null;
  storage = null;
}

export { app, auth, database, realtimeDb, storage };
