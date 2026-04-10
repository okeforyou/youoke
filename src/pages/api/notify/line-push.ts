import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

/**
 * YouOKE LINE Messaging Engine (v4.3.0)
 * ระบบส่งข้อความรายบุคคลเข้า LINE ผ่าน Messaging API
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { to, message, flexMessage, imageUrl } = req.body;
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!channelAccessToken) {
    return res.status(500).json({ 
        message: 'LINE_CHANNEL_ACCESS_TOKEN is not configured in Vercel. กรุณาตั้งค่าเพื่อเปิดระบบครับ' 
    });
  }

  if (!to || (!message && !flexMessage)) {
    return res.status(400).json({ message: 'Missing recipient (to) or content (message/flexMessage)' });
  }

  try {
    const lineMessages: any[] = [];

    // 1. Text Message
    if (message) {
        lineMessages.push({ type: 'text', text: message });
    }

    // 2. Image Message (Must be HTTPS)
    if (imageUrl) {
        lineMessages.push({
            type: 'image',
            originalContentUrl: imageUrl,
            previewImageUrl: imageUrl
        });
    }

    // 3. Flex Message
    if (flexMessage) {
        lineMessages.push(flexMessage);
    }

    const payload = {
        to,
        messages: lineMessages
    };

    const response = await axios.post(
      'https://api.line.me/v2/bot/message/push',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${channelAccessToken}`
        }
      }
    );

    return res.status(200).json({ 
        success: true, 
        messageId: response.data?.messages?.[0]?.id || 'N/A' 
    });

  } catch (error: any) {
    console.error('LINE Messaging Error:', error.response?.data || error.message);
    return res.status(500).json({ 
        message: 'Failed to send LINE message', 
        error: error.response?.data?.message || error.message 
    });
  }
}
