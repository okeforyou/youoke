const admin = require('firebase-admin');
const serviceAccount = require('../playokeforyou-dev-firebase-adminsdk-fbsvc-210fc7f3b5.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://playokeforyou-dev-default-rtdb.asia-southeast1.firebasedatabase.app'
});

const db = admin.database();

async function createUserProfile() {
  const uid = 'P6r7fkMfvherVvzXV35NPhF5TVw2';

  const userProfile = {
    uid: uid,
    email: 'boonyanone@gmail.com',
    displayName: 'Boonyanone',
    phone: null,
    photoURL: null,
    role: 'user',
    subscription: {
      plan: 'free',
      startDate: null,
      endDate: null,
      status: 'active',
      paymentProof: null
    },
    settings: {
      autoPlayQueue: true,
      defaultVolume: 80,
      quality: 'auto',
      theme: 'dark',
      notifications: {
        expiryReminder: true,
        newAds: false
      }
    },
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  try {
    console.log('Creating user profile for UID:', uid);

    await db.ref(`users/${uid}`).set(userProfile);

    console.log('✅ User profile created successfully!');
    console.log('Profile:', JSON.stringify(userProfile, null, 2));

    // Verify
    const snapshot = await db.ref(`users/${uid}`).once('value');
    if (snapshot.exists()) {
      console.log('✅ Verified: Profile exists in database');
    } else {
      console.log('❌ Error: Profile not found after creation');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating user profile:', error);
    process.exit(1);
  }
}

createUserProfile();
