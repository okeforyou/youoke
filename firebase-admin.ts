import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK (singleton pattern)
if (!admin.apps.length) {
  try {
    // สำหรับ Vercel: ใช้ environment variables
    // ⚠️ IMPORTANT: Trim all values to remove trailing newlines from Vercel
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n').trim()
      : undefined;

    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
    const databaseURL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL?.trim();

    if (!privateKey || !clientEmail || !projectId) {
      console.error('❌ Firebase Admin - Missing environment variables:', {
        hasPrivateKey: !!privateKey,
        hasClientEmail: !!clientEmail,
        hasProjectId: !!projectId,
        hasDatabaseURL: !!databaseURL,
        // Debug: show actual values (first 20 chars only for security)
        clientEmailPreview: clientEmail?.substring(0, 20),
        projectIdPreview: projectId?.substring(0, 20),
      });
      throw new Error('Firebase Admin credentials not configured');
    }

    // HYBRID MODE SAFEGUARD:
    // If we are using PROD credentials (playokeforyou) but pointing to DEV Database (playokeforyou-dev),
    // the Admin SDK will hang indefinitely trying to connect to the unauthorized DB.
    // We must force it to use the PROD Database URL (or undefined) to allow Firestore to work.
    let targetDatabaseURL = databaseURL;
    if (projectId === 'playokeforyou' && databaseURL?.includes('playokeforyou-dev')) {
      console.warn('⚠️ Hybrid Mode Detected: Prod Auth + Dev DB. Admin SDK cannot access Dev DB with Prod Creds.');
      console.warn('⚠️ Switching Admin SDK to use PROD Database URL to prevent hang.');
      // Fallback to undefined to prevent RTDB connection attempt entirely.
      // This ensures Firestore works without hanging on unauthorized RTDB access.
      targetDatabaseURL = undefined;
    }

    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: projectId,
        clientEmail: clientEmail,
        privateKey: privateKey,
      }),
      databaseURL: targetDatabaseURL,
    });

    console.log('✅ Firebase Admin initialized successfully');
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
