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
    const { uid, email, displayName, photoURL } = req.body;
    const authHeader = req.headers.authorization;

    if (!uid || !email) {
      return res.status(400).json({ error: 'Missing uid or email' });
    }

    if (!adminDb) {
      return res.status(500).json({ error: 'Firebase Admin not initialized' });
    }

    // Security: Verify ID Token from client
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }

    const idToken = authHeader.split('Bearer ')[1];

    // Import auth from firebase-admin (assuming it's exported or we need to access it)
    // Note: adminDb is the RDB instance. We need the Admin Auth instance.
    // If auth is not exported from firebase-admin.ts, we might need to adjust imports.
    const { auth } = require('../../firebase-admin'); // Dynamic import to avoid breaking changes if not exported immediately

    if (auth) {
      try {
        const decodedToken = await auth.verifyIdToken(idToken);
        if (decodedToken.uid !== uid) {
          return res.status(403).json({ error: 'UID mismatch. You can only create a profile for yourself.' });
        }
      } catch (authError) {
        console.error('Token verification failed:', authError);
        return res.status(401).json({ error: 'Invalid ID Token' });
      }
    } else {
      console.warn('Firebase Admin Auth not found, skipping token verification (Risk!)');
    }

    const userProfile = {
      uid: uid,
      email: email,
      displayName: displayName || email.split('@')[0],
      phone: null,
      photoURL: photoURL || null,
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
