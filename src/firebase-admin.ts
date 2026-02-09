import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK (singleton pattern)
if (!admin.apps.length) {
  try {
    // สำหรับ Vercel: ใช้ environment variables
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    // Environment Variable Fallbacks
    const cleanEnv = (val: string | undefined) => val ? val.trim().replace(/\\n/g, '\n') : undefined;

    const projectId = cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) || cleanEnv(process.env.NEXT_PUBLIC_PROJECT_ID);
    const clientEmail = cleanEnv(process.env.FIREBASE_CLIENT_EMAIL) || cleanEnv(process.env.CLIENT_EMAIL);
    const databaseURL = cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL) || cleanEnv(process.env.NEXT_PUBLIC_DATABASE_URL) || `https://${projectId}.firebaseio.com`;

    if (!privateKey || !clientEmail || !projectId) {
      console.error('❌ Firebase Admin - Missing environment variables:', {
        hasPrivateKey: !!privateKey,
        hasClientEmail: !!clientEmail,
        hasProjectId: !!projectId,
        hasDatabaseURL: !!databaseURL,
      });
      throw new Error('Firebase Admin credentials not configured');
    }

    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: projectId,
          clientEmail: clientEmail,
          privateKey: privateKey,
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

export default admin;
