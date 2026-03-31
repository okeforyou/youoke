import { NextApiRequest, NextApiResponse } from 'next';
import admin, { adminMessaging, adminFirestore } from '@/firebase-admin';

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
    // v3.0.1 Notification Fix - Reinforced Engine
    const tokens: string[] = [];

    // 1. Get tokens for target users or all users
    if (targetUids && Array.isArray(targetUids)) {
      console.log(`📡 [API/Broadcast] Targeted Mode: ${targetUids.length} users`);
      for (const uid of targetUids) {
        const userDoc = await adminFirestore.collection('users').doc(uid).get();
        const userData = userDoc.data();
        // Support both old and new metadata paths
        const userTokens = userData?.metadata?.fcmTokens || userData?.fcmTokens;
        if (userTokens && Array.isArray(userTokens)) {
          tokens.push(...userTokens);
        }
      }
    } else {
      console.log('📡 [API/Broadcast] Global Mode (Topic: all_users)');
    }

    // 2. Prepare FCM Delivery (Multicast for targeted, Topic for global)
    let pushResult = null;
    if (tokens.length > 0) {
      const uniqueTokens = Array.from(new Set(tokens)).filter(Boolean);
      console.log(`📡 [API/Broadcast] Sending to ${uniqueTokens.length} unique tokens`);
      
      const response = await adminMessaging.sendEachForMulticast({
        tokens: uniqueTokens,
        notification: { title, body },
      });
      pushResult = {
        successCount: response.successCount,
        failureCount: response.failureCount,
        details: response.responses.map((r, idx) => r.success ? null : { 
          token: uniqueTokens[idx].substring(0, 10) + '...', 
          error: r.error 
        }).filter(Boolean)
      };
      console.log('✅ FCM Multicast Result:', pushResult);
    } else if (!targetUids) {
      // Global Broadcast to everyone (using topic)
      const message = {
        notification: { title, body },
        data: { type: 'global', time: new Date().toISOString() },
        topic: 'all_users'
      };
      const response = await adminMessaging.send(message);
      pushResult = { topic: 'all_users', messageId: response, success: true };
      console.log('✅ FCM Topic Result:', pushResult);
    }

    // 3. Persist to Firestore (Atomically from server-side)
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
      deliveredToUsers: targetUids?.length || 'all' 
    });
  } catch (error: any) {
    console.error('❌ [API/Broadcast] Critical Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal Server Error' 
    });
  }
}
