import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { adminAuth, adminFirestore, adminDb } from '../../../firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

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

        if (state === 'link_account') {
            // ONLY verify token and return data to frontend for linking.
            // Do NOT try to fetch or write to Firestore/Firebase Auth since we don't have their true UID here.
            return res.status(200).json({ 
                token: null, 
                lineUserId, 
                lineDisplayName: name,
                linked: true
            });
        }

        let targetUid = state && state !== 'auth_login' ? state : `line:${lineUserId}`;
        
        console.log(`✅ [Identity Bridge] Target UID: ${targetUid} | LINE: ${name}`);

        // 3. Link or Create User
        if (!adminAuth || !adminFirestore) throw new Error("Firebase Admin not initialized");

        let firebaseUser;
        try {
            firebaseUser = await adminAuth.getUser(targetUid);
        } catch (error: any) {
            if (error.code === 'auth/user-not-found' && targetUid.startsWith('line:')) {
                // Create new LINE user if it's a login and user doesn't exist
                firebaseUser = await adminAuth.createUser({
                    uid: targetUid,
                    displayName: name,
                    photoURL: picture,
                    emailVerified: true
                });
            } else {
                throw error; // If state UID is invalid/missing, it should error here
            }
        }

        // 4. Update Profile with LINE Data (The Bridge - v4.8.5 Dual-DB Fix)
        const userRef = adminFirestore.collection('users').doc(targetUid);
        const firestoreBridgeData: any = {
            lineUserId: lineUserId,
            lineDisplayName: name,
            linePhotoURL: picture,
            updatedAt: FieldValue.serverTimestamp()
        };

        // If it's a new LINE user, fill in basic info too
        if (targetUid.startsWith('line:')) {
            firestoreBridgeData.uid = targetUid;
            firestoreBridgeData.displayName = name;
            firestoreBridgeData.photoURL = picture;
            firestoreBridgeData.provider = 'line';
        }

        // RTDB uses its own timestamp format
        const rtdbBridgeData: any = {
            lineUserId: lineUserId,
            lineDisplayName: name,
            linePhotoURL: picture,
            updatedAt: adminDb ? require('firebase-admin').database.ServerValue.TIMESTAMP : null
        };

        if (targetUid.startsWith('line:')) {
            rtdbBridgeData.uid = targetUid;
            rtdbBridgeData.displayName = name;
            rtdbBridgeData.photoURL = picture;
            rtdbBridgeData.provider = 'line';
        }

        // Parallel Sync to both DBs (v4.8.5)
        const writePromises: Promise<any>[] = [
            userRef.set(firestoreBridgeData, { merge: true })
        ];

        if (adminDb) {
            writePromises.push(adminDb.ref(`users/${targetUid}`).update(rtdbBridgeData));
            console.log(`✅ [Bridge] Writing to BOTH Firestore + RTDB for UID: ${targetUid}`);
        } else {
            console.warn(`⚠️ [Bridge] adminDb is null — writing to Firestore ONLY for UID: ${targetUid}`);
        }

        await Promise.all(writePromises);

        // 5. Send Welcome/Link Message via LINE Push API
        const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
        if (channelAccessToken) {
            try {
                const isLinking = state && state !== 'auth_login';
                const welcomeMsg = isLinking 
                    ? `ผูกบัญชีสำเร็จ! 🎉\nบัญชี YouOKE ของคุณได้เชื่อมต่อกับ LINE เรียบร้อยแล้วครับ`
                    : `ยินดีต้อนรับคุณ ${name} เข้าสู่ YouOKE! 🎉\nคุณได้เข้าสู่ระบบด้วย LINE เรียบร้อยแล้ว`;

                await axios.post('https://api.line.me/v2/bot/message/push', {
                    to: lineUserId,
                    messages: [{ type: "text", text: welcomeMsg }]
                }, {
                    headers: { 'Authorization': `Bearer ${channelAccessToken}` }
                });
            } catch (err: any) {
                console.warn('⚠️ [LINE] Could not send welcome message (User might not have added the bot as friend):', err.message);
            }
        }

        // 6. Generate Custom Token for Login
        const customToken = await adminAuth.createCustomToken(targetUid);
        return res.status(200).json({ 
            token: customToken, 
            lineUserId, 
            lineDisplayName: name,
            linked: !!(state && state !== 'auth_login')
        });

    } catch (error: any) {
        console.error('❌ LINE Login Error:', error.response?.data || error.message);
        return res.status(500).json({ error: 'LINE Login Failed', details: error.response?.data || error.message });
    }
}
