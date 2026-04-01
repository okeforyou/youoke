import { NextApiRequest, NextApiResponse } from 'next';
import { adminFirestore } from '@/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        if (!adminFirestore) {
            throw new Error('Firestore not initialized');
        }

        // ✅ Simple: Read all from 'announcements' — no userId filter, no index needed
        const snapshot = await adminFirestore.collection('announcements').get();

        const news = snapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate().toISOString() || new Date(0).toISOString()
            }))
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 30);

        return res.status(200).json(news);

    } catch (error: any) {
        console.error('❌ [News API] Error:', error);
        return res.status(500).json({ error: 'Failed to fetch news', details: error.message });
    }
}

