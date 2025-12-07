const admin = require('firebase-admin');
const serviceAccount = require('../playokeforyou-dev-firebase-adminsdk-fbsvc-210fc7f3b5.json');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://playokeforyou-dev-default-rtdb.asia-southeast1.firebasedatabase.app'
});

const db = admin.database();

async function setAdminRole() {
  const uid = 'P6r7fkMfvherVvzXV35NPhF5TVw2'; // Your UID

  try {
    console.log('Setting admin role for UID:', uid);

    // Get current user data
    const userRef = db.ref(`users/${uid}`);
    const snapshot = await userRef.once('value');

    if (!snapshot.exists()) {
      console.log('❌ User not found');
      process.exit(1);
    }

    const userData = snapshot.val();
    console.log('Current role:', userData.role || 'none');

    // Update role to admin
    await userRef.update({
      role: 'admin',
      updatedAt: Date.now()
    });

    console.log('✅ User role updated to admin!');

    // Verify
    const verifySnapshot = await userRef.once('value');
    const verifyData = verifySnapshot.val();
    console.log('Verified role:', verifyData.role);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting admin role:', error);
    process.exit(1);
  }
}

setAdminRole();
