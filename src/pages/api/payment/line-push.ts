import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { message, flex, to, approvalData } = req.body;

    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const adminUserId = process.env.LINE_ADMIN_USER_ID;

    if (!channelAccessToken) {
        console.error("❌ ERROR: LINE_CHANNEL_ACCESS_TOKEN is missing in environment variables.");
        return res.status(500).json({ error: 'Missing LINE token', debug: 'TOKEN_MISSING' });
    }

    try {
        const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
        const adminUserId = process.env.LINE_ADMIN_USER_ID;

        if (!channelAccessToken) {
            console.error("❌ ERROR: LINE_CHANNEL_ACCESS_TOKEN is missing");
            return res.status(500).json({ error: 'Missing LINE token' });
        }

        const { paymentId, userId, packageId, packageName, amount, userDisplayName } = approvalData || {};
        const safeName = userDisplayName || "สมาชิก";
        const safeAmount = Number(amount || 0).toLocaleString();
        const safeId = String(paymentId || 'UNKNOWN').substring(0, 8).toUpperCase();
        
        const token = channelAccessToken.substring(0, 10);
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${req.headers.host}`;
        const approveUrl = `${baseUrl}/api/admin/approve-via-link?paymentId=${paymentId}&userId=${userId}&packageId=${packageId}&token=${token}`;

        // --- 1. SEND TO ADMIN (With Approval Button) ---
        if (adminUserId) {
            const adminFlex = {
                type: "bubble",
                header: {
                    type: "box", layout: "vertical", backgroundColor: "#06C755", // Green Color
                    contents: [{ type: "text", text: "📢 แจ้งโอนเงินใหม่ (Admin) 🎤", weight: "bold", size: "sm", color: "#ffffff", align: "center" }]
                },
                body: {
                    type: "box", layout: "vertical", spacing: "md", contents: [
                        { type: "text", text: "👤 สมาชิก: " + safeName, weight: "bold", size: "md", color: "#333333" },
                        {
                            type: "box", layout: "vertical", spacing: "sm", contents: [
                                { type: "box", layout: "horizontal", contents: [
                                    { type: "text", text: "💎 แพ็กเกจ:", color: "#666666", size: "sm" },
                                    { type: "text", text: packageName || "-", size: "sm", align: "end", color: "#333333", weight: "bold" }
                                ]},
                                { type: "box", layout: "horizontal", contents: [
                                    { type: "text", text: "💰 ยอดโอน:", color: "#666666", size: "sm" },
                                    { type: "text", text: `฿${safeAmount}`, size: "sm", align: "end", color: "#06C755", weight: "bold" }
                                ]},
                                { type: "box", layout: "horizontal", contents: [
                                    { type: "text", text: "🆔 รหัสอ้างอิง:", color: "#666666", size: "sm" },
                                    { type: "text", text: safeId, size: "sm", align: "end", color: "#999999" }
                                ]}
                            ]
                        }
                    ]
                },
                footer: {
                    type: "box", layout: "vertical", contents: [
                        {
                            type: "button", style: "primary", color: "#06C755",
                            action: { type: "uri", label: "กดเพื่ออนุมัติใช้งาน", uri: approveUrl }
                        }
                    ]
                }
            };

            await axios.post('https://api.line.me/v2/bot/message/push', {
                to: adminUserId,
                messages: [{ type: "flex", altText: "💰 แจ้งโอนใหม่จาก " + safeName, contents: adminFlex }]
            }, { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${channelAccessToken}` } });
        }

        // --- 2. SEND TO USER (NO Approval Button) ---
        // Format as the text message the user liked or a simplified Flex
        const userLineId = userId?.startsWith('line:') ? userId.split(':')[1] : to;
        
        if (userLineId && userLineId !== adminUserId) {
            const userMessage = [
                '📢 แจ้งโอนเงินเพื่อเข้าใช้งาน YouOke 🎤',
                `👤 สมาชิก: ${safeName}`,
                `💎 แพ็กเกจ: ${packageName}`,
                `💰 ยอดโอน: ฿${safeAmount}`,
                `🆔 รหัสอ้างอิง: ${safeId}`,
                '---------------------------',
                '✅ กรุณา "แนบรูปสลิป" 📸',
                'ในแชทนี้ เพื่อทำการอนุมัติการใช้งานครับ'
            ].join('\n');

            await axios.post('https://api.line.me/v2/bot/message/push', {
                to: userLineId,
                messages: [{ type: "text", text: userMessage }]
            }, { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${channelAccessToken}` } });
        }

        console.log(`✅ LINE Notifications sent.`);
        return res.status(200).json({ success: true });

    } catch (error: any) {
        console.error("❌ LINE API Error:", error.response?.data || error.message);
        return res.status(500).json({ 
            error: 'LINE Push Failed', 
            details: error.response?.data,
            target: to || adminUserId 
        });
    }
}
