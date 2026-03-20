import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { adminAuth, adminFirestore } from '../../../firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { code, redirectUri } = req.body;

    if (!code || !redirectUri) {
        return res.status(400).json({ error: 'Missing code or redirectUri' });
    }

    try {
        const clientId = process.env.LINE_LOGIN_CHANNEL_ID;
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

        const { access_token, id_token } = tokenRes.data;

        if (!id_token) {
            throw new Error("No ID Token received from LINE");
        }

        // 2. Verify ID Token and Get Profile (Local verification or Call LINE Verify API)
        // Calling LINE verify is safer to ensure audience matches
        const verifyRes = await axios.post('https://api.line.me/oauth2/v2.1/verify',
            new URLSearchParams({
                id_token: id_token,
                client_id: clientId
            })
        );

        // 3. User Info from Verify Response
        const lineProfile = verifyRes.data;
        const lineUserId = lineProfile.sub;
        const email = lineProfile.email; // Requires 'email' scope
        const name = lineProfile.name;
        const picture = lineProfile.picture;

        console.log(`✅ LINE Login: ${name} (${lineUserId})`);

        // 4. Create or Update Firebase User
        let uid = `line:${lineUserId}`;
        let firebaseUser;

        try {
            if (!adminAuth) throw new Error("Admin Auth not initialized");
            firebaseUser = await adminAuth.getUser(uid);
            console.log("Found existing Firebase user:", uid);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                // Create new user
                console.log("Creating new Firebase user:", uid);
                if (!adminAuth) throw new Error("Admin Auth not initialized");
                firebaseUser = await adminAuth.createUser({
                    uid: uid,
                    displayName: name,
                    photoURL: picture,
                    email: email, // Optional, might be duplicates if user signed up with email before
                    emailVerified: true
                });
            } else {
                throw error;
            }
        }

        // 5. Update Firestore Profile (Sync)
        if (!adminFirestore) throw new Error("Admin Firestore not initialized");
        const userRef = adminFirestore.collection('users').doc(uid);
        await userRef.set({
            uid: uid,
            displayName: name,
            photoURL: picture,
            email: email || null,
            provider: 'line',
            updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });

        // 6. Generate Custom Token
        if (!adminAuth) throw new Error("Admin Auth not initialized");
        const customToken = await adminAuth.createCustomToken(uid);

        return res.status(200).json({ token: customToken });

    } catch (error: any) {
        console.error('❌ LINE Login Error:', error.response?.data || error.message);
        return res.status(500).json({ error: 'LINE Login Failed', details: error.response?.data || error.message });
    }
}
