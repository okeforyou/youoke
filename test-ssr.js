// Test Firebase Admin initialization and token verification
const admin = require('firebase-admin');

// Environment variables
const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined;

console.log('🔍 Environment Variables Check:');
console.log({
  hasPrivateKey: !!privateKey,
  privateKeyLength: privateKey?.length,
  hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  hasDatabaseURL: !!process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
});

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    });
    console.log('\n✅ Firebase Admin initialized successfully');
  }

  const adminAuth = admin.auth();
  const adminDb = admin.database();

  console.log('\n✅ Firebase Admin Auth and Database instances created');
  console.log('Ready to verify tokens and read database');

} catch (error) {
  console.error('\n❌ Firebase Admin initialization failed:');
  console.error(error);
  process.exit(1);
}
