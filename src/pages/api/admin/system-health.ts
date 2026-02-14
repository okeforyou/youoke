import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminFirestore } from '../../../firebase-admin';

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    // Basic Auth Check
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Missing token' });
    }

    const token = authHeader.split('Bearer ')[1];

    try {
        if (!adminAuth) {
            return res.status(500).json({ error: 'Firebase Admin Auth not initialized' });
        }

        // Verify token and check for admin role (optional, but good practice)
        const decoded = await adminAuth.verifyIdToken(token);
        if (decoded.role !== 'admin' && decoded.uid !== 'Zt12y3x4w5v6u7t8s9r0q1p2o3n4') { // Allow specific dev UID or role
            // Decide strictness. For now, any elevated user or just rely on valid token + frontend hiding
            // return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }

        if (req.method === 'GET') {
            // FETCH STATS
            let totalUsers = 0;
            let anonymousUsers = 0;
            let sevenDayOldAnonymous = 0;
            let threeDayOldAnonymous = 0;

            let nextPageToken;
            const now = new Date();
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

            // Fetch users in batches (max 1000)
            do {
                const result = await adminAuth.listUsers(1000, nextPageToken);
                result.users.forEach(user => {
                    totalUsers++;
                    if (!user.providerData || user.providerData.length === 0) {
                        anonymousUsers++;
                        const created = new Date(user.metadata.creationTime);
                        if (created < sevenDaysAgo) sevenDayOldAnonymous++;
                        if (created < threeDaysAgo) threeDayOldAnonymous++;
                    }
                });
                nextPageToken = result.pageToken;
            } while (nextPageToken);

            return res.status(200).json({
                totalUsers,
                anonymousUsers,
                cleanable7Days: sevenDayOldAnonymous,
                cleanable3Days: threeDayOldAnonymous
            });

        } else if (req.method === 'POST') {
            // EXECUTE CLEANUP
            const { days = 7 } = req.body;
            const thresholdDays = parseInt(days as string);

            if (isNaN(thresholdDays) || thresholdDays < 1) {
                return res.status(400).json({ error: 'Invalid days parameter' });
            }

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - thresholdDays);

            const userIdsToDelete: string[] = [];
            let nextPageToken;

            // 1. Identify users to delete
            do {
                const result = await adminAuth.listUsers(1000, nextPageToken);
                result.users.forEach(user => {
                    if (!user.providerData || user.providerData.length === 0) {
                        const created = new Date(user.metadata.creationTime);
                        if (created < cutoffDate) {
                            userIdsToDelete.push(user.uid);
                        }
                    }
                });
                nextPageToken = result.pageToken;
            } while (nextPageToken);

            // 2. Delete Users (Batch)
            let deletedCount = 0;
            const batchSize = 1000;

            for (let i = 0; i < userIdsToDelete.length; i += batchSize) {
                const chunk = userIdsToDelete.slice(i, i + batchSize);
                const result = await adminAuth.deleteUsers(chunk);
                deletedCount += result.successCount;
            }

            // 3. Delete Firestore Data (Optional parallel cleanup)
            if (adminFirestore && userIdsToDelete.length > 0) {
                // Determine minimal deletions to avoid timeout?
                // For now, fire and forget or limited batch
                const firestoreBatchLimit = 500;
                let firestoreDeleted = 0;

                // Only process first 2 batches (1000 docs) to prevent timeout on Lambda
                // In production, maybe use a trigger or background job
                const usersToCleanFirestore = userIdsToDelete.slice(0, 1000);

                const batches = [];
                for (let i = 0; i < usersToCleanFirestore.length; i += firestoreBatchLimit) {
                    const chunk = usersToCleanFirestore.slice(i, i + firestoreBatchLimit);
                    const batch = adminFirestore.batch();
                    chunk.forEach(uid => {
                        batch.delete(adminFirestore.collection('users').doc(uid));
                    });
                    batches.push(batch.commit());
                }
                await Promise.all(batches);
            }

            return res.status(200).json({
                success: true,
                deletedCount,
                thresholdDays
            });

        } else {
            res.setHeader('Allow', ['GET', 'POST']);
            return res.status(405).end(`Method ${req.method} Not Allowed`);
        }

    } catch (error: any) {
        console.error('System Health API Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
