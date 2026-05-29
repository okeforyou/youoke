import type { NextApiRequest, NextApiResponse } from 'next';
import { adminFirestore, adminDb } from '@/firebase-admin';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') return res.status(405).send('Method Not Allowed');

    const { paymentId, userId, packageId, token } = req.query;

    if (!adminFirestore) return res.status(500).send('Admin SDK not initialized');

    // Security Check
    const expectedToken = process.env.LINE_CHANNEL_ACCESS_TOKEN?.substring(0, 10);
    if (token !== expectedToken) return res.status(401).send('Unauthorized');

    if (!paymentId || !userId || !packageId) return res.status(400).send('Missing params');

    try {
        console.log(`🚀 [Admin-LINE] Server-side Approval for ${paymentId}`);

        // 1. Get Package Info (via Admin SDK)
        const pkgSnap = await adminFirestore.collection('packages').doc(packageId as string).get();
        let durationDays = 30;
        let pkgName = "Premium Package";
        let planId = 'monthly';

        if (pkgSnap.exists) {
            const pkgData = pkgSnap.data();
            durationDays = pkgData?.durationDays ?? 30;
            pkgName = pkgData?.name || pkgName;
            planId = pkgData?.planId || 'monthly';
        }

        // 2. Calculate Expiry
        const now = new Date();
        let expiresAt: Date | null = new Date();
        if (durationDays === 0) expiresAt = null;
        else expiresAt.setDate(now.getDate() + durationDays);

        // 3. Sync Quota from Config (Dynamic)
        const sysSnap = await adminFirestore.collection('settings').doc('default').get();
        const sysConfig = sysSnap.data();
        const maxDailySongs = (sysConfig?.membership as any)?.[planId]?.max_daily_songs || 0;

        // 4. Update Database (Atomic via Admin SDK)
        const userRef = adminFirestore.collection('users').doc(userId as string);
        const batch = adminFirestore.batch();

        batch.update(userRef, {
            membership: {
                type: planId,
                status: 'active',
                startedAt: admin.firestore.FieldValue.serverTimestamp(),
                expiresAt: expiresAt,
                lastPaymentId: paymentId
            },
            isPremium: true,
            role: 'premium',
            tier: planId,
            quota: {
                daily_limit: maxDailySongs,
                used: 0,
                last_reset: new Date().toISOString()
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        // Update Payment Proof
        const payRef = adminFirestore.collection('payment_proofs').doc(paymentId as string);
        batch.update(payRef, {
            status: 'approved',
            processedAt: admin.firestore.FieldValue.serverTimestamp(),
            processedBy: 'admin-line'
        });

        // Add Notification
        const notiRef = userRef.collection('notifications').doc();
        batch.set(notiRef, {
            title: "การชำระเงินสำเร็จ!",
            message: `แพ็กเกจ "${pkgName}" ของคุณใช้งานได้แล้ว ขอให้สนุกกับการร้องเพลง!`,
            type: 'success',
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        await batch.commit();

        // 5. Sync Realtime DB (Admin SDK)
        if (adminDb) {
            await adminDb.ref(`users/${userId}`).update({
                role: 'premium',
                tier: planId,
                'subscription/plan': planId,
                'subscription/status': 'active',
                'subscription/startDate': now.toISOString(),
                'subscription/endDate': expiresAt ? expiresAt.toISOString() : null,
                'quota/daily_limit': maxDailySongs,
                'quota/used': 0,
                'quota/last_reset': new Date().toISOString(),
                updatedAt: Date.now()
            });
        }

        // 6. Notify User via LINE (if they have linked LINE)
        const userDataSnap = await userRef.get();
        const lineUserId = userDataSnap.data()?.lineUserId;
        
        if (lineUserId) {
            const expiryText = expiresAt 
                ? expiresAt.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
                : "ไม่มีกำหนด (ตลอดชีพ)";

            await axios.post('https://api.line.me/v2/bot/message/push', {
                to: lineUserId,
                messages: [{
                    type: "flex", altText: "🎉 อนุมัติพรีเมียมแล้ว!",
                    contents: {
                        type: "bubble",
                        header: { type: "box", layout: "vertical", backgroundColor: "#06C755", contents: [{ type: "text", text: "Activated!", color: "#ffffff", weight: "bold" }] },
                        body: {
                            type: "box", layout: "vertical", contents: [
                                { type: "text", text: `ยินดีด้วย! บัญชีของคุณเป็นพรีเมียมแล้ว (${pkgName})`, weight: "bold", size: "sm", wrap: true },
                                { type: "text", text: `หมดอายุ: ${expiryText}`, size: "xs", color: "#f44336", margin: "md" }
                            ]
                        },
                        footer: {
                            type: "box", layout: "vertical", contents: [
                                { 
                                    type: "button", 
                                    style: "primary", 
                                    color: "#06C755", 
                                    action: { type: "uri", label: "เข้าสู่แอป YouOKE", uri: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://play.okeforyou.com'}/` } 
                                }
                            ]
                        }
                    }
                }]
            }, { headers: { 'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}` } });
        }

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(`
            <div style="font-family: sans-serif; text-align: center; padding: 50px;">
                <h1 style="color: #06C755;">✅ อนุมัติสำเร็จ!</h1>
                <p>User <b>${userId}</b> เป็นพรีเมียมแล้ว</p>
                <button onclick="window.close()" style="padding: 10px 20px; background: #eee; border: none; border-radius: 5px; cursor: pointer;">ปิดหน้าต่างนี้</button>
            </div>
        `);
    } catch (error: any) {
        console.error("Critical Approval Error:", error);
        return res.status(500).send(`Critical Error: ${error.message}`);
    }
}

import admin from 'firebase-admin'; // Required for FieldValue
