#!/usr/bin/env node

/**
 * Test Firebase Admin SDK - Realtime Database Connection
 * Tests if admin credentials can access playokeforyou-dev RTDB
 */

const admin = require('firebase-admin');

// Load credentials
const serviceAccount = require('./serviceAccountKey.json');

console.log('🔧 Initializing Firebase Admin SDK...');
console.log('   Project:', serviceAccount.project_id);
console.log('   Client Email:', serviceAccount.client_email);
console.log('');

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://playokeforyou-dev-default-rtdb.asia-southeast1.firebasedatabase.app'
  });

  console.log('✅ Firebase Admin initialized');
  console.log('');

  // Test 1: List users in Authentication
  console.log('📋 Test 1: List users in Authentication...');
  admin.auth().listUsers(5)
    .then((listUsersResult) => {
      console.log(`✅ Found ${listUsersResult.users.length} users:`);
      listUsersResult.users.forEach((userRecord) => {
        console.log(`   - ${userRecord.email} (${userRecord.uid})`);
      });
      console.log('');

      // Test 2: Read Realtime Database
      console.log('📋 Test 2: Read users from Realtime Database...');
      return admin.database().ref('users').once('value');
    })
    .then((snapshot) => {
      if (snapshot.exists()) {
        const users = snapshot.val();
        const userCount = Object.keys(users).length;
        console.log(`✅ Found ${userCount} user profiles in RTDB:`);

        Object.entries(users).forEach(([uid, userData]) => {
          console.log(`   - ${userData.email || 'No email'} (${uid})`);
          console.log(`     Plan: ${userData.plan || 'N/A'}, Active: ${userData.isActive}`);
        });
      } else {
        console.log('⚠️  No user profiles found in Realtime Database');
        console.log('   Path checked: /users');
        console.log('');
        console.log('💡 This is expected if no users have registered yet.');
        console.log('   After registration, profiles will appear here.');
      }
      console.log('');

      // Test 3: Read Firestore plans
      console.log('📋 Test 3: Read plans from Firestore...');
      return admin.firestore().collection('plans').get();
    })
    .then((snapshot) => {
      console.log(`✅ Found ${snapshot.size} plans in Firestore:`);
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`   - ${data.displayName} (${doc.id}): ${data.price} ${data.currency}`);
      });
      console.log('');

      console.log('🎉 All tests passed!');
      console.log('');
      console.log('📝 Summary:');
      console.log('   - Firebase Admin SDK: Working ✅');
      console.log('   - Authentication: Connected ✅');
      console.log('   - Realtime Database: Connected ✅');
      console.log('   - Firestore: Connected ✅');
      console.log('');

      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Test failed:', error.message);
      console.error('');
      console.error('Full error:', error);
      process.exit(1);
    });

} catch (error) {
  console.error('❌ Initialization failed:', error.message);
  console.error('');
  console.error('Full error:', error);
  process.exit(1);
}
