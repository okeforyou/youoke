import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminFirestore, handleFirestoreError } from '../../../../firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Security check: Only allow certain methods or a temporary secret key
  // For this one-off task, we will run it and then delete the file.
  
  if (!adminAuth || !adminFirestore) {
    return res.status(500).json({ error: 'Firebase Admin not initialized' });
  }

  const cutOffDate = new Date();
  cutOffDate.setDate(cutOffDate.getDate() - 1);

  console.log(`🚀 Starting API Bulk Cleanup for users before ${cutOffDate.toISOString()}`);
  
  let deletedAuthCount = 0;
  let deletedFirestoreCount = 0;
  let pageToken: string | undefined = undefined;
  let scanCount = 0;
  const maxScan = 5000; // Scan up to 5000 total users per request
  const maxToDelete = 500; // Stop collecting once we find 500 candidates to keep the request snappy
  
  try {
    const anonymousUids: string[] = [];
    
    // 🔍 Loop to find candidates across multiple pages
    do {
      const listUsersResult = await adminAuth.listUsers(1000, pageToken);
      
      listUsersResult.users.forEach((userRecord) => {
        scanCount++;
        const isAnonymous = userRecord.providerData.length === 0 && !userRecord.email;
        const isOldEnough = new Date(userRecord.metadata.creationTime) < cutOffDate;
        
        if (isAnonymous && isOldEnough && anonymousUids.length < maxToDelete) {
          anonymousUids.push(userRecord.uid);
        }
      });

      pageToken = listUsersResult.pageToken;
      
      // Stop if we scanned too many, found enough to delete, or reached the end
    } while (pageToken && scanCount < maxScan && anonymousUids.length < maxToDelete);

    if (anonymousUids.length > 0) {
      // 1. Delete from Auth (Efficiently in one call)
      const deleteResult = await adminAuth.deleteUsers(anonymousUids);
      deletedAuthCount = deleteResult.successCount;
      
      // 2. Delete from Firestore in chunks of 500 (Firestore Batch limit)
      for (let i = 0; i < anonymousUids.length; i += 500) {
        const chunk = anonymousUids.slice(i, i + 500);
        const batch = adminFirestore!.batch();
        chunk.forEach((uid) => {
          batch.delete(adminFirestore!.collection('users').doc(uid));
        });
        await batch.commit();
        deletedFirestoreCount += chunk.length;
      }
    }

    return res.status(200).json({
      success: true,
      message: scanCount >= maxScan ? "Reached scan limit." : (pageToken ? "Found enough candidates." : "Cleanup finished."),
      scanSize: scanCount,
      foundCandidates: anonymousUids.length,
      deletedAuth: deletedAuthCount,
      deletedFirestore: deletedFirestoreCount,
      nextPageToken: pageToken || null,
      instruction: pageToken ? "Call again to process more." : "System is clean."
    });

  } catch (error: any) {
    await handleFirestoreError(error, 'Bulk Cleanup API');
    return res.status(500).json({ error: error.message });
  }
}
