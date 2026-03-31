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

        // 🛡️ v3.9.7 Zero-Config News API (Bypass Index & Permissions)
        // Fetch ALL and sort in memory to avoid "Missing Index Error"
        const snapshot = await adminFirestore.collection('system_news').get();

        const news = snapshot.docs
            .map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate().toISOString() || new Date(0).toISOString()
            }))
            .filter((item: any) => item.active !== false);

        // Fallback or Merge with notifications/all
        const fallbackSnapshot = await adminFirestore.collection('notifications')
            .where('userId', '==', 'all')
            .get();

        const fallbackNews = fallbackSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            type: 'system',
            createdAt: doc.data().createdAt?.toDate().toISOString() || new Date(0).toISOString()
        }));

        // Combine and Sort in Memory (Bypassing Index requirements)
        const combined = [...news, ...fallbackNews]
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 30);

        return res.status(200).json(combined);

    } catch (error: any) {
        console.error('❌ [News API] Error:', error);
        return res.status(500).json({ error: 'Failed to fetch news', details: error.message });
    }
}
