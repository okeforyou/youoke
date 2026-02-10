const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// --- CONFIGURATION ---
// 1. Source (Production) Key - CHANGE THIS PATH IF NEEDED
const SOURCE_KEY_PATH = '/Users/boonyanone/Downloads/playokeforyou-firebase-adminsdk-6dzxn-984dbe3f20.json';

// 2. Destination (Development) Key
const DEST_KEY_PATH = path.join(__dirname, '../serviceAccountKey.json');

// 3. Password Hash Parameters (From Production Firebase Console)
// Retrieved from: Firebase Console > Authentication > Users > Password hash parameters
const HASH_CONFIG = {
    algorithm: 'SCRYPT',
    rounds: 8,
    memoryCost: 14,
    saltSeparator: Buffer.from('Sw==', 'base64'),
    signerKey: Buffer.from('tXvqsU2NnZt+5voL/N2+XxGdu/oCtdCpr+H2gLzJ1X0u1LdBLj1KM5Gs7N09++AXGgsl+MRy9hwxMxktEGXE+Qcwvm==', 'base64'),
};

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
const sourceDb = sourceApp.firestore();
const destAuth = destApp.auth();
const destDb = destApp.firestore();

// --- MIGRATION FUNCTIONS ---

async function migrateAuthUsers() {
    console.log('\n🚀 Starting AUTH Migration...');
    let nextPageToken;
    let count = 0;

    do {
        const listUsersResult = await sourceAuth.listUsers(1000, nextPageToken);
        const users = listUsersResult.users;

        for (const user of users) {
            try {
                // Skip anonymous users (no authentication providers)
                if (!user.providerData || user.providerData.length === 0) {
                    process.stdout.write('a'); // Mark as anonymous (skipped)
                    continue;
                }

                // Prepare user data for import (REAL USERS ONLY)
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

                // Handle Password Users - Now WITH password hash support
                if (user.passwordHash && user.passwordSalt) {
                    userData.passwordHash = Buffer.from(user.passwordHash, 'base64');
                    userData.passwordSalt = Buffer.from(user.passwordSalt, 'base64');
                    console.log(`🔐 Importing ${user.email} WITH password hash`);
                }

                // Import to Dest with hash config for password preservation
                await destAuth.importUsers([userData], {
                    hash: HASH_CONFIG
                });
                process.stdout.write('.');
                count++;
            } catch (error) {
                if (error.code === 'auth/uid-already-exists') {
                    // process.stdout.write('S'); // Skip
                } else {
                    console.error(`\n❌ Error importing ${user.email}:`, error.message);
                }
            }
        }
        nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    console.log(`\n✅ Auth Migration Complete! (${count} REAL users imported)`);
}

async function migrateFirestoreUsers() {
    console.log('\n🚀 Starting FIRESTORE "users" Migration...');
    const snapshot = await sourceDb.collection('users').get();

    if (snapshot.empty) {
        console.log('⚠️ No users found in Source Firestore.');
        return;
    }

    const batchSize = 500;
    let batch = destDb.batch();
    let count = 0;
    let total = 0;

    for (const doc of snapshot.docs) {
        const data = doc.data();
        const ref = destDb.collection('users').doc(doc.id);

        batch.set(ref, data, { merge: true });
        count++;
        total++;

        if (count >= batchSize) {
            await batch.commit();
            process.stdout.write(`[${total}] `);
            batch = destDb.batch();
            count = 0;
        }
    }

    if (count > 0) {
        await batch.commit();
        process.stdout.write(`[${total}] `);
    }

    console.log(`\n✅ Firestore Migration Complete! (${total} documents copied)`);
}

// --- MAIN ---

async function main() {
    try {
        await migrateAuthUsers();
        await migrateFirestoreUsers();
        console.log('\n🎉 ALL DONE! You can now login to playokeforyou-dev.');
        console.log('⚠️ NOTE: Email/Password users might need to reset password if hash config differs.');
    } catch (error) {
        console.error('\n❌ Fatal Error:', error);
    } finally {
        // Exit to kill connections
        process.exit(0);
    }
}

main();
