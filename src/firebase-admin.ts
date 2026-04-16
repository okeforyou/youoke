import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK (singleton pattern)
if (!admin.apps.length) {
  try {
    // สำหรับ Vercel: ใช้ environment variables
    // Environment Variable Fallbacks
    const cleanEnv = (val: string | undefined) => val ? val.trim().replace(/\\n/g, '\n') : undefined;

    let serviceAccount: any = undefined;

    // 1. Try Loading from Environment Variables (Vercel Style)
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      try {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      } catch (e) {
        console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_KEY env');
      }
    }

    // 2. Fallback: Try Loading from Local File (Plesk/Local Style)
    if (!serviceAccount) {
        try {
            const fs = require('fs');
            const path = require('path');
            const keyPath = path.join(process.cwd(), 'serviceAccountKey.json');
            if (fs.existsSync(keyPath)) {
                console.log('📂 Firebase Admin: Loading credentials from serviceAccountKey.json');
                serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
            }
        } catch (e) {
            console.warn('⚠️ Firebase Admin: serviceAccountKey.json not found or invalid');
        }
    }

    const privateKey = serviceAccount?.private_key || (process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined);

    const clientEmail = serviceAccount?.client_email || cleanEnv(process.env.FIREBASE_CLIENT_EMAIL) || cleanEnv(process.env.CLIENT_EMAIL);
    const projectId = serviceAccount?.project_id || cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) || cleanEnv(process.env.NEXT_PUBLIC_PROJECT_ID);
    const databaseURL = serviceAccount?.database_url || cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL) || cleanEnv(process.env.NEXT_PUBLIC_DATABASE_URL) || `https://${projectId}.firebaseio.com`;

    if (!privateKey || !clientEmail || !projectId) {
      const missing = [];
      if (!privateKey) missing.push('FIREBASE_PRIVATE_KEY');
      if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
      if (!projectId) missing.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
      
      console.error(`❌ Firebase Admin - Missing environment variables: ${missing.join(', ')}`);
      throw new Error(`Firebase Admin credentials not configured. Missing: ${missing.join(', ')}`);
    }

    // 🛡️ Final Sanitize for Private Key (Remove quotes and fix escapes)
    const finalPrivateKey = privateKey.replace(/^['"]|['"]$/g, '').replace(/\\n/g, '\n');

    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: projectId,
          clientEmail: clientEmail,
          privateKey: finalPrivateKey,
        }),
        databaseURL: databaseURL,
      });
    } catch (e: any) {
      if (!/already exists/.test(e.message)) {
        console.error('Firebase Admin init error', e);
      }
    }

    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error);
    throw error;
  }
}

export const adminAuth = admin.apps.length ? admin.auth() : null;
export const adminDb = admin.apps.length ? admin.database() : null;
export const adminFirestore = admin.apps.length ? admin.firestore() : null;
export const adminMessaging = admin.apps.length ? admin.messaging() : null;

export default admin;
