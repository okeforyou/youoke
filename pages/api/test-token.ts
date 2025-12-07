import type { NextApiRequest, NextApiResponse } from 'next';
import { adminAuth } from '../../firebase-admin';
import nookies from 'nookies';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const cookies = nookies.get({ req });
    const token = cookies.token;

    if (!token) {
      return res.status(401).json({ error: 'No token found in cookies' });
    }

    if (!adminAuth) {
      return res.status(500).json({ error: 'Firebase Admin Auth not initialized' });
    }

    // Try to verify the token
    const decodedToken = await adminAuth.verifyIdToken(token);

    return res.status(200).json({
      success: true,
      uid: decodedToken.uid,
      email: decodedToken.email,
      tokenLength: token.length,
      message: 'Token verified successfully',
    });
  } catch (error: any) {
    return res.status(401).json({
      error: error.message,
      code: error.code,
      stack: error.stack?.split('\n').slice(0, 5),
    });
  }
}
