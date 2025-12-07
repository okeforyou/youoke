import type { NextApiRequest, NextApiResponse } from 'next';
import { adminDb } from '../../firebase-admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { uid, email, displayName } = req.body;

    if (!uid || !email) {
      return res.status(400).json({ error: 'Missing uid or email' });
    }

    if (!adminDb) {
      return res.status(500).json({ error: 'Firebase Admin not initialized' });
    }

    const userProfile = {
      uid: uid,
      email: email,
      displayName: displayName || email.split('@')[0],
      phone: null,
      photoURL: null,
      role: 'user',
      subscription: {
        plan: 'free',
        startDate: null,
        endDate: null,
        status: 'active',
        paymentProof: null
      },
      settings: {
        autoPlayQueue: true,
        defaultVolume: 80,
        quality: 'auto',
        theme: 'dark',
        notifications: {
          expiryReminder: true,
          newAds: false
        }
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    console.log('Creating profile for UID:', uid);

    await adminDb.ref(`users/${uid}`).set(userProfile);

    console.log('✅ Profile created successfully');

    return res.status(200).json({
      success: true,
      message: 'Profile created successfully',
      profile: userProfile
    });
  } catch (error: any) {
    console.error('❌ Error creating profile:', error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
}
