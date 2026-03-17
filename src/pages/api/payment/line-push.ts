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

        // --- A. USER FLEX (Green, NO Button) ---
        const userFlex = {
            type: "bubble",
            header: {
                type: "box", layout: "vertical", backgroundColor: "#06C755",
                contents: [{ type: "text", text: "📢 แจ้งโอนเงิน YouOke 🎤", weight: "bold", size: "sm", color: "#ffffff", align: "center" }]
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
                    },
                    { type: "separator", margin: "md" },
                    { type: "text", text: "✅ กรุณา \"แนบรูปสลิปโอนเงิน\" 📸\nในแชทนี้ เพื่อรอนายสถานีอนุมัติครับ", size: "xs", color: "#666666", wrap: true, align: "center" }
                ]
            }
        };

        // --- B. ADMIN FLEX (Green, WITH Button) ---
        const adminFlex = {
            type: "bubble",
            header: {
                type: "box", layout: "vertical", backgroundColor: "#06C755",
                contents: [{ type: "text", text: "📢 รายการแจ้งโอนเงินใหม่ (Admin) 🎤", weight: "bold", size: "sm", color: "#ffffff", align: "center" }]
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
                        action: { type: "uri", label: "✅ กดเพื่ออนุมัติใช้งาน", uri: approveUrl }
                    },
                    { type: "text", text: "* กรุณารอสลิปจากลูกค้าในแชทก่อนกด", size: "xxs", color: "#999999", margin: "sm", align: "center" }
                ]
            }
        };

        const userLineId = userId?.startsWith('line:') ? userId.split(':')[1] : to;

        // --- Execute Pushes ---

        // 1. Push to Admin (The green box with Approval Button)
        if (adminUserId) {
            await axios.post('https://api.line.me/v2/bot/message/push', {
                to: adminUserId,
                messages: [{ 
                    type: "flex", 
                    altText: "💰 แจ้งโอนเงินใหม่: " + safeName, 
                    contents: adminFlex 
                }]
            }, { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${channelAccessToken}` } });
        }
        
        // 2. Push to User (The green box WITHOUT button)
        // Note: If Admin is testing with their own ID, they will get this too, 
        // but as a separate, clean receipt message.
        if (userLineId && userLineId !== adminUserId) {
            await axios.post('https://api.line.me/v2/bot/message/push', {
                to: userLineId,
                messages: [{ 
                    type: "flex", 
                    altText: "📢 รายละเอียดการแจ้งโอนเงิน YouOke", 
                    contents: userFlex 
                }]
            }, { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${channelAccessToken}` } });
        }

        console.log(`✅ LINE Notifications pushed.`);
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
