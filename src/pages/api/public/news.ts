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

        // 🛡️ v3.9.6 API-Driven News (Bypassing Firestore Permission Issues)
        // Fetch from system_news or notifications with userId: 'all'
        const snapshot = await adminFirestore.collection('system_news')
            .where('active', '==', true)
            .orderBy('createdAt', 'desc')
            .limit(20)
            .get();

        const news = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString()
        }));

        // Fallback or Merge with notifications/all if needed
        const fallbackSnapshot = await adminFirestore.collection('notifications')
            .where('userId', '==', 'all')
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get();

        const fallbackNews = fallbackSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            type: 'system',
            createdAt: doc.data().createdAt?.toDate().toISOString() || new Date().toISOString()
        }));

        // Combine and Sort
        const combined = [...news, ...fallbackNews]
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 30);

        return res.status(200).json(combined);

    } catch (error: any) {
        console.error('❌ [News API] Error:', error);
        return res.status(500).json({ error: 'Failed to fetch news', details: error.message });
    }
}
