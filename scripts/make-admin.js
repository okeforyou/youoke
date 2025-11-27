#!/usr/bin/env node

/**
 * Make a user an admin
 *
 * Usage:
 *   node scripts/make-admin.js YOUR_EMAIL@example.com
 *
 * This script will:
 * 1. Find the user by email
 * 2. Update their role to 'admin'
 * 3. Set them as premium/lifetime
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, updateDoc, doc, Timestamp } = require('firebase/firestore');
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

const email = process.argv[2];

if (!email) {
  console.error('❌ Error: Please provide an email address');
  console.error('');
  console.error('Usage:');
  console.error('  node scripts/make-admin.js YOUR_EMAIL@example.com');
  console.error('');
  process.exit(1);
}

async function makeAdmin() {
  try {
    console.log('🔥 Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log(`🔍 Looking for user with email: ${email}...`);

    // Find user by email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.error(`❌ User not found with email: ${email}`);
      console.error('');
      console.error('💡 Tip: Make sure you have logged in at least once with this email');
      process.exit(1);
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    console.log('✅ User found:');
    console.log(`   UID: ${userDoc.id}`);
    console.log(`   Email: ${userData.email}`);
    console.log(`   Name: ${userData.displayName || 'N/A'}`);
    console.log(`   Current Role: ${userData.role || 'user'}`);
    console.log(`   Current Tier: ${userData.tier || 'free'}`);
    console.log('');

    if (userData.role === 'admin') {
      console.log('ℹ️  User is already an admin!');
      process.exit(0);
    }

    console.log('🔧 Updating user to admin...');

    // Update user to admin
    const userRef = doc(db, 'users', userDoc.id);
    await updateDoc(userRef, {
      role: 'admin',
      tier: 'lifetime',
      isPremium: true,
      isActive: true,
      updatedAt: Timestamp.now(),
    });

    console.log('');
    console.log('🎉 SUCCESS! User is now an admin!');
    console.log('');
    console.log('Changes made:');
    console.log('  ✅ role: admin');
    console.log('  ✅ tier: lifetime');
    console.log('  ✅ isPremium: true');
    console.log('  ✅ isActive: true');
    console.log('');
    console.log('📌 Next steps:');
    console.log('  1. Refresh your browser');
    console.log('  2. Go to /admin');
    console.log('  3. You should now have access!');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

makeAdmin();
