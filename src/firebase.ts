// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from 'firebase/app'
// https://firebase.google.com/docs/web/setup#available-libraries
import { getAuth, setPersistence, indexedDBLocalPersistence, browserLocalPersistence } from 'firebase/auth'
import { getFirestore, enableIndexedDbPersistence, enableMultiTabIndexedDbPersistence } from 'firebase/firestore'
import { getDatabase } from 'firebase/database'
import { getStorage } from 'firebase/storage'
import { getMessaging, isSupported, Messaging } from 'firebase/messaging'

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
    'AIzaSyAtUvNGX9ibvl4YCNURA9q3XYJusa-iYDc', // Fallback: Production Key
  authDomain: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) ||
    cleanEnv(process.env.NEXT_PUBLIC_AUTH_DOMAIN) ||
    'playokeforyou.firebaseapp.com',
  projectId: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) ||
    cleanEnv(process.env.NEXT_PUBLIC_PROJECT_ID) ||
    'playokeforyou',
  storageBucket: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) ||
    cleanEnv(process.env.NEXT_PUBLIC_STORAGE_BUCKET) ||
    'playokeforyou.appspot.com', // Try old format first as fallback
  messagingSenderId: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) ||
    cleanEnv(process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID),
  appId: cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_APP_ID) ||
    cleanEnv(process.env.NEXT_PUBLIC_APP_ID) ||
    '1:1234567890:web:dummy1234567890abcdef',
  databaseURL: databaseURL || 'https://playokeforyou-default-rtdb.asia-southeast1.firebasedatabase.app',
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
let messaging: Messaging | null = null;

try {
  if (typeof window !== 'undefined') {
    console.log('🔥 [Firebase] Config Info:', {
      projectId: firebaseConfig.projectId,
      authDomain: firebaseConfig.authDomain,
      hasKey: !!firebaseConfig.apiKey,
      keySuffix: firebaseConfig.apiKey?.slice(-4)
    });
  }

  // Check if Firebase is already initialized
  if (!getApps().length && firebaseConfig.apiKey !== 'dummy-api-key') {
    console.log('🔥 [Firebase] Initializing new app...');
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    database = getFirestore(app);
    realtimeDb = getDatabase(app);
    storage = getStorage(app);

    // Initialize Messaging safely
    if (typeof window !== 'undefined') {
      isSupported().then((supported) => {
        if (supported && app) {
          messaging = getMessaging(app);
          console.log('🔥 [Firebase] Messaging Initialized');
        }
      }).catch(err => {
        console.warn('🔥 [Firebase] Messaging check failed:', err);
      });
    }

    // Enable auth persistence for instant auth checks
    // Force LocalStorage to avoid IndexedDB latency/errors (Dec 29, 2025)
    if (typeof window !== 'undefined' && auth) {
      console.log('🔥 [Firebase] Setting browserLocalPersistence...');
      setPersistence(auth, browserLocalPersistence)
        .then(() => console.log('🔥 [Firebase] Persistence Set: Success'))
        .catch((err) => {
          console.warn('🔥 [Firebase] Auth persistence failed:', err);
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

    if (typeof window !== 'undefined') {
      isSupported().then((supported) => {
        if (supported && app) {
          messaging = getMessaging(app);
        }
      });
    }
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
export { app, auth, database, realtimeDb, storage, messaging };
export { database as db }; // Alias for admin pages
