import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminFirestore } from '@/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { uid, disabled } = req.body;

    if (!uid) {
      return res.status(400).json({ error: 'UID is required' });
    }

    if (!adminAuth || !adminFirestore) {
      return res.status(500).json({ error: 'Firebase Admin not configured' });
    }

    console.log(`🛡️ [Admin] Toggling Auth status for ${uid}: ${disabled ? 'DISABLE' : 'ENABLE'}`);

    // 1. Update Firebase Authentication
    await adminAuth.updateUser(uid, { disabled: disabled });

    // 2. Sync to Firestore for UI consistency
    await adminFirestore.collection('users').doc(uid).update({
      disabled: disabled,
      updatedAt: new Date()
    });

    return res.status(200).json({ 
      success: true, 
      message: `User ${uid} status updated to ${disabled ? 'Disabled' : 'Enabled'} in Auth and Firestore.` 
    });
  } catch (error: any) {
    console.error('❌ Toggle Auth Status Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
