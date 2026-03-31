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
    const db = adminFirestore;

    // 🚀 Step 1: Write to the Global Bulletin Feed (New Model v3.9.5)
    // (This ensures every user sees the same feed, regardless of individual ID issues)
    const newsRef = await db.collection('system_news').add({
      title,
      body,
      type: 'public_announcement',
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 🚀 Step 2: Backward Compatibility (Write to notifications/all)
    // (Ensures the old NotificationBell still has a trigger point)
    await db.collection('notifications').add({
      userId: 'all',
      newsId: newsRef.id,
      title,
      body,
      type: 'broadcast',
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({ 
      success: true, 
      newsId: newsRef.id,
      mode: 'bulletin-board'
    });

  } catch (error: any) {
    console.error('❌ [Broadcast API] Critical Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal Server Error' 
    });
  }
}
