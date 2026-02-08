import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    try {
        const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
            ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
            : undefined;

        if (serviceAccount) {
            // Fix Vercel/Env newline issues in private key
            if (serviceAccount.private_key) {
                serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
            }

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
            });
            console.log("🔥 Firebase Admin Initialized");
        } else {
            console.warn("⚠️ FIREBASE_SERVICE_ACCOUNT_KEY missing. Admin features will fail.");
        }
    } catch (error) {
        console.error("Firebase Admin Init Error:", error);
    }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();
