import { NextApiRequest, NextApiResponse } from 'next';
import admin, { adminMessaging, adminFirestore } from '@/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { title, body, targetUids } = req.body;

  if (!title || !body) {
    return res.status(400).json({ error: 'Title and body are required' });
  }

  if (!adminFirestore) {
    return res.status(500).json({ error: 'Firebase services not configured' });
  }

  try {
    // 🛡️ v3.8.0 OneSignal Integration - Professional Engine
    // (Bypasses Firebase FCM reliability issues)
    const ONESIGNAL_APP_ID = "9f5f7f5c-2b39-4e2e-b76f-bba6b45e27e1";
    const ONESIGNAL_REST_API_KEY = "os_v2_app_t5px6xblhfhc5n3pxotlixrh4ef4d5pknvzuwyfup3bvk2obx64kmsvqnoocesojx2wfdd72u7mhxo7j5w5loykibs5cwdm7wxmsyzi";

    let pushResult: any = null;

    // 🚀 Step 1: Send via OneSignal API
    const osPayload: any = {
      app_id: ONESIGNAL_APP_ID,
      headings: { "en": title },
      contents: { "en": body },
      url: "https://play.okeforyou.com/profile",
    };

    if (targetUids && Array.isArray(targetUids) && targetUids.length > 0) {
      console.log(`📡 [OneSignal] Targeted Mode: ${targetUids.length} users`);
      osPayload.include_external_user_ids = targetUids;
    } else {
      console.log('📡 [OneSignal] Broadcast Mode: All users');
      osPayload.included_segments = ["Subscribed Users"];
    }

    const osResponse = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Basic ${ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify(osPayload)
    });

    const osData = await osResponse.json();
    pushResult = {
      success: osResponse.ok,
      id: osData.id,
      errors: osData.errors,
      recipients: osData.recipients
    };

    console.log('✅ [OneSignal] API Response:', osData);

    // 🚀 Step 2: Persist to Firestore (Atomically from server-side)
    const db = adminFirestore;
    if (targetUids && Array.isArray(targetUids) && targetUids.length > 0) {
      // Batch writes (max 500)
      const chunks = [];
      for (let i = 0; i < targetUids.length; i += 500) {
        chunks.push(targetUids.slice(i, i + 500));
      }

      for (const chunk of chunks) {
        const batch = db.batch();
        chunk.forEach((uid: string) => {
          const notifRef = db.collection('notifications').doc();
          batch.set(notifRef, {
            userId: uid,
            title,
            body,
            type: 'admin',
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          });
        });
        await batch.commit();
      }
    } else if (!targetUids) {
      // Single entry for 'all'
      await db.collection('notifications').add({
        userId: 'all',
        title,
        body,
        type: 'broadcast',
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return res.status(200).json({ 
      success: true, 
      pushResult,
      deliveredTo: targetUids?.length || 'all' 
    });

  } catch (error: any) {
    console.error('❌ [Broadcast API] Critical Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Internal Server Error' 
    });
  }
}
