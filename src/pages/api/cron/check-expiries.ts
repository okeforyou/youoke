import { NextApiRequest, NextApiResponse } from 'next';
import { adminFirestore, handleFirestoreError } from '../../../firebase-admin';
import axios from 'axios';

const CRON_SECRET = process.env.CRON_SECRET || 'dev_secret_key_for_local_testing';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${CRON_SECRET}` && req.query.key !== CRON_SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!adminFirestore) {
        return res.status(500).json({ error: 'Firebase Admin not initialized' });
    }

    try {
        console.log('🚀 [CRON] Checking for expiring memberships...');
        
        const now = new Date();
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(now.getDate() + 3);

        // Fetch users whose membership expires within the next 3 days
        const usersSnap = await adminFirestore.collection('users')
            .where('membership.expiresAt', '>', now)
            .where('membership.expiresAt', '<=', threeDaysFromNow)
            .where('membership.status', '==', 'active')
            .get();

        const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
        let notifiedCount = 0;

        for (const userDoc of usersSnap.docs) {
            const userData = userDoc.data();
            const userId = userDoc.id;
            const membership = userData.membership;
            
            if (!membership?.expiresAt) continue;

            // Send LINE notification to ANY user who has linked LINE
            const lineUserId = userData.lineUserId;
            if (lineUserId && channelAccessToken) {
                const expiryDate = membership.expiresAt.toDate ? membership.expiresAt.toDate() : new Date(membership.expiresAt);
                const expiryStr = expiryDate.toLocaleDateString('th-TH', { 
                    day: 'numeric', month: 'long', year: 'numeric' 
                });

                try {
                    await axios.post('https://api.line.me/v2/bot/message/push', {
                        to: lineUserId,
                        messages: [
                            {
                                type: "flex",
                                altText: "⚠️ แจ้งเตือน: สมาชิกของคุณใกล้จะหมดอายุแล้ว",
                                contents: {
                                    type: "bubble",
                                    header: {
                                        type: "box",
                                        layout: "vertical",
                                        backgroundColor: "#f44336",
                                        contents: [
                                            { type: "text", text: "Subscription Alert", color: "#ffffff", weight: "bold", size: "sm" }
                                        ]
                                    },
                                    body: {
                                        type: "box",
                                        layout: "vertical",
                                        spacing: "md",
                                        contents: [
                                            { type: "text", text: `สวัสดีคุณ ${userData.displayName || 'สมาชิก'}`, weight: "bold" },
                                            { type: "text", text: `สมาชิกพรีเมียมของคุณจะหมดอายุในวันที่:`, size: "xs", color: "#666666" },
                                            { type: "text", text: expiryStr, color: "#f44336", weight: "bold", size: "lg" },
                                            { type: "text", text: "รีบต่ออายุตอนนี้เพื่อรับสิทธิ์ร้องเพลงไม่จำกัดอย่างต่อเนื่องครับ", size: "xs", color: "#999999", wrap: true }
                                        ]
                                    },
                                    footer: {
                                        type: "box",
                                        layout: "vertical",
                                        contents: [
                                            {
                                                type: "button",
                                                style: "primary",
                                                color: "#06C755",
                                                action: {
                                                    type: "uri",
                                                    label: "ต่ออายุสมาชิก",
                                                    uri: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://play.okeforyou.com'}/packages`
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        ]
                    }, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${channelAccessToken}`
                        }
                    });
                    notifiedCount++;
                } catch (err: any) {
                    console.error(`Failed to notify user ${userId}:`, err.response?.data || err.message);
                }
            }
        }

        res.status(200).json({
            success: true,
            message: `Scanned ${usersSnap.size} potentially expiring users. Notified ${notifiedCount} LINE users.`
        });

    } catch (error: any) {
        await handleFirestoreError(error, 'Cron Expiry Check');
        res.status(500).json({ success: false, error: error.message });
    }
}
