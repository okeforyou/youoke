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

// TEST MODE: Only migrate 10 users
const TEST_MODE = process.argv.includes('--test');
const MAX_TEST_USERS = 10;

// --- INITIALIZATION ---
if (!fs.existsSync(SOURCE_KEY_PATH)) {
    console.error(`❌ Source Key NOT FOUND at: ${SOURCE_KEY_PATH}`);
    process.exit(1);
}
if (!fs.existsSync(DEST_KEY_PATH)) {
    console.error(`❌ Destination Key NOT FOUND at: ${DEST_KEY_PATH}`);
    process.exit(1);
}

const sourceApp = admin.initializeApp({
    credential: admin.credential.cert(require(SOURCE_KEY_PATH)),
}, 'source');

const destApp = admin.initializeApp({
    credential: admin.credential.cert(require(DEST_KEY_PATH)),
}, 'dest');

const sourceAuth = sourceApp.auth();
const destAuth = destApp.auth();

async function testMigrate() {
    console.log('\n🧪 TEST MODE: Migrating first 10 REAL users\n');

    let count = 0;
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    let nextPageToken;

    do {
        const listUsersResult = await sourceAuth.listUsers(1000, nextPageToken);
        const users = listUsersResult.users;

        for (const user of users) {
            // Skip anonymous users
            if (!user.providerData || user.providerData.length === 0) {
                continue;
            }

            count++;

            // Only process first 10 real users in test mode
            if (count > MAX_TEST_USERS) {
                console.log(`\n✅ Reached ${MAX_TEST_USERS} users limit\n`);
                break;
            }

            try {
                const userData = {
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName,
                    photoURL: user.photoURL,
                    emailVerified: user.emailVerified,
                    disabled: user.disabled,
                    metadata: user.metadata,
                    providerData: user.providerData,
                };

                if (user.passwordHash && user.passwordSalt) {
                    userData.passwordHash = user.passwordHash;
                    userData.passwordSalt = user.passwordSalt;
                }

                console.log(`[${count}] Importing: ${user.email} (UID: ${user.uid.substring(0, 10)}...)`);

                await destAuth.importUsers([userData], { hash: HASH_CONFIG });

                imported++;
                console.log(`    ✅ SUCCESS`);

            } catch (error) {
                if (error.code === 'auth/uid-already-exists') {
                    skipped++;
                    console.log(`    ⚠️  SKIPPED (UID exists)`);
                } else {
                    errors++;
                    console.log(`    ❌ ERROR: ${error.message}`);
                }
            }
        }

        if (count >= MAX_TEST_USERS) break;
        nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS:');
    console.log('='.repeat(60));
    console.log(`Total Processed:  ${count}`);
    console.log(`✅ Imported:      ${imported}`);
    console.log(`⚠️  Skipped:       ${skipped}`);
    console.log(`❌ Errors:        ${errors}`);
    console.log('='.repeat(60) + '\n');

    process.exit(0);
}

testMigrate();
