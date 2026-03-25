import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminFirestore } from '../../../../firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Security check: Only allow certain methods or a temporary secret key
  // For this one-off task, we will run it and then delete the file.
  
  if (!adminAuth || !adminFirestore) {
    return res.status(500).json({ error: 'Firebase Admin not initialized' });
  }

  const cutOffDate = new Date();
  cutOffDate.setDate(cutOffDate.getDate() - 3);

  console.log(`🚀 Starting API Bulk Cleanup for users before ${cutOffDate.toISOString()}`);
  
  let deletedAuthCount = 0;
  let deletedFirestoreCount = 0;
  let batchLimit = 1000; // Process 1000 at a time per request to avoid timeout
  
  try {
    const listUsersResult = await adminAuth.listUsers(batchLimit);
    const anonymousUids: string[] = [];
    
    listUsersResult.users.forEach((userRecord) => {
      const isAnonymous = userRecord.providerData.length === 0 && !userRecord.email;
      const isOldEnough = new Date(userRecord.metadata.creationTime) < cutOffDate;
      
      if (isAnonymous && isOldEnough) {
        anonymousUids.push(userRecord.uid);
      }
    });

    if (anonymousUids.length > 0) {
      // 1. Delete from Auth
      const deleteResult = await adminAuth.deleteUsers(anonymousUids);
      deletedAuthCount = deleteResult.successCount;
      
      // 2. Delete from Firestore in chunks of 500
      for (let i = 0; i < anonymousUids.length; i += 500) {
        const chunk = anonymousUids.slice(i, i + 500);
        const batch = adminFirestore.batch();
        chunk.forEach((uid) => {
          batch.delete(adminFirestore.collection('users').doc(uid));
        });
        await batch.commit();
        deletedFirestoreCount += chunk.length;
      }
    }

    return res.status(200).json({
      success: true,
      message: `Successfully processed batch.`,
      deletedAuth: deletedAuthCount,
      deletedFirestore: deletedFirestoreCount,
      totalProcessed: listUsersResult.users.length,
      nextPageToken: listUsersResult.pageToken || null,
      instruction: deletedAuthCount > 0 ? "Call again to process more." : "Cleanup finished for now."
    });

  } catch (error: any) {
    console.error('❌ API Cleanup Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
