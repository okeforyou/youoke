const admin = require('firebase-admin');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();

const DRY_RUN = process.argv.includes('--dry-run');
const daysArg = process.argv.find(arg => arg.startsWith('--days='));
const DAYS_THRESHOLD = daysArg ? parseInt(daysArg.split('=')[1]) : 30;

async function cleanupAnonymousUsers() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - DAYS_THRESHOLD);

    console.log(`\n🧹 Starting Anonymous Users Cleanup`);
    console.log(`📅 Cutoff Date: ${cutoffDate.toISOString()}`);
    console.log(`⏳ Threshold: ${DAYS_THRESHOLD} days`);
    if (DRY_RUN) console.log('⚠️  *** DRY RUN MODE: No changes will be applied ***\n');

    const userIdsToDelete = [];
    let anonymousCount = 0;
    let totalCount = 0;
    let nextPageToken;

    try {
        console.log('🔍 Scanning Authentication users...\n');

        do {
            const listUsersResult = await auth.listUsers(1000, nextPageToken);

            for (const user of listUsersResult.users) {
                totalCount++;

                // Check if user is anonymous (no providers)
                if (user.providerData.length === 0) {
                    anonymousCount++;
                    const createdAt = new Date(user.metadata.creationTime);

                    // Check if user is older than threshold
                    if (createdAt < cutoffDate) {
                        userIdsToDelete.push(user.uid);

                        if (userIdsToDelete.length <= 10) {
                            console.log(`${DRY_RUN ? '🔍 [DRY RUN]' : '🗑️  [DELETE]'} ${user.uid} (Created: ${createdAt.toISOString()})`);
                        }
                    }
                }
            }

            nextPageToken = listUsersResult.pageToken;
        } while (nextPageToken);

        console.log(`\n📊 Scan Complete:`);
        console.log(`   Total Users: ${totalCount}`);
        console.log(`   Anonymous Users: ${anonymousCount}`);
        console.log(`   Old Anonymous Users (>${DAYS_THRESHOLD} days): ${userIdsToDelete.length}`);
        console.log(`   Real Users: ${totalCount - anonymousCount}\n`);

        // Delete old anonymous users
        if (userIdsToDelete.length > 0) {
            if (DRY_RUN) {
                console.log(`\n📋 [DRY RUN] Would delete ${userIdsToDelete.length} anonymous users`);
                if (userIdsToDelete.length > 10) {
                    console.log(`   (showing first 10, ${userIdsToDelete.length - 10} more not shown)`);
                }
            } else {
                console.log(`\n🔐 Deleting ${userIdsToDelete.length} anonymous users from Auth...`);

                // Delete in chunks of 1000 (Firebase Auth limit)
                let totalDeleted = 0;
                for (let i = 0; i < userIdsToDelete.length; i += 1000) {
                    const chunk = userIdsToDelete.slice(i, i + 1000);
                    const deleteResult = await auth.deleteUsers(chunk);
                    totalDeleted += deleteResult.successCount;
                    console.log(`✅ Deleted ${deleteResult.successCount}/${chunk.length} users (batch ${Math.floor(i / 1000) + 1})`);

                    if (deleteResult.failureCount > 0) {
                        console.error(`❌ Failed to delete ${deleteResult.failureCount} users:`);
                        deleteResult.errors.forEach(err => console.error(`   - ${err.error.message}`));
                    }
                }
                console.log(`\n🎉 Total deleted: ${totalDeleted}`);
            }

            // Also cleanup Firestore records if they exist
            if (!DRY_RUN) {
                console.log(`\n🗄️  Cleaning up Firestore records...`);
                let firestoreDeleted = 0;

                for (let i = 0; i < userIdsToDelete.length; i += 500) {
                    const chunk = userIdsToDelete.slice(i, i + 500);
                    const batch = db.batch();

                    for (const uid of chunk) {
                        batch.delete(db.collection('users').doc(uid));
                    }

                    await batch.commit();
                    firestoreDeleted += chunk.length;
                }

                console.log(`✅ Cleaned ${firestoreDeleted} Firestore records`);
            }
        } else {
            console.log(`\n✅ No anonymous users found older than ${DAYS_THRESHOLD} days.`);
        }

        console.log('\n' + '='.repeat(60));
        console.log(`✅ Cleanup Complete!`);
        console.log(`📊 Users ${DRY_RUN ? 'identified for deletion' : 'deleted'}: ${userIdsToDelete.length}`);
        console.log(`📊 Remaining users: ${totalCount - (DRY_RUN ? 0 : userIdsToDelete.length)}`);
        console.log('='.repeat(60) + '\n');

    } catch (error) {
        console.error('\n❌ Error during cleanup:', error);
        throw error;
    } finally {
        process.exit(0);
    }
}

// Run cleanup
cleanupAnonymousUsers();
