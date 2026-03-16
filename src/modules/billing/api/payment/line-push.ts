import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { message, imageFullsize, imageThumbnail, flex, to } = req.body;

    // Get keys from env
    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const adminUserId = process.env.LINE_ADMIN_USER_ID;

    if (!channelAccessToken) {
        console.warn("LINE Messaging API keys are missing");
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        // Construct the LINE Push Message
        let messages: any[] = [];
        
        if (flex) {
            messages.push({
                type: "flex",
                altText: message || "มีรายการแจ้งโอนเงินใหม่",
                contents: flex
            });
        } else {
            messages.push({
                type: "text",
                text: message || "มีรายการแจ้งโอนเงินใหม่"
            });
        }

        // Only add image if URLs are provided and not using flex (or alongside it)
        if (imageFullsize) {
            messages.push({
                type: "image",
                originalContentUrl: imageFullsize,
                previewImageUrl: imageThumbnail || imageFullsize
            });
        }

        const linePayload = {
            to: to || adminUserId, // Use provided 'to' or fallback to Admin
            messages
        };

        if (!linePayload.to) {
            return res.status(400).json({ error: 'No recipient provided' });
        }

        await axios.post(
            'https://api.line.me/v2/bot/message/push',
            linePayload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${channelAccessToken}`
                }
            }
        );

        res.status(200).json({ success: true });
    } catch (error: any) {
        console.error("LINE Push Error:", error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to send notification' });
    }
}
