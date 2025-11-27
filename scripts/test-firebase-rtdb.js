/**
 * Test Firebase Realtime Database Connection
 *
 * This script tests:
 * 1. Firebase initialization
 * 2. Anonymous authentication
 * 3. Realtime Database write/read
 * 4. Security rules validation
 *
 * Usage: node scripts/test-firebase-rtdb.js
 */

const { initializeApp } = require('firebase/app');
const { getAuth, signInAnonymously } = require('firebase/auth');
const { getDatabase } = require('firebase/database');
const fs = require('fs');
const path = require('path');

// Load environment variables manually from .env.production
const envPath = path.join(__dirname, '..', '.env.production');
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

console.log('🧪 Testing Firebase Realtime Database Connection\n');

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
  console.error('❌ Missing environment variables:');
  missingVars.forEach(v => console.error('  -', v));
  process.exit(1);
}

async function testConnection() {
  try {
    // 1. Initialize Firebase
    console.log('1️⃣ Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    console.log('   ✅ Firebase initialized\n');

    // 2. Get Database instance
    console.log('2️⃣ Getting Realtime Database instance...');
    const database = getDatabase(app);
    const dbURL = database.app.options.databaseURL;
    console.log('   ✅ Database URL:', dbURL);

    // Validate region
    if (dbURL.includes('asia-southeast1')) {
      console.log('   ✅ Region: asia-southeast1 (correct!)');
    } else {
      console.log('   ⚠️  Warning: Database URL missing region (asia-southeast1)');
    }
    console.log('');

    // 3. Anonymous Sign-in
    console.log('3️⃣ Testing Anonymous Authentication...');
    const auth = getAuth(app);
    const userCredential = await signInAnonymously(auth);
    console.log('   ✅ Anonymous sign-in successful');
    console.log('   User ID:', userCredential.user.uid);
    console.log('');

    // 4. Test write to database (REST API)
    console.log('4️⃣ Testing Database Write (REST API)...');
    const testRoomCode = `test_${Date.now()}`;
    const testData = {
      hostId: 'test-script',
      isHost: true,
      state: {
        queue: [],
        currentIndex: 0,
        currentVideo: null,
        controls: { isPlaying: false, isMuted: true },
      },
      createdAt: Date.now(),
      testMode: true,
    };

    const token = await userCredential.user.getIdToken();
    const writeURL = `${dbURL}/rooms/${testRoomCode}.json?auth=${token}`;

    console.log('   Writing to:', `/rooms/${testRoomCode}`);
    const writeResponse = await fetch(writeURL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData),
    });

    if (!writeResponse.ok) {
      const errorText = await writeResponse.text();
      throw new Error(`Write failed: ${writeResponse.status} ${writeResponse.statusText}\n${errorText}`);
    }

    const writeResult = await writeResponse.json();
    console.log('   ✅ Write successful');
    console.log('');

    // 5. Test read from database
    console.log('5️⃣ Testing Database Read (REST API)...');
    const readURL = `${dbURL}/rooms/${testRoomCode}.json`;
    const readResponse = await fetch(readURL);

    if (!readResponse.ok) {
      throw new Error(`Read failed: ${readResponse.status} ${readResponse.statusText}`);
    }

    const readData = await readResponse.json();
    console.log('   ✅ Read successful');
    console.log('   Data:', JSON.stringify(readData, null, 2).substring(0, 200) + '...');
    console.log('');

    // 6. Test command write
    console.log('6️⃣ Testing Command Write...');
    const commandId = `cmd_${Date.now()}_test`;
    const commandData = {
      id: commandId,
      command: { type: 'CONNECT', payload: null },
      status: 'pending',
      timestamp: Date.now(),
      from: 'test-script',
    };

    const cmdURL = `${dbURL}/rooms/${testRoomCode}/commands/${commandId}.json?auth=${token}`;
    const cmdResponse = await fetch(cmdURL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(commandData),
    });

    if (!cmdResponse.ok) {
      throw new Error(`Command write failed: ${cmdResponse.status}`);
    }

    console.log('   ✅ Command write successful');
    console.log('');

    // 7. Cleanup - Delete test room
    console.log('7️⃣ Cleaning up test data...');
    const deleteURL = `${dbURL}/rooms/${testRoomCode}.json?auth=${token}`;
    const deleteResponse = await fetch(deleteURL, { method: 'DELETE' });

    if (deleteResponse.ok) {
      console.log('   ✅ Test data deleted');
    } else {
      console.log('   ⚠️  Could not delete test data (manual cleanup needed)');
    }
    console.log('');

    // Success!
    console.log('✅ ALL TESTS PASSED!\n');
    console.log('Firebase Realtime Database is configured correctly and ready to use.');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Open https://play.okeforyou.com/monitor');
    console.log('  2. Check that room code and QR code display');
    console.log('  3. Connect from mobile device');
    console.log('  4. Test adding songs and playback');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ TEST FAILED!\n');
    console.error('Error:', error.message);
    console.error('');

    // Provide helpful troubleshooting tips
    if (error.message.includes('Permission denied')) {
      console.error('Troubleshooting:');
      console.error('  1. Check Firebase Realtime Database Security Rules');
      console.error('  2. Ensure Anonymous Authentication is enabled');
      console.error('  3. See FIREBASE-REALTIME-DB-SETUP.md for details');
    } else if (error.message.includes('404')) {
      console.error('Troubleshooting:');
      console.error('  1. Verify DATABASE_URL is correct');
      console.error('  2. Check that Realtime Database is created in Firebase Console');
      console.error('  3. Ensure region is asia-southeast1');
    }

    console.error('');
    process.exit(1);
  }
}

// Run tests
testConnection();
