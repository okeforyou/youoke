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
    const { uid } = req.body;

    if (!uid) {
      return res.status(400).json({ error: 'Missing uid' });
    }

    if (!adminDb) {
      return res.status(500).json({ error: 'Firebase Admin not initialized' });
    }

    console.log('Setting admin role for UID:', uid);

    const userRef = adminDb.ref(`users/${uid}`);
    const snapshot = await userRef.once('value');

    if (!snapshot.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = snapshot.val();
    console.log('Current role:', userData.role || 'none');

    // Update role to admin
    await userRef.update({
      role: 'admin',
      updatedAt: Date.now()
    });

    console.log('✅ User role updated to admin!');

    return res.status(200).json({
      success: true,
      message: 'User role updated to admin',
      uid,
      oldRole: userData.role || 'none',
      newRole: 'admin'
    });
  } catch (error: any) {
    console.error('❌ Error setting admin role:', error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
}
