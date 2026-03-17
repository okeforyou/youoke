import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { message, imageFullsize, imageThumbnail, flex, to, approvalData } = req.body;

    // Get keys from env
    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const adminUserId = process.env.LINE_ADMIN_USER_ID;

    if (!channelAccessToken) {
        console.warn("LINE Messaging API keys are missing");
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        let finalFlex = flex;

        // Securely generate approval link if data provided
        if (approvalData) {
            const { paymentId, userId, packageId, packageName, amount } = approvalData;
            const token = channelAccessToken.substring(0, 10);
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${req.headers.host}`;
            const approveUrl = `${baseUrl}/api/admin/approve-via-link?paymentId=${paymentId}&userId=${userId}&packageId=${packageId}&token=${token}`;

            finalFlex = {
                type: "bubble",
                header: {
                    type: "box", layout: "vertical", backgroundColor: "#ef4444",
                    contents: [{ type: "text", text: "📢 แจ้งโอนเงินเข้าใช้งาน YouOke 🎤", weight: "bold", size: "sm", color: "#ffffff", align: "center" }]
                },
                body: {
                    type: "box", layout: "vertical", spacing: "md", contents: [
                        { type: "text", text: "👤 สมาชิก: " + (approvalData.userDisplayName || "ไม่ระบุชื่อ"), weight: "bold", size: "md", color: "#333333" },
                        {
                            type: "box", layout: "vertical", spacing: "sm", contents: [
                                { type: "box", layout: "horizontal", contents: [
                                    { type: "text", text: "💎 แพ็กเกจ:", color: "#666666", size: "sm" },
                                    { type: "text", text: packageName, size: "sm", align: "end", color: "#333333", weight: "bold" }
                                ]},
                                { type: "box", layout: "horizontal", contents: [
                                    { type: "text", text: "💰 ยอดโอน:", color: "#666666", size: "sm" },
                                    { type: "text", text: `฿${amount.toLocaleString()}`, size: "sm", align: "end", color: "#ef4444", weight: "bold" }
                                ]},
                                { type: "box", layout: "horizontal", contents: [
                                    { type: "text", text: "🆔 รหัสอ้างอิง:", color: "#666666", size: "sm" },
                                    { type: "text", text: paymentId.substring(0, 8).toUpperCase(), size: "sm", align: "end", color: "#999999", fontStyle: "italic" }
                                ]}
                            ]
                        },
                        { type: "separator", margin: "md" },
                        { type: "text", text: "✅ กรุณา \"แนบรูปสลิป\" ในแชทนี้\nเพื่อทำการตรวจสอบและอนุมัติครับ", size: "xs", color: "#666666", wrap: true, align: "center" }
                    ]
                },
                footer: {
                    type: "box", layout: "vertical", spacing: "sm", contents: [
                        {
                            type: "button", style: "primary", color: "#ef4444",
                            action: { type: "uri", label: "กดเพื่ออนุมัติใช้งาน", uri: approveUrl }
                        }
                    ]
                }
            };
        }

        // Construct the LINE Push Message
        let messages: any[] = [];
        
        if (finalFlex) {
            messages.push({
                type: "flex",
                altText: message || "มีรายการแจ้งโอนเงินใหม่",
                contents: finalFlex
            });
        } else {
            messages.push({ type: "text", text: message || "มีรายการแจ้งโอนเงินใหม่" });
        }

        if (imageFullsize) {
            messages.push({
                type: "image",
                originalContentUrl: imageFullsize,
                previewImageUrl: imageThumbnail || imageFullsize
            });
        }

        const linePayload = { to: to || adminUserId, messages };
        if (!linePayload.to) return res.status(400).json({ error: 'No recipient provided' });

        await axios.post('https://api.line.me/v2/bot/message/push', linePayload, {
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${channelAccessToken}` }
        });

        res.status(200).json({ success: true });
    } catch (error: any) {
        console.error("LINE Push Error:", error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to send notification' });
    }
}
