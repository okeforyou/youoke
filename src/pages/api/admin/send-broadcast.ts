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

    // 🚀 v3.9.9 Unified Structure: Single point of truth in 'notifications'
    // This is the simplest model: Write a document with userId: 'all'
    const newsDoc = await db.collection('notifications').add({
      userId: 'all',
      title,
      body,
      type: 'broadcast',
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.status(200).json({ 
      success: true, 
      newsId: newsDoc.id,
      mode: 'unified-broadcast'
    });

  } catch (error: any) {
    console.error('❌ [Broadcast API] Critical Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal Server Error' 
    });
  }
}
