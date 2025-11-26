#!/usr/bin/env node

/**
 * Seed Development Database with Test Data
 *
 * Creates:
 * - Admin user (boonyanone@gmail.com)
 * - Test users (various tiers)
 * - Subscription plans
 * - System settings
 *
 * Usage: node scripts/seed-dev-data.js
 */

const admin = require('firebase-admin');
const path = require('path');

// Check if service account key exists
const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
let serviceAccount;

try {
  serviceAccount = require(serviceAccountPath);
} catch (error) {
  console.error('❌ Error: serviceAccountKey.json not found!');
  console.error('');
  console.error('📥 Please download it from Firebase Console:');
  console.error('   1. Go to: https://console.firebase.google.com/');
  console.error('   2. Select project: playokeforyou-dev');
  console.error('   3. Settings → Service accounts');
  console.error('   4. Click "Generate new private key"');
  console.error('   5. Save as: serviceAccountKey.json');
  console.error('   6. Move to project root');
  console.error('');
  process.exit(1);
}

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://playokeforyou-dev-default-rtdb.asia-southeast1.firebasedatabase.app'
});

const auth = admin.auth();
const db = admin.firestore();

// Test users to create
const testUsers = [
  {
    email: 'boonyanone@gmail.com',
    password: 'Boonyanone@5561',
    displayName: 'Boonyanone (Admin)',
    role: 'admin',
    tier: 'lifetime',
    isPremium: true,
    isActive: true,
    isLegacy: true,
  },
  {
    email: 'admin@test.com',
    password: 'admin123',
    displayName: 'Admin User',
    role: 'admin',
    tier: 'lifetime',
    isPremium: true,
    isActive: true,
    isLegacy: false,
  },
  {
    email: 'free@test.com',
    password: 'test1234',
    displayName: 'Free User',
    role: 'user',
    tier: 'free',
    isPremium: false,
    isActive: true,
    isLegacy: false,
  },
  {
    email: 'monthly@test.com',
    password: 'test1234',
    displayName: 'Monthly User',
    role: 'user',
    tier: 'monthly',
    isPremium: true,
    isActive: true,
    isLegacy: false,
    subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  },
  {
    email: 'yearly@test.com',
    password: 'test1234',
    displayName: 'Yearly User',
    role: 'user',
    tier: 'yearly',
    isPremium: true,
    isActive: true,
    isLegacy: false,
    subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 365 days
  },
];

// Subscription plans
const subscriptionPlans = [
  {
    id: 'free',
    name: 'Free',
    displayName: 'ฟรี',
    price: 0,
    currency: 'THB',
    duration: null,
    features: [
      'ค้นหาเพลงได้',
      'เล่นเพลงได้ไม่จำกัด',
      'มีโฆษณา',
      'Cast to TV (มีโฆษณา)',
    ],
    maxRooms: 1,
    maxSongsInQueue: 50,
    isActive: true,
    isVisible: true,
  },
  {
    id: 'monthly',
    name: 'Monthly',
    displayName: 'รายเดือน',
    price: 99,
    currency: 'THB',
    duration: 30,
    features: [
      'ทุกอย่างใน Free',
      'ไม่มีโฆษณา',
      'Cast to TV (ไม่มีโฆษณา)',
      'สร้างห้องได้ 3 ห้อง',
      'คิวเพลงได้ 100 เพลง',
    ],
    maxRooms: 3,
    maxSongsInQueue: 100,
    isActive: true,
    isVisible: true,
  },
  {
    id: 'yearly',
    name: 'Yearly',
    displayName: 'รายปี',
    price: 990,
    currency: 'THB',
    duration: 365,
    features: [
      'ทุกอย่างใน Monthly',
      'ประหยัดกว่า 17%',
      'สร้างห้องได้ 10 ห้อง',
      'คิวเพลงได้ไม่จำกัด',
      'ลำดับความสำคัญสูงสุด',
    ],
    maxRooms: 10,
    maxSongsInQueue: 999,
    isActive: true,
    isVisible: true,
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    displayName: 'ตลอดชีพ',
    price: 0,
    currency: 'THB',
    duration: null,
    features: [
      'ทุกอย่างใน Yearly',
      'ใช้งานได้ตลอดชีพ',
      'สำหรับสมาชิกเก่า',
    ],
    maxRooms: 10,
    maxSongsInQueue: 999,
    isActive: false,
    isVisible: false,
  },
];

