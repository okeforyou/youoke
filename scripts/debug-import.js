const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// --- CONFIGURATION ---
const SOURCE_KEY_PATH = '/Users/boonyanone/Downloads/playokeforyou-firebase-adminsdk-6dzxn-984dbe3f20.json';
const DEST_KEY_PATH = path.join(__dirname, '../serviceAccountKey.json');

const HASH_CONFIG = {
    algorithm: 'SCRYPT',
    key: { rounds: 8, memoryCost: 14 },
    saltSeparator: Buffer.from('Sw==', 'base64'),
    signerKey: Buffer.from('tXvqsU2NnZt+5voL/N2+XxGdu/oCtdCpr+H2gLzJ1X0u1LdBLj1KM5Gs7N09++AXGgsl+MRy9hwxMxktEGXE+Qcwvm==', 'base64'),
};

// --- INITIALIZATION ---
console.log('\n📋 Loading Firebase Admin SDKs...\n');

const sourceKey = require(SOURCE_KEY_PATH);
const destKey = require(DEST_KEY_PATH);

console.log(`Source Project: ${sourceKey.project_id}`);
console.log(`Dest Project:   ${destKey.project_id}\n`);

const sourceApp = admin.initializeApp({
    credential: admin.credential.cert(sourceKey),
}, 'source');

const destApp = admin.initializeApp({
    credential: admin.credential.cert(destKey),
}, 'dest');

const sourceAuth = sourceApp.auth();
const destAuth = destApp.auth();

async function testSingleUser() {
    console.log('🧪 Testing Single User Import\n');

    // Get first real user from Production
    const listResult = await sourceAuth.listUsers(100);
    const realUser = listResult.users.find(u => u.providerData && u.providerData.length > 0);

    if (!realUser) {
        console.log('❌ No real users found in source');
        process.exit(1);
    }

    console.log(`Found user: ${realUser.email}`);
    console.log(`UID: ${realUser.uid}\n`);

    // Check if exists in Dest before import
    console.log('Checking if exists in Dest before import...');
    try {
        const existing = await destAuth.getUser(realUser.uid);
        console.log(`⚠️  User ALREADY EXISTS in Dest: ${existing.email}\n`);
        console.log('This explains why import count doesn\'t match!');
        process.exit(0);
    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            console.log('✅ User NOT in Dest yet. Proceeding with import...\n');
        } else {
            console.error('Error checking:', error.message);
            process.exit(1);
        }
    }

    // Prepare user data
    const userData = {
        uid: realUser.uid,
        email: realUser.email,
        displayName: realUser.displayName,
        photoURL: realUser.photoURL,
        emailVerified: realUser.emailVerified,
        disabled: realUser.disabled,
        metadata: realUser.metadata,
        providerData: realUser.providerData,
    };

    if (realUser.passwordHash && realUser.passwordSalt) {
        userData.passwordHash = Buffer.from(realUser.passwordHash, 'base64');
        userData.passwordSalt = Buffer.from(realUser.passwordSalt, 'base64');
    }

    // Import
    console.log('Importing user...');
    try {
        const result = await destAuth.importUsers([userData], { hash: HASH_CONFIG });
        console.log(`✅ Import result:`, result);
        console.log(`Success count: ${result.successCount}`);
        console.log(`Failure count: ${result.failureCount}`);

        if (result.errors && result.errors.length > 0) {
            console.log(`\n❌ Errors:`);
            result.errors.forEach(err => console.log(err));
        }
    } catch (error) {
        console.error(`\n❌ Import failed:`, error.message);
        process.exit(1);
    }

    // Verify
    console.log('\nVerifying import...');
    try {
        const imported = await destAuth.getUser(realUser.uid);
        console.log(`✅ User successfully imported: ${imported.email}`);
    } catch (error) {
        console.log(`❌ User NOT found after import!`);
    }

    process.exit(0);
}

testSingleUser();
