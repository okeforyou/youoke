#!/usr/bin/env node

/**
 * Wait for Firestore Indexes to be Ready
 *
 * This script polls Firestore indexes every 30 seconds until all are ready
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

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const POLL_INTERVAL = 30000; // 30 seconds
const MAX_ATTEMPTS = 20; // 10 minutes total

async function testIndex(name, testQuery) {
  try {
    await getDocs(testQuery);
    return { name, status: 'ready' };
  } catch (error) {
    if (error.message.includes('currently building')) {
      return { name, status: 'building' };
    }
    return { name, status: 'error', error: error.message };
  }
}

async function checkAllIndexes() {
  const tests = [
    {
      name: 'users (role + createdAt)',
      query: query(
        collection(db, 'users'),
        where('role', '==', 'admin'),
        orderBy('createdAt', 'desc'),
        limit(1)
      ),
    },
    {
      name: 'users (tier + createdAt)',
      query: query(
        collection(db, 'users'),
        where('tier', '==', 'free'),
        orderBy('createdAt', 'desc'),
        limit(1)
      ),
    },
    {
      name: 'users (isPremium + createdAt)',
      query: query(
        collection(db, 'users'),
        where('isPremium', '==', true),
        orderBy('createdAt', 'desc'),
        limit(1)
      ),
    },
    {
      name: 'payments (status + createdAt)',
      query: query(
        collection(db, 'payments'),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc'),
        limit(1)
      ),
    },
    {
      name: 'payments (status + approvedAt)',
      query: query(
        collection(db, 'payments'),
        where('status', '==', 'approved'),
        orderBy('approvedAt', 'desc'),
        limit(1)
      ),
    },
    {
      name: 'payments (userId + createdAt)',
      query: query(
        collection(db, 'payments'),
        where('userId', '==', 'test-user-id'),
        orderBy('createdAt', 'desc'),
        limit(1)
      ),
    },
  ];

  const results = await Promise.all(
    tests.map(({ name, query }) => testIndex(name, query))
  );

  return results;
}

async function waitForIndexes() {
  console.log('🔥 Waiting for Firestore Indexes to be Ready\n');
  console.log('Firebase Project:', firebaseConfig.projectId);
  console.log('Check status: https://console.firebase.google.com/project/' + firebaseConfig.projectId + '/firestore/indexes');
  console.log('\nPolling every 30 seconds...\n');

  let attempt = 0;

  while (attempt < MAX_ATTEMPTS) {
    attempt++;
    const timestamp = new Date().toLocaleTimeString('th-TH');
    console.log(`[${timestamp}] Attempt ${attempt}/${MAX_ATTEMPTS}:`);

    const results = await checkAllIndexes();

    const readyCount = results.filter(r => r.status === 'ready').length;
    const buildingCount = results.filter(r => r.status === 'building').length;
    const errorCount = results.filter(r => r.status === 'error').length;

    console.log(`  ✅ Ready: ${readyCount}/6`);
    console.log(`  ⏳ Building: ${buildingCount}/6`);
    if (errorCount > 0) {
      console.log(`  ❌ Errors: ${errorCount}/6`);
    }

    // Show details
    results.forEach(result => {
      if (result.status === 'ready') {
        console.log(`    ✅ ${result.name}`);
      } else if (result.status === 'building') {
        console.log(`    ⏳ ${result.name} - still building...`);
      } else {
        console.log(`    ❌ ${result.name} - ${result.error}`);
      }
    });

    console.log('');

    // Check if all ready
    if (readyCount === 6) {
      console.log('━'.repeat(60));
      console.log('🎉 ALL INDEXES ARE READY!');
      console.log('');
      console.log('Admin Panel should be FAST now! 🚀');
      console.log('');
      console.log('Expected performance:');
      console.log('  • Dashboard: <500ms (was 5-10s)');
      console.log('  • Users page: <300ms (was 2-3s)');
      console.log('  • Payments page: <400ms (was 3-5s)');
      console.log('');
      console.log('Test it now: https://youoke.vercel.app/admin');
      console.log('');
      process.exit(0);
    }

    // Wait before next attempt
    if (attempt < MAX_ATTEMPTS) {
      console.log(`Waiting 30 seconds before next check...\n`);
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
    }
  }

  console.log('━'.repeat(60));
  console.log('⚠️  TIMEOUT: Indexes are taking longer than expected');
  console.log('');
  console.log('Please check manually:');
  console.log('👉 https://console.firebase.google.com/project/' + firebaseConfig.projectId + '/firestore/indexes');
  console.log('');
  console.log('Indexes should be "Enabled" (green) to work.');
  console.log('');
  process.exit(1);
}

waitForIndexes().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