async function seedData() {
  console.log('🌱 Starting to seed development database...\n');

  try {
    // 1. Create users
    console.log('👥 Creating test users...');
    for (const userData of testUsers) {
      try {
        // Create user in Authentication
        const userRecord = await auth.createUser({
          email: userData.email,
          password: userData.password,
          displayName: userData.displayName,
          emailVerified: true,
        });

        console.log(`✅ Created user: ${userData.email} (${userRecord.uid})`);

        // Set custom claims (for role-based access)
        await auth.setCustomUserClaims(userRecord.uid, {
          role: userData.role,
          tier: userData.tier,
        });

        console.log(`   🔐 Set custom claims: role=${userData.role}, tier=${userData.tier}`);

        // Create user profile in Firestore
        const userProfile = {
          uid: userRecord.uid,
          email: userData.email,
          displayName: userData.displayName,
          role: userData.role,
          tier: userData.tier,
          isPremium: userData.isPremium,
          isActive: userData.isActive,
          isLegacy: userData.isLegacy,
          provider: 'password',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        // Add subscription expiry if exists
        if (userData.subscriptionExpiry) {
          userProfile.subscriptionExpiry = admin.firestore.Timestamp.fromDate(userData.subscriptionExpiry);
          userProfile.subscriptionStart = admin.firestore.Timestamp.now();
        } else if (userData.tier === 'lifetime') {
          userProfile.subscriptionExpiry = null; // null = lifetime
          userProfile.subscriptionStart = admin.firestore.Timestamp.now();
        }

        await db.collection('users').doc(userRecord.uid).set(userProfile);

        console.log(`   📄 Created Firestore profile`);
        console.log('');

      } catch (error) {
        if (error.code === 'auth/email-already-exists') {
          console.log(`⚠️  User already exists: ${userData.email}`);
          console.log('');
        } else {
          console.error(`❌ Error creating user ${userData.email}:`, error.message);
          console.log('');
        }
      }
    }

    // 2. Create subscription plans
    console.log('💰 Creating subscription plans...');
    for (const plan of subscriptionPlans) {
      await db.collection('plans').doc(plan.id).set({
        ...plan,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`✅ Created plan: ${plan.displayName} (${plan.price} ${plan.currency})`);
    }
    console.log('');

    // 3. Create system settings
    console.log('⚙️  Creating system settings...');
    await db.collection('settings').doc('general').set({
      siteName: 'YouOke',
      siteDescription: 'คาราโอเกะออนไลน์',
      maintenanceMode: false,
      allowGuestAccess: true,
      maxGuestsPerRoom: 10,
      defaultLanguage: 'th',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('✅ Created general settings');

    await db.collection('settings').doc('features').set({
      castModeEnabled: true,
      queueManagementEnabled: true,
      shareRoomEnabled: true,
      voiceControlEnabled: false,
      lyricsEnabled: false,
      midiPlayerEnabled: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('✅ Created feature flags');
    console.log('');

    // Done!
    console.log('🎉 Seed completed successfully!\n');
    console.log('📝 Test accounts created:');
    console.log('');
    testUsers.forEach(user => {
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: ${user.password}`);
      console.log(`   Role: ${user.role} | Tier: ${user.tier}`);
      console.log('');
    });

    console.log('✅ You can now login with any of these accounts!');
    console.log('');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }

  process.exit(0);
}

// Run seed
seedData();
