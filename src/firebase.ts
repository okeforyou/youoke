// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from 'firebase/app'
// https://firebase.google.com/docs/web/setup#available-libraries
import { getAuth, setPersistence, indexedDBLocalPersistence, browserLocalPersistence } from 'firebase/auth'
import { getFirestore, enableIndexedDbPersistence, enableMultiTabIndexedDbPersistence } from 'firebase/firestore'
import { getDatabase } from 'firebase/database'
import { getStorage } from 'firebase/storage'

// Force rebuild to pick up new environment variables (Nov 22, 2025)

// Sanitize helper
const cleanEnv = (val: string | undefined) => val ? val.trim().replace(/\\n/g, '\n') : undefined;

// Sanitize DATABASE_URL - remove trailing slash if present
const rawDatabaseURL = cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL) ||
  cleanEnv(process.env.NEXT_PUBLIC_DATABASE_URL) ||
  `https://${cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) || cleanEnv(process.env.NEXT_PUBLIC_PROJECT_ID) || 'dummy-project'}.firebaseio.com`;

const databaseURL = rawDatabaseURL?.replace(/\/$/, '');

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY) ||
    cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_API_KEY) ||
    cleanEnv(process.env.NEXT_PUBLIC_API_KEY) ||
    'dummy-api-key',
  authDomain: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) ||
    cleanEnv(process.env.NEXT_PUBLIC_AUTH_DOMAIN) ||
    'dummy.firebaseapp.com',
  projectId: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) ||
    cleanEnv(process.env.NEXT_PUBLIC_PROJECT_ID) ||
    'dummy-project',
  storageBucket: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) ||
    cleanEnv(process.env.NEXT_PUBLIC_STORAGE_BUCKET) ||
    'dummy.appspot.com',
  messagingSenderId: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) ||
    cleanEnv(process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID),
  appId: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_APP_ID) ||
    cleanEnv(process.env.NEXT_PUBLIC_APP_ID),
  databaseURL: databaseURL,
};

// Initialize Firebase only if config is valid
// Import generic types
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { Database } from 'firebase/database';
import { FirebaseStorage } from 'firebase/storage';

// Parameters for safe initialization
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let database: Firestore | null = null;
let realtimeDb: Database | null = null;
let storage: FirebaseStorage | null = null;

try {
  // Check if Firebase is already initialized
  if (!getApps().length && firebaseConfig.apiKey !== 'dummy-api-key') {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    database = getFirestore(app);
    realtimeDb = getDatabase(app);
    storage = getStorage(app);

    // Enable auth persistence for instant auth checks
    // Force LocalStorage to avoid IndexedDB latency/errors (Dec 29, 2025)
    if (typeof window !== 'undefined' && auth) {
      setPersistence(auth, browserLocalPersistence).catch((err) => {
        console.warn('Auth persistence failed:', err);
      });
    }

    // Enable offline persistence for faster loads
    // Disabled to prevent IndexedDB errors/warnings on Login (Dec 29, 2025)
    /*
    if (typeof window !== 'undefined' && database) {
      enableMultiTabIndexedDbPersistence(database).catch((err) => {
        console.warn('Firestore offline persistence disabled (IndexedDB error or multiple tabs):', err.code);
      });
    }
    */
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

// Export with common aliases
export { app, auth, database, realtimeDb, storage };
export { database as db }; // Alias for admin pages
