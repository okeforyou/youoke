import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { code, redirectUri, state } = req.body;

    if (!code || !redirectUri) {
        return res.status(400).json({ error: 'Missing code or redirectUri' });
    }

    try {
        const clientId = process.env.LINE_LOGIN_CHANNEL_ID || process.env.NEXT_PUBLIC_LINE_LOGIN_CHANNEL_ID;
        const clientSecret = process.env.LINE_LOGIN_CHANNEL_SECRET;

        if (!clientId || !clientSecret) {
            console.error("❌ LINE Login keys missing in .env");
            return res.status(500).json({ error: 'Server configuration error' });
        }

        // 1. Exchange Code for Access Token
        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('code', code);
        params.append('redirect_uri', redirectUri);
        params.append('client_id', clientId);
        params.append('client_secret', clientSecret);

        const tokenRes = await axios.post('https://api.line.me/oauth2/v2.1/token', params, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        const { id_token } = tokenRes.data;

        // 2. Verify ID Token
        const verifyRes = await axios.post('https://api.line.me/oauth2/v2.1/verify',
            new URLSearchParams({
                id_token: id_token,
                client_id: clientId
            })
        );

        const lineProfile = verifyRes.data;
        const lineUserId = lineProfile.sub;
        const name = lineProfile.name;
        const picture = lineProfile.picture;

        if (state !== 'link_account') {
            console.warn(`⚠️ [LINE] Unauthorized state: ${state}. Only 'link_account' is supported.`);
            return res.status(403).json({ error: 'Unauthorized login method' });
        }

        // Return profile data for linking on the frontend
        return res.status(200).json({ 
            token: null, 
            lineUserId, 
            lineDisplayName: name,
            linked: true
        });

    } catch (error: any) {
        console.error('❌ LINE Token Error:', error.response?.data || error.message);
        return res.status(500).json({ error: 'LINE Verification Failed', details: error.response?.data || error.message });
    }
}
