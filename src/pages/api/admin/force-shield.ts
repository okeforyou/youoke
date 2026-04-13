
import { NextApiRequest, NextApiResponse } from 'next';
import { adminFirestore, adminDb } from '../../../firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // 🛡️ SECURITY: Only allow from localhost or with a secret (using cron secret as a shortcut)
    const secret = req.query.secret;
    if (secret !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!adminFirestore) {
        return res.status(500).json({ error: 'Firebase Admin not initialized' });
    }

    const targetEmails = ['boonyanone@gmail.com', 'youoke.okeforyou@gmail.com'];
    const results: any[] = [];

    try {
        for (const email of targetEmails) {
            const usersSnap = await adminFirestore.collection('users').where('email', '==', email).get();
            
            for (const userDoc of usersSnap.docs) {
                const uid = userDoc.id;
                
                const lifetimeData = {
                    role: 'owner',
                    membership: {
                        type: 'lifetime',
                        status: 'active',
                        startedAt: new Date(),
                        expiresAt: null,
                        showAds: false
                    },
                    updatedAt: new Date()
                };

                // 1. Fix Firestore
                await adminFirestore.collection('users').doc(uid).update(lifetimeData);

                // 2. Fix RTDB
                if (adminDb) {
                    await adminDb.ref(`users/${uid}`).update({ role: 'owner' });
                    await adminDb.ref(`users/${uid}/subscription`).update({
                        plan: 'lifetime',
                        status: 'active'
                    });
                }

                results.push({ email, uid, status: 'REPAIRED' });
            }
        }

        res.status(200).json({ success: true, results });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
}
