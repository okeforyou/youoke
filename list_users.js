const admin = require('firebase-admin');
const fs = require('fs');

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

async function fixAdmin() {
    try {
        const usersRef = db.collection('users');
        const snapshot = await usersRef.get();
        console.log(`Found ${snapshot.size} users. Identifying...`);

        for (const doc of snapshot.docs) {
            const data = doc.data();
            console.log(`- ${data.email} | Role: ${data.role} | Type: ${data.membership?.type} | Status: ${data.membership?.status} | UID: ${doc.id}`);
            
            // Auto fix empty roles or specific emails if needed
            // if (data.email === 'user@example.com') { ... }
        }
    } catch(err) {
        console.error("Error reading users:", err);
    }
}

fixAdmin();
