import { NextApiRequest, NextApiResponse } from 'next';
import admin, { adminMessaging, adminFirestore } from '@/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { title, body, targetUids } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required' });
  }

  if (!adminFirestore) {
    return res.status(500).json({ error: 'Firebase services not configured' });
  }

  try {
    // 🛡️ v3.9.0 Pivot: In-App System News & Announcements via Firestore.
    // (Bypasses external push notification friction)
    let pushResult: any = { success: true, mode: 'in-app-news' };

    // 🚀 Step 1: Persist to Firestore (Atomically from server-side)
    const db = adminFirestore;
    if (targetUids && Array.isArray(targetUids) && targetUids.length > 0) {
      // Batch writes (max 500)
      const chunks = [];
      for (let i = 0; i < targetUids.length; i += 500) {
        chunks.push(targetUids.slice(i, i + 500));
      }

      for (const chunk of chunks) {
        const batch = db.batch();
        chunk.forEach((uid: string) => {
          const notifRef = db.collection('notifications').doc();
          batch.set(notifRef, {
            userId: uid,
            title,
            body,
            type: 'admin',
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        });
        await batch.commit();
      }
    } else if (!targetUids) {
      // Single entry for 'all'
      await db.collection('notifications').add({
        userId: 'all',
        title,
        body,
        type: 'broadcast',
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return res.status(200).json({ 
      success: true, 
      pushResult,
      deliveredTo: targetUids?.length || 'all' 
    });

  } catch (error: any) {
    console.error('❌ [Broadcast API] Critical Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal Server Error' 
    });
  }
}
