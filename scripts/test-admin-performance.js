#!/usr/bin/env node

/**
 * Test Admin Dashboard Performance
 *
 * This script tests the performance of admin dashboard queries
 * to identify bottlenecks
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, getCountFromServer, getAggregateFromServer, sum, orderBy, limit } = require('firebase/firestore');
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

async function testPerformance() {
  try {
    console.log('🔥 Testing Admin Dashboard Performance\n');
    console.log('Firebase Project:', firebaseConfig.projectId);
    console.log('');

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Test 1: Count users (optimized way)
    console.log('📊 Test 1: Count Users (getCountFromServer)');
    console.time('  ⏱️  Time');
    const countSnapshot = await getCountFromServer(collection(db, 'users'));
    const totalUsers = countSnapshot.data().count;
    console.timeEnd('  ⏱️  Time');
    console.log('  ✅ Total users:', totalUsers);
    console.log('');

    // Test 2: Count users (old way - for comparison)
    console.log('📊 Test 2: Count Users (getDocs - OLD WAY)');
    console.time('  ⏱️  Time');
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const totalUsersOld = usersSnapshot.docs.length;
    console.timeEnd('  ⏱️  Time');
    console.log('  ✅ Total users:', totalUsersOld);
    console.log('  ⚠️  This is much slower! We should use getCountFromServer');
    console.log('');

    // Test 3: Aggregate revenue
    console.log('📊 Test 3: Calculate Revenue (getAggregateFromServer)');
    console.time('  ⏱️  Time');
    try {
      const revenueData = await getAggregateFromServer(
        query(collection(db, 'payments'), where('status', '==', 'approved')),
        { totalRevenue: sum('amount') }
      );
      const revenue = revenueData.data().totalRevenue || 0;
      console.timeEnd('  ⏱️  Time');
      console.log('  ✅ Total revenue:', revenue, 'THB');
    } catch (error) {
      console.timeEnd('  ⏱️  Time');
      console.log('  ⚠️  No payments yet or error:', error.message);
    }
    console.log('');

    // Test 4: Fetch recent users
    console.log('📊 Test 4: Fetch Recent 10 Users');
    console.time('  ⏱️  Time');
    const recentUsers = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(10)));
    console.timeEnd('  ⏱️  Time');
    console.log('  ✅ Fetched:', recentUsers.docs.length, 'users');
    console.log('');

    // Test 5: Parallel queries (optimized approach)
    console.log('📊 Test 5: All Queries in Parallel (OPTIMIZED)');
    console.time('  ⏱️  Total Time');

    const [
      count1,
      count2,
      count3,
      recent1,
    ] = await Promise.all([
      getCountFromServer(collection(db, 'users')),
      getCountFromServer(query(collection(db, 'users'), where('role', '==', 'admin'))),
      getCountFromServer(query(collection(db, 'users'), where('tier', '==', 'free'))),
      getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(10))),
    ]);

    console.timeEnd('  ⏱️  Total Time');
    console.log('  ✅ All queries completed in parallel');
    console.log('  ✅ Total users:', count1.data().count);
    console.log('  ✅ Admin users:', count2.data().count);
    console.log('  ✅ Free users:', count3.data().count);
    console.log('  ✅ Recent users:', recent1.docs.length);
    console.log('');

    // Test 6: Sequential queries (OLD WAY - for comparison)
    console.log('📊 Test 6: All Queries Sequential (OLD WAY)');
    console.time('  ⏱️  Total Time');

    const seq1 = await getCountFromServer(collection(db, 'users'));
    const seq2 = await getCountFromServer(query(collection(db, 'users'), where('role', '==', 'admin')));
    const seq3 = await getCountFromServer(query(collection(db, 'users'), where('tier', '==', 'free')));
    const seq4 = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(10)));

    console.timeEnd('  ⏱️  Total Time');
    console.log('  ⚠️  This is slower! We should use Promise.all()');
    console.log('');

    console.log('🎉 Performance Test Complete!');
    console.log('');
    console.log('📊 Summary:');
    console.log('  • Use getCountFromServer() for counting');
    console.log('  • Use getAggregateFromServer() for sums');
    console.log('  • Use Promise.all() for parallel queries');
    console.log('  • Limit the number of documents fetched');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testPerformance();
