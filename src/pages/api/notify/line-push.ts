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

  const { to, message, flexMessage } = req.body;
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
    const payload = flexMessage ? {
        to,
        messages: [flexMessage]
    } : {
        to,
        messages: [
            {
                type: 'text',
                text: message
            }
        ]
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
