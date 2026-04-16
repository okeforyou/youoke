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

/**
 * 🛡️ Quota Guardian Utility
 * Detecting and notifying when Firestore Quota is exceeded (Code 8)
 */
export const QuotaGuardian = {
    /**
     * Check if the error is a Firestore Quota Exceeded error
     */
    isQuotaError: (error: any): boolean => {
        const code = error?.code;
        const message = error?.message || "";
        // Code 8 = RESOURCE_EXHAUSTED
        return code === 8 || code === 'resource-exhausted' || message.includes('Quota exceeded') || message.includes('RESOURCE_EXHAUSTED');
    },

    /**
     * Send emergency notification to Admin via LINE
     */
    notifyAdmin: async (error: any, context: string) => {
        const adminUid = process.env.LINE_ADMIN_USER_ID;
        const channelToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

        if (!adminUid || !channelToken) {
            console.warn('⚠️ QuotaGuardian: Cannot notify admin, LINE credentials missing');
            return;
        }

        const errorMessage = error?.message || 'Unknown Error';
        const timestamp = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' });
        
        const payload = {
            to: adminUid,
            messages: [
                {
                    type: 'text',
                    text: `🚨 [YouOKE Quota Alert]\n\nพบปัญหา Quota Firestore เต็ม!\n📍 Context: ${context}\n⏱️ Time: ${timestamp}\n❌ Error: ${errorMessage}\n\nระบบจะทำการลดระดับการทำงาน (Graceful Degradation) อัตโนมัติครับ`
                }
            ]
        };

        try {
            const response = await fetch('https://api.line.me/v2/bot/message/push', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${channelToken}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                console.log('✅ QuotaGuardian: Admin notified successfully via LINE');
            } else {
                const data = await response.json();
                console.error('❌ QuotaGuardian: LINE API failed', data);
            }
        } catch (e) {
            console.error('❌ QuotaGuardian: Failed to send LINE push', e);
        }
    }
};

/**
 * Wrapper for Firestore operations that automatically checks for Quota errors
 */
export const handleFirestoreError = async (error: any, context: string = 'Firestore Op') => {
    console.error(`❌ Firestore Error [${context}]:`, error);
    
    if (QuotaGuardian.isQuotaError(error)) {
        await QuotaGuardian.notifyAdmin(error, context);
    }
    
    return error;
};

export default admin;
