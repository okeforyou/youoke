import { NextApiRequest, NextApiResponse } from 'next';
import { adminMessaging, adminFirestore } from '@/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Basic Admin Authorization (Should be enhanced with real session check)
  // TODO: Add proper middleware for admin check

  const { title, body, topic, targetUids } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required' });
  }

  if (!adminMessaging || !adminFirestore) {
    return res.status(500).json({ error: 'Firebase services not configured' });
  }

  try {
    const tokens: string[] = [];

    // 1. Get tokens for target users or all users
    if (targetUids && Array.isArray(targetUids)) {
      for (const uid of targetUids) {
        const userDoc = await adminFirestore.collection('users').doc(uid).get();
        const userData = userDoc.data();
        if (userData?.metadata?.fcmTokens) {
          tokens.push(...userData.metadata.fcmTokens);
        }
      }
    } else {
      // Broadcast to all (Simplified: just use a FCM Topic if managed)
      // For now, let's assume we use a 'broadcast' topic
      const message = {
        notification: { title, body },
        topic: 'all_users'
      };
      await adminMessaging.send(message);
    }

    // 2. Send multi-cast if we have specific tokens
    if (tokens.length > 0) {
      const response = await adminMessaging.sendEachForMulticast({
        tokens: Array.from(new Set(tokens)), // Deduplicate and convert to Array
        notification: { title, body },
      });
      console.log(`✅ Sent ${response.successCount} messages successfully`);
    }

    // 3. Save to In-app notifications collection for persistence
    const db = adminFirestore;
    const batch = db.batch();
    
    if (targetUids && Array.isArray(targetUids) && targetUids.length > 0) {
      targetUids.forEach((uid: string) => {
        const notifRef = db.collection('notifications').doc();
        batch.set(notifRef, {
          userId: uid,
          title,
          body,
          createdAt: new Date(),
          read: false,
          type: 'admin_broadcast'
        });
      });
      await batch.commit();
    } else {
      // Global broadcast record
      await db.collection('notifications').add({
        userId: 'all',
        title,
        body,
        createdAt: new Date(),
        read: false,
        type: 'global_broadcast'
      });
    }

    return res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('❌ Broadcast failed:', error);
    return res.status(500).json({ error: error.message });
  }
}
