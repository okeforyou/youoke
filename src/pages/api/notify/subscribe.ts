import { NextApiRequest, NextApiResponse } from 'next';
import { adminMessaging } from '@/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { token, topic } = req.body;

  if (!token || !topic) {
    return res.status(400).json({ error: 'Token and topic are required' });
  }

  if (!adminMessaging) {
    return res.status(500).json({ error: 'Firebase Admin not configured' });
  }

  try {
    // 📡 Subscribe the registration token to the topic
    const response = await adminMessaging.subscribeToTopic([token], topic);
    
    console.log(`✅ [FCM Subscribe] Successfully subscribed to topic "${topic}":`, response);

    return res.status(200).json({ 
      success: true, 
      count: response.successCount,
      errors: response.errors
    });
  } catch (error: any) {
    console.error('❌ [FCM Subscribe] Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
