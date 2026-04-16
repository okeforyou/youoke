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

    // Determine target project ID from env first
    const envProjectId = cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) || cleanEnv(process.env.NEXT_PUBLIC_PROJECT_ID) || 'playokeforyou';

    // 2. Fallback: Try Loading from Local Files (Plesk/Local Style)
    if (!serviceAccount) {
        try {
            const fs = require('fs');
            const path = require('path');
            
            // Prioritize PROD file if it exists
            const prodKeyPath = path.join(process.cwd(), 'serviceAccountKey_PROD.json');
            const defaultKeyPath = path.join(process.cwd(), 'serviceAccountKey.json');
            
            let loadedPath = "";
            let fileKey: any = null;

            if (fs.existsSync(prodKeyPath)) {
                loadedPath = "serviceAccountKey_PROD.json";
                fileKey = JSON.parse(fs.readFileSync(prodKeyPath, 'utf8'));
            } else if (fs.existsSync(defaultKeyPath)) {
                loadedPath = "serviceAccountKey.json";
                fileKey = JSON.parse(fs.readFileSync(defaultKeyPath, 'utf8'));
            }

            if (fileKey) {
                // 🛡️ Guard: Only use local file if it matches the target project (if projectId is constrained)
                if (!envProjectId || fileKey.project_id === envProjectId) {
                    console.log(`📂 Firebase Admin: Using key from ${loadedPath} for project:`, fileKey.project_id);
                    serviceAccount = fileKey;
                } else {
                    console.warn(`⚠️ Firebase Admin: Skipping ${loadedPath} because it belongs to ${fileKey.project_id} but we need ${envProjectId}`);
                }
            }
        } catch (e) {
            console.warn('⚠️ Firebase Admin: Local JSON loading error');
        }
    }

    const privateKey = serviceAccount?.private_key || (process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined);

    const clientEmail = serviceAccount?.client_email || cleanEnv(process.env.FIREBASE_CLIENT_EMAIL) || cleanEnv(process.env.CLIENT_EMAIL);
    const projectId = serviceAccount?.project_id || envProjectId;
    const databaseURL = serviceAccount?.database_url || cleanEnv(process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL) || cleanEnv(process.env.NEXT_PUBLIC_DATABASE_URL) || `https://${projectId}.firebaseio.com`;

    if (!privateKey || !clientEmail || !projectId) {
      const missing = [];
      if (!privateKey) missing.push('FIREBASE_PRIVATE_KEY');
      if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
      if (!projectId) missing.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
      
      console.error(`❌ Firebase Admin - Missing environment variables: ${missing.join(', ')}`);
      throw new Error(`Firebase Admin credentials not configured. Missing: ${missing.join(', ')}`);
    }

    // 🛡️ Final Sanitize for Private Key
    const finalPrivateKey = privateKey.replace(/^['"]|['"]$/g, '').replace(/\\n/g, '\n');

    try {
      console.log(`🔥 Firebase Admin: Initializing for Project [${projectId}] with Key [${clientEmail}]`);
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
