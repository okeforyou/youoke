import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminFirestore, handleFirestoreError } from '@/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    if (!adminAuth || !adminFirestore) {
      return res.status(500).json({ error: 'Firebase Admin not configured' });
    }

    console.log("🌪️ Syncing all users from Auth to Firestore...");

    // 1. List all users from Firebase Auth
    const listUsersResult = await adminAuth.listUsers(1000); // Sync up to 1000 users for now
    const authUsers = listUsersResult.users;

    const results = {
      totalFound: authUsers.length,
      created: 0,
      updated: 0,
      errors: 0
    };

    // 2. Process each user
    const BATCH_SIZE = 50;
    for (let i = 0; i < authUsers.length; i += BATCH_SIZE) {
      const batch = authUsers.slice(i, i + BATCH_SIZE);
      
      await Promise.all(batch.map(async (user) => {
        try {
          const userRef = adminFirestore.collection('users').doc(user.uid);
          const doc = await userRef.get();

          const baseData = {
            uid: user.uid,
            email: user.email || null,
            displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
            photoURL: user.photoURL || null,
            disabled: user.disabled || false, // Sync the disabled status from Auth
            updatedAt: new Date()
          };

          if (!doc.exists) {
            // Create missing profile
            await userRef.set({
              ...baseData,
              role: 'user',
              createdAt: new Date(user.metadata.creationTime || Date.now()),
              membership: {
                type: 'free',
                status: 'active'
              }
            });
            results.created++;
          } else {
            // Update existing status (sync disabled flag)
            await userRef.update({
                disabled: user.disabled || false,
                updatedAt: new Date()
            });
            results.updated++;
          }
        } catch (e) {
          await handleFirestoreError(e, `Sync User [${user.uid}]`);
          results.errors++;
        }
      }));
    }

    return res.status(200).json({ 
      success: true, 
      message: `Sync completed: Created ${results.created}, Updated ${results.updated}, Errors ${results.errors}`,
      results 
    });
  } catch (error: any) {
    await handleFirestoreError(error, 'Sync All Users');
    return res.status(500).json({ error: error.message });
  }
}
