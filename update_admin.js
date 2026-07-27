const admin = require('firebase-admin');

let serviceAccount;
try {
    serviceAccount = require('./serviceAccountKey.json');
} catch(e) {
    console.error("Could not load serviceAccountKey.json");
    process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function updateAdmin() {
    try {
        const uid = 'zcGxRw05hRhJeq4aa6iz4XDoRkQ2'; // youoke.okeforyou@gmail.com
        
        await db.collection('users').doc(uid).set({
            role: 'owner',
            membership: {
                type: 'lifetime',
                status: 'active'
            },
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        
        console.log(`Updated user ${uid} to OWNER and LIFETIME successfully.`);
    } catch(err) {
        console.error("Error updating user:", err);
    }
}

updateAdmin();
