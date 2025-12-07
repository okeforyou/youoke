import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminDb } from '../../firebase-admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      adminAuthInitialized: !!adminAuth,
      adminDbInitialized: !!adminDb,
      envVars: {
        hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
        privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
        hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL?.substring(0, 20) + '...',
        hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        hasDatabaseURL: !!process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
        databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
      },
      status: 'Firebase Admin initialized successfully',
    };

    return res.status(200).json(diagnostics);
  } catch (error: any) {
    return res.status(500).json({
      error: error.message,
      stack: error.stack,
    });
  }
}
