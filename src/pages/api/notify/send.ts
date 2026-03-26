import type { NextApiRequest, NextApiResponse } from 'next';
import admin, { adminFirestore } from '@/firebase-admin';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { userId, title, body, data } = req.body;

  if (!userId || !title || !body) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    if (!adminFirestore) {
      throw new Error('Firestore not initialized');
    }

    // 1. Fetch user's FCM tokens
    const userDoc = await adminFirestore.collection('users').doc(userId).get();
    const userData = userDoc.data();
    const tokens: string[] = userData?.fcmTokens || [];

    if (tokens.length === 0) {
      console.log(`No FCM tokens found for user ${userId}`);
      return res.status(200).json({ success: true, message: 'No tokens found' });
    }

    // 2. Prepare message
    const messages = tokens.map(token => ({
      notification: {
        title,
        body,
      },
      data: data || {},
      token,
    }));

    // 3. Send notifications
    const results = await Promise.allSettled(
      messages.map(msg => admin.messaging().send(msg))
    );

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failureCount = results.filter(r => r.status === 'rejected').length;

    // Optional: Clean up invalid tokens if needed
    // (In a real app, you'd check for specific FCM error codes)

    return res.status(200).json({
      success: true,
      sent: successCount,
      failed: failureCount,
    });
  } catch (error: any) {
    console.error('Notification error:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
}
