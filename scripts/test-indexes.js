#!/usr/bin/env node

/**
 * Test Firestore Indexes
 *
 * This script tests if the Firestore indexes are ready and working
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, orderBy, getDocs, limit } = require('firebase/firestore');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env
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

const firebaseConfig = {
  apiKey: envVars.NEXT_PUBLIC_FIREBASE_PUBLIC_API_KEY,
  authDomain: envVars.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: envVars.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: envVars.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  databaseURL: envVars.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

async function testIndexes() {
  try {
    console.log('🔥 Testing Firestore Indexes\n');
    console.log('Firebase Project:', firebaseConfig.projectId);
    console.log('');

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    let allPassed = true;

    // Test 1: users (role + createdAt)
    console.log('📊 Test 1: users (role + createdAt)');
    console.time('  ⏱️  Time');
    try {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'admin'),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      await getDocs(q);
      console.timeEnd('  ⏱️  Time');
      console.log('  ✅ PASSED\n');
    } catch (error) {
      console.timeEnd('  ⏱️  Time');
      console.log('  ❌ FAILED:', error.message);
      if (error.message.includes('index')) {
        console.log('  🔗 Create index:', error.message.match(/https:\/\/[^\s]+/)?.[0] || 'See console for link');
      }
      console.log('');
      allPassed = false;
    }

    // Test 2: users (tier + createdAt)
    console.log('📊 Test 2: users (tier + createdAt)');
    console.time('  ⏱️  Time');
    try {
      const q = query(
        collection(db, 'users'),
        where('tier', '==', 'free'),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      await getDocs(q);
      console.timeEnd('  ⏱️  Time');
      console.log('  ✅ PASSED\n');
    } catch (error) {
      console.timeEnd('  ⏱️  Time');
      console.log('  ❌ FAILED:', error.message);
      console.log('');
      allPassed = false;
    }

    // Test 3: users (isPremium + createdAt)
    console.log('📊 Test 3: users (isPremium + createdAt)');
    console.time('  ⏱️  Time');
    try {
      const q = query(
        collection(db, 'users'),
        where('isPremium', '==', true),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      await getDocs(q);
      console.timeEnd('  ⏱️  Time');
      console.log('  ✅ PASSED\n');
    } catch (error) {
      console.timeEnd('  ⏱️  Time');
      console.log('  ❌ FAILED:', error.message);
      console.log('');
      allPassed = false;
    }

    // Test 4: payments (status + createdAt)
    console.log('📊 Test 4: payments (status + createdAt)');
    console.time('  ⏱️  Time');
    try {
      const q = query(
        collection(db, 'payments'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      await getDocs(q);
      console.timeEnd('  ⏱️  Time');
      console.log('  ✅ PASSED\n');
    } catch (error) {
      console.timeEnd('  ⏱️  Time');
      console.log('  ❌ FAILED:', error.message);
      console.log('');
      allPassed = false;
    }

    // Test 5: payments (status + approvedAt)
    console.log('📊 Test 5: payments (status + approvedAt)');
    console.time('  ⏱️  Time');
    try {
      const q = query(
        collection(db, 'payments'),
        where('status', '==', 'approved'),
        orderBy('approvedAt', 'desc'),
        limit(1)
      );
      await getDocs(q);
      console.timeEnd('  ⏱️  Time');
      console.log('  ✅ PASSED\n');
    } catch (error) {
      console.timeEnd('  ⏱️  Time');
      console.log('  ❌ FAILED:', error.message);
      console.log('');
      allPassed = false;
    }

    // Test 6: payments (userId + createdAt)
    console.log('📊 Test 6: payments (userId + createdAt)');
    console.time('  ⏱️  Time');
    try {
      const q = query(
        collection(db, 'payments'),
        where('userId', '==', 'test-user-id'),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      await getDocs(q);
      console.timeEnd('  ⏱️  Time');
      console.log('  ✅ PASSED\n');
    } catch (error) {
      console.timeEnd('  ⏱️  Time');
      console.log('  ❌ FAILED:', error.message);
      console.log('');
      allPassed = false;
    }

    console.log('━'.repeat(50));
    if (allPassed) {
      console.log('🎉 ALL TESTS PASSED!');
      console.log('');
      console.log('All indexes are ready and working!');
      console.log('Admin panel should be FAST now! 🚀');
      console.log('');
      process.exit(0);
    } else {
      console.log('⚠️  SOME TESTS FAILED');
      console.log('');
      console.log('Indexes are still building or not created yet.');
      console.log('Please wait 2-5 minutes and try again.');
      console.log('');
      console.log('Check status:');
      console.log('👉 https://console.firebase.google.com/project/' + firebaseConfig.projectId + '/firestore/indexes');
      console.log('');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testIndexes();
