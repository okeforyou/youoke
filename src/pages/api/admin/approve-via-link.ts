import type { NextApiRequest, NextApiResponse } from 'next';
import { approvePayment } from '@/modules/billing/services/paymentService';
import axios from 'axios';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // This is a GET request because it's triggered by a link in LINE
    if (req.method !== 'GET') {
        return res.status(405).send('Method Not Allowed');
    }

    const { paymentId, userId, packageId, token } = req.query;

    // Basic security check (Admin should have a secret token in the URL)
    // In production, use a proper signed JWT or a shared secret in ENV
    const expectedToken = process.env.LINE_CHANNEL_ACCESS_TOKEN?.substring(0, 10); // Simple proof of possession
    if (token !== expectedToken) {
        return res.status(401).send('Unauthorized: Invalid Approval Token');
    }

    if (!paymentId || !userId || !packageId) {
        return res.status(400).send('Missing parameters');
    }

    try {
        console.log(`🚀 [Admin-LINE] Approving payment ${paymentId} for user ${userId}`);
        
        // 1. Approve the payment in Firestore
        // We use 'admin-line' as the adminUid to trace where it came from
        await approvePayment(paymentId as string, userId as string, packageId as string, 'admin-line');

        // 2. Fetch User Expiry for the notification
        let expiryText = "ไม่มีกำหนด";
        if (db) {
            const userSnap = await getDoc(doc(db, 'users', userId as string));
            const userData = userSnap.data();
            const expiresAt = userData?.membership?.expiresAt;
            if (expiresAt) {
                const date = expiresAt.toDate ? expiresAt.toDate() : new Date(expiresAt);
                expiryText = date.toLocaleDateString('th-TH', { 
                    day: 'numeric', month: 'long', year: 'numeric' 
                });
            }
        }

        // 3. Send Confirmation back to User via LINE (if they are a LINE user)
        if ((userId as string).startsWith('line:')) {
            const lineUserId = (userId as string).split(':')[1];
            const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
            
            const message = {
                to: lineUserId,
                messages: [
                    {
                        type: "flex",
                        altText: "🎉 บัญชีของคุณได้รับการอนุมัติแล้ว!",
                        contents: {
                            type: "bubble",
                            header: {
                                type: "box",
                                layout: "vertical",
                                backgroundColor: "#06C755",
                                contents: [
                                    { type: "text", text: "Premium Activated!", color: "#ffffff", weight: "bold", size: "lg" }
                                ]
                            },
                            body: {
                                type: "box",
                                layout: "vertical",
                                contents: [
                                    { type: "text", text: "ยินดีด้วย! บัญชีของคุณเป็นพรีเมียมแล้ว", weight: "bold", size: "sm" },
                                    { type: "separator", margin: "md" },
                                    {
                                        type: "box", 
                                        layout: "vertical", 
                                        margin: "md",
                                        contents: [
                                            {
                                                type: "box", layout: "horizontal", contents: [
                                                    { type: "text", text: "แพ็กเกจ:", color: "#aaaaaa", size: "xs" },
                                                    { type: "text", text: packageId as string, size: "xs", align: "end", weight: "bold" }
                                                ]
                                            },
                                            {
                                                type: "box", layout: "horizontal", contents: [
                                                    { type: "text", text: "วันหมดอายุ:", color: "#aaaaaa", size: "xs" },
                                                    { type: "text", text: expiryText, size: "xs", align: "end", color: "#f44336", weight: "bold" }
                                                ]
                                            }
                                        ]
                                    }
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
                                            label: "เข้าสู่ระบบเพื่อเริ่มร้องเพลง",
                                            uri: "https://play.okeforyou.com"
                                        }
                                    }
                                ]
                            }
                        }
                    }
                ]
            };

            await axios.post('https://api.line.me/v2/bot/message/push', message, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${channelAccessToken}`
                }
            });
        }

        // Return a pretty success page to the admin
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(`
            <div style="font-family: sans-serif; text-align: center; padding: 50px;">
                <h1 style="color: #06C755;">✅ อนุมัติสำเร็จ!</h1>
                <p>User <b>${userId}</b> ได้รับสิทธิ์พรีเมียมแล้ว</p>
                <p>ระบบส่งการแจ้งเตือนกลับหา User ใน LINE เรียบร้อย</p>
                <button onclick="window.close()" style="padding: 10px 20px; background: #eee; border: none; border-radius: 5px; cursor: pointer;">ปิดหน้านี้</button>
            </div>
        `);
    } catch (error: any) {
        console.error("Approval Error:", error);
        return res.status(500).send(`Error: ${error.message}`);
    }
}
