#!/usr/bin/env node

/**
 * Test Firebase DEV (playokeforyou-dev) Connection
 *
 * Tests:
 * 1. Firebase initialization
 * 2. Anonymous sign-in
 * 3. Realtime Database write
 * 4. Realtime Database read
 *
 * Usage: node scripts/test-firebase-dev.js
 */

const { initializeApp } = require('firebase/app');
const { getAuth, signInAnonymously } = require('firebase/auth');
const { getDatabase, ref, set, get } = require('firebase/database');
const fs = require('fs');
const path = require('path');

// Load environment variables manually from .env
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

console.log('🧪 Testing Firebase DEV (playokeforyou-dev) Connection\n');

// Display configuration (hide sensitive data)
console.log('📋 Configuration:');
console.log('  Project ID:', envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
console.log('  Auth Domain:', envVars.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
console.log('  Database URL:', envVars.NEXT_PUBLIC_FIREBASE_DATABASE_URL);
console.log('  API Key:', envVars.NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY?.substring(0, 10) + '...');
console.log('');

// Firebase configuration
const firebaseConfig = {
  apiKey: envVars.NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY,
  authDomain: envVars.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: envVars.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  databaseURL: envVars.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

// Validate configuration
const missingVars = [];
if (!firebaseConfig.apiKey) missingVars.push('NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY');
if (!firebaseConfig.authDomain) missingVars.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN');
if (!firebaseConfig.projectId) missingVars.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
if (!firebaseConfig.storageBucket) missingVars.push('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET');
if (!firebaseConfig.databaseURL) missingVars.push('NEXT_PUBLIC_FIREBASE_DATABASE_URL');

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(v => console.error(`   - ${v}`));
  console.error('\n💡 Check your .env file');
  process.exit(1);
}

async function testFirebase() {
  try {
    // Test 1: Initialize Firebase
    console.log('📦 Test 1: Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getDatabase(app);
    console.log('✅ Firebase initialized\n');

    // Test 2: Anonymous Sign-in
    console.log('🔐 Test 2: Testing Anonymous sign-in...');
    try {
      const userCredential = await signInAnonymously(auth);
      console.log('✅ Anonymous sign-in successful');
      console.log('   User ID:', userCredential.user.uid);
      console.log('');
    } catch (error) {
      console.error('❌ Anonymous sign-in failed:', error.code);
      console.error('   Message:', error.message);
      console.error('\n💡 Fix: Enable Anonymous Authentication in Firebase Console');
      console.error('   👉 https://console.firebase.google.com/project/playokeforyou-dev/authentication/providers\n');
      process.exit(1);
    }

    // Test 3: Write to Realtime Database
    console.log('📝 Test 3: Writing to Realtime Database...');
    const testRoomCode = 'test_' + Date.now();
    const testRef = ref(db, `rooms/${testRoomCode}`);

    try {
      await set(testRef, {
        createdAt: Date.now(),
        hostId: 'test-script',
        isHost: true,
        test: true
      });
      console.log('✅ Database write successful');
      console.log('   Room code:', testRoomCode);
      console.log('');
    } catch (error) {
      console.error('❌ Database write failed:', error.code);
      console.error('   Message:', error.message);
      console.error('\n💡 Fix: Check Security Rules in Realtime Database');
      console.error('   👉 https://console.firebase.google.com/project/playokeforyou-dev/database/rules\n');
      process.exit(1);
    }

    // Test 4: Read from Realtime Database
    console.log('📖 Test 4: Reading from Realtime Database...');
    try {
      const snapshot = await get(testRef);
      if (snapshot.exists()) {
        console.log('✅ Database read successful');
        console.log('   Data:', snapshot.val());
        console.log('');
      } else {
        console.error('❌ Database read failed: No data found');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Database read failed:', error.code);
      console.error('   Message:', error.message);
      process.exit(1);
    }

    // Clean up test data
    console.log('🧹 Cleaning up test data...');
    await set(testRef, null);
    console.log('✅ Test data removed\n');

    // All tests passed!
    console.log('🎉 ALL TESTS PASSED!');
    console.log('');
    console.log('✅ Firebase DEV is configured correctly');
    console.log('✅ Anonymous Authentication is enabled');
    console.log('✅ Realtime Database is working');
    console.log('✅ Security Rules allow read/write');
    console.log('');
    console.log('📌 Next step: Update Vercel environment variables and deploy');
    console.log('   Run: node scripts/update-vercel-firebase.js');
    console.log('');

    process.exit(0);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

testFirebase();
