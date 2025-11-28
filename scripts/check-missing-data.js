#!/usr/bin/env node

/**
 * Check for Missing Data in Firestore
 *
 * This script checks if plans and settings documents exist
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, getDoc } = require('firebase/firestore');
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

async function checkData() {
  try {
    console.log('🔍 Checking Firestore Data\n');
    console.log('Firebase Project:', firebaseConfig.projectId);
    console.log('');

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Check plans
    console.log('📊 Checking Plans Collection:');
    console.time('  ⏱️  Time');
    const plansSnapshot = await getDocs(collection(db, 'plans'));
    console.timeEnd('  ⏱️  Time');

    if (plansSnapshot.empty) {
      console.log('  ❌ NO PLANS FOUND! This is why Subscriptions page is slow!');
      console.log('  💡 The page is waiting for plans that don\'t exist.');
      console.log('');
    } else {
      console.log('  ✅ Found', plansSnapshot.size, 'plans:');
      plansSnapshot.forEach(doc => {
        console.log('    -', doc.id, ':', doc.data().displayName || doc.data().name);
      });
      console.log('');
    }

    // Check settings/general
    console.log('📊 Checking Settings/General:');
    console.time('  ⏱️  Time');
    const generalDoc = await getDoc(doc(db, 'settings', 'general'));
    console.timeEnd('  ⏱️  Time');

    if (!generalDoc.exists()) {
      console.log('  ❌ NOT FOUND! This is why Settings page is slow!');
      console.log('  💡 The page is waiting for a document that doesn\'t exist.');
      console.log('');
    } else {
      console.log('  ✅ Found settings/general');
      console.log('    Data:', JSON.stringify(generalDoc.data(), null, 2));
      console.log('');
    }

    // Check settings/features
    console.log('📊 Checking Settings/Features:');
    console.time('  ⏱️  Time');
    const featuresDoc = await getDoc(doc(db, 'settings', 'features'));
    console.timeEnd('  ⏱️  Time');

    if (!featuresDoc.exists()) {
      console.log('  ❌ NOT FOUND! This is why Settings page is slow!');
      console.log('  💡 The page is waiting for a document that doesn\'t exist.');
      console.log('');
    } else {
      console.log('  ✅ Found settings/features');
      console.log('    Data:', JSON.stringify(featuresDoc.data(), null, 2));
      console.log('');
    }

    console.log('━'.repeat(60));
    console.log('🎯 Summary:');
    console.log('');

    const issues = [];
    if (plansSnapshot.empty) issues.push('Plans collection is empty');
    if (!generalDoc.exists()) issues.push('settings/general document missing');
    if (!featuresDoc.exists()) issues.push('settings/features document missing');

    if (issues.length > 0) {
      console.log('⚠️  Issues Found:');
      issues.forEach(issue => console.log('  • ' + issue));
      console.log('');
      console.log('These missing documents cause pages to be slow!');
      console.log('The pages wait for documents that don\'t exist.');
      console.log('');
      console.log('Solution: Create these documents in Firestore');
      console.log('or update the code to handle missing documents.');
      console.log('');
    } else {
      console.log('✅ All data exists! The slowness might be due to:');
      console.log('  • Network latency');
      console.log('  • Cache not working');
      console.log('  • Other performance issues');
      console.log('');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkData();
