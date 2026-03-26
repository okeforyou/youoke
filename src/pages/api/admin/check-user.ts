import { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth, adminFirestore } from '@/firebase-admin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const email = req.query.email as string;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    let inAuth = false;
    let authUser = null;
    try {
      authUser = await adminAuth.getUserByEmail(email);
      inAuth = true;
    } catch (e: any) {
      if (e.code !== 'auth/user-not-found') throw e;
    }

    let inFirestore = false;
    let fsUser = null;
    const fsSnapshot = await adminFirestore.collection('users').where('email', '==', email).get();
    if (!fsSnapshot.empty) {
      inFirestore = true;
      fsUser = fsSnapshot.docs[0].data();
    } else {
        // also check if any fs document has this email ignoring case? Not possible directly with where()
    }

    // Try finding by ID if in auth
    let fsUserById = null;
    if (inAuth && authUser) {
        const doc = await adminFirestore.collection('users').doc(authUser.uid).get();
        if (doc.exists) {
            fsUserById = doc.data();
        }
    }

    return res.status(200).json({ 
      success: true, 
      email,
      inAuth,
      authUser: authUser ? { uid: authUser.uid, displayName: authUser.displayName, email: authUser.email } : null,
      inFirestore,
      fsUser,
      fsUserById
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
