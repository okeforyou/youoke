import { NextApiRequest, NextApiResponse } from 'next';
import admin, { adminFirestore } from '@/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { title, body, link } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required' });
  }

  if (!adminFirestore) {
    return res.status(500).json({ error: 'Firebase not configured' });
  }

  try {
    // ✅ Simple: Write plain announcement to its own collection
    // No userId, no read status, no user coupling at all
    const doc: any = {
      title,
      body,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (link) doc.link = link;

    const ref = await adminFirestore.collection('announcements').add(doc);

    return res.status(200).json({ success: true, id: ref.id });

  } catch (error: any) {
    console.error('❌ [Broadcast API] Error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
