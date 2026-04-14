import * as admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Initialize Firebase Admin SDK (singleton pattern)
if (!admin.apps.length) {
  try {
    let serviceAccount: any = null;

    // 1. Priority: Look for serviceAccountKey.json in the project root
    // This is most reliable for Plesk/Shared Hosting where Env Vars might be truncated.
    const keyPath = path.join(process.cwd(), 'serviceAccountKey.json');
    
    if (fs.existsSync(keyPath)) {
      try {
        const fileContent = fs.readFileSync(keyPath, 'utf8');
        serviceAccount = JSON.parse(fileContent);
        console.log('📦 Firebase Admin: Using credentials from serviceAccountKey.json');
      } catch (fileErr) {
        console.error('⚠️ Firebase Admin: Found serviceAccountKey.json but failed to parse it:', fileErr);
      }
    }

    // 2. Fallback: Use environment variables (Standard for Vercel)
    if (!serviceAccount) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY
        ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/^["']|["']$/g, '').trim()
        : undefined;

      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();

      if (privateKey && clientEmail && projectId) {
        serviceAccount = {
          projectId,
          clientEmail,
          privateKey,
        };
        console.log('🌐 Firebase Admin: Using credentials from Environment Variables');
      }
    }

    if (!serviceAccount) {
      console.error('❌ Firebase Admin - No credentials found (neither file nor env vars)');
      throw new Error('Firebase Admin credentials not configured');
    }

    const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL?.trim();

    // HYBRID MODE SAFEGUARD:
    if (serviceAccount.projectId === 'playokeforyou' && databaseURL?.includes('playokeforyou-dev')) {
      console.warn('⚠️ Hybrid Mode Detected: Prod Auth + Dev DB. Switching Admin SDK to use PROD Database URL to prevent hang.');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: serviceAccount.projectId === 'playokeforyou' && databaseURL?.includes('playokeforyou-dev') ? undefined : databaseURL,
    });

    console.log(`✅ Firebase Admin initialized successfully (Project: ${serviceAccount.projectId})`);
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error);
    throw error;
  }
}


// Safe initialization for database (adminDb) to prevent crash when databaseURL is undefined (Hybrid Mode)
let _adminDb = null;
try {
  if (admin.apps.length && admin.app().options.databaseURL) {
    _adminDb = admin.database();
  }
} catch (e) {
  console.warn('⚠️ adminDb initialization skipped (likely no databaseURL provided in Hybrid Mode)');
}

export const adminAuth = admin.apps.length ? admin.auth() : null;
export const adminDb = _adminDb;
export const adminFirestore = admin.apps.length ? admin.firestore() : null;

export default admin;
