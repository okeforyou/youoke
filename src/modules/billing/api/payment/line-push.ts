import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { message, imageFullsize, imageThumbnail } = req.body;

    // Get keys from env
    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const adminUserId = process.env.LINE_ADMIN_USER_ID;

    if (!channelAccessToken || !adminUserId) {
        console.warn("LINE Messaging API keys are missing");
        return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
        // Construct the LINE Push Message
        // We use Flex Message or simple Image + Text
        const linePayload = {
            to: adminUserId,
            messages: [
                {
                    type: "text",
                    text: message || "มีรายการแจ้งโอนเงินใหม่"
                },
                {
                    type: "image",
                    originalContentUrl: imageFullsize,
                    previewImageUrl: imageThumbnail || imageFullsize
                }
            ]
        };

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
