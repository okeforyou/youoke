/**
 * Debug API to check Firebase environment variables
 * Access: /api/debug-firebase-env
 */

import type { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const firebaseEnv = {
    NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY
      ? `${process.env.NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY.substring(0, 10)}...`
      : 'MISSING',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'MISSING',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'MISSING',
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'MISSING',
    NEXT_PUBLIC_FIREBASE_DATABASE_URL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'MISSING',
  };

  const allPresent = Object.values(firebaseEnv).every(v => v !== 'MISSING');

  res.status(200).json({
    status: allPresent ? 'OK' : 'MISSING_VARS',
    variables: firebaseEnv,
    critical: {
      hasDatabaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL !== undefined,
      databaseURLValue: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'MISSING',
    },
  });
}
