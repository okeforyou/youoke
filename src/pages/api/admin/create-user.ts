import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminFirestore } from '@/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // TODO: Add proper Admin Session Middleware check here
  
  const { email, password, displayName, role } = req.body;

  if (!email || !password || !displayName) {
    return res.status(400).json({ error: 'Email, Password, and Display Name are required' });
  }

  if (!adminAuth || !adminFirestore) {
    return res.status(500).json({ error: 'Firebase Admin not configured' });
  }

  try {
    // 1. Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
    });

    // 2. Create user document in Firestore
    await adminFirestore.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: email,
      displayName: displayName,
      role: role || 'user',
      createdAt: new Date(),
      membership: {
        type: 'free',
        status: 'active'
      },
      metadata: {
        registrationMethod: 'admin_manual'
      }
    });

    console.log(`✅ [Admin] Created new user: ${userRecord.uid} (${email})`);

    return res.status(200).json({ 
      success: true, 
      uid: userRecord.uid 
    });
  } catch (error: any) {
    console.error('❌ [Admin] Create User Error:', error);
    // Handle specific Firebase errors (e.g. email already exists)
    let message = error.message;
    if (error.code === 'auth/email-already-exists') {
      message = 'อีเมลนี้ถูกใช้งานไปแล้วในระบบ';
    }
    return res.status(500).json({ error: message });
  }
}
