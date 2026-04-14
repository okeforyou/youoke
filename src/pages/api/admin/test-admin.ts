import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth } from '../../../../firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (!adminAuth) {
      return res.status(500).json({ error: 'Firebase Admin Auth not initialized' });
    }
    
    // Attempt a simple call
    const list = await adminAuth.listUsers(1);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Firebase Admin successfully connected!',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length,
      hasNewlines: process.env.FIREBASE_PRIVATE_KEY?.includes('\n')
    });
  } catch (error: any) {
    console.error('❌ Test Admin Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message,
      stack: error.stack,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length
    });
  }
}
