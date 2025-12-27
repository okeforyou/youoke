import { NextApiRequest, NextApiResponse } from 'next';
import nookies from 'nookies';
import { adminAuth, adminDb, adminFirestore } from '../../../firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get token from cookies
    const cookies = nookies.get({ req });
    const token = cookies.token;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify token
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // Fetch user data from Realtime Database
    const userRef = adminDb.ref(`users/${uid}`);
    const userSnapshot = await userRef.once('value');

    if (!userSnapshot.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userSnapshot.val();

    // Fetch plans from Firestore
    const plansSnapshot = await adminFirestore.collection('plans').get();
    const plansMap = new Map<string, { displayName: string }>();

    const plans = plansSnapshot.docs
      .filter((doc) => {
        const data = doc.data();
        const isActive = data.isActive || false;
        const isVisible = data.isVisible !== false;

        plansMap.set(doc.id, {
          displayName: data.displayName || data.name || doc.id,
        });

        return isActive && isVisible;
      })
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || data.displayName || doc.id,
          displayName: data.displayName || data.name || doc.id,
          price: data.price || 0,
          duration: data.duration || '',
          features: data.features || [],
          isActive: data.isActive || false,
          isVisible: data.isVisible !== false,
        };
      })
      .sort((a, b) => a.price - b.price);

    // Fetch recent payments
    const paymentsSnapshot = await adminFirestore
      .collection('payments')
      .where('userId', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();

    const recentPayments = paymentsSnapshot.docs.map((doc) => {
      const data = doc.data();
      const planDisplayName = plansMap.get(data.planId)?.displayName || data.planId;

      return {
        id: doc.id,
        amount: data.amount || 0,
        status: data.status || 'pending',
        planName: planDisplayName,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
      };
    });

    // Return user data
    return res.status(200).json({
      user: {
        uid,
        email: userData.email || '',
        displayName: userData.displayName || 'User',
        subscription: {
          plan: userData.subscription?.tier || 'free',
          status: userData.subscription?.status || 'inactive',
          startDate: userData.subscription?.startDate || null,
          endDate: userData.subscription?.endDate || null,
        },
      },
      plans,
      recentPayments,
    });
  } catch (error: any) {
    console.error('❌ [API /user/me] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
