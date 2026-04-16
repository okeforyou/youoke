import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminFirestore } from '@/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Simple check for Admin role would be better, but for now we just check if Firebase Admin exists
  try {
    const hasAdmin = !!adminAuth && !!adminFirestore;
    
    // Mask private key but check presence
    const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY || '';
    const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '';
    
    const envStatus = {
      PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'MISSING (Using Fallback?)',
      HAS_PRIVATE_KEY: privateKeyRaw.length > 0,
      HAS_SERVICE_ACCOUNT: serviceAccountRaw.length > 0,
      PRIVATE_KEY_START: privateKeyRaw.substring(0, 20) + '...',
      CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || 'MISSING',
      appVersionEnv: process.env.NEXT_PUBLIC_APP_VERSION || 'not set',
      nodeEnv: process.env.NODE_ENV,
    };

    let adminTest = "Not Tested";
    if (hasAdmin) {
        try {
            // Try a small read to verify Admin SDK
            const testDoc = await adminFirestore!.collection('users').limit(1).get();
            adminTest = `Success (Found ${testDoc.size} users)`;
        } catch (e: any) {
            adminTest = `Failed: ${e.message}`;
        }
    }

    return res.status(200).json({
      success: true,
      adminConfigured: hasAdmin,
      adminProjectId: (adminFirestore as any)?._databaseId?._projectId || 'Unknown',
      adminClientEmail: (adminAuth as any)?.app?.options?.credential?.clientEmail || 'Private',
      env: envStatus,
      adminTestResult: adminTest,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
