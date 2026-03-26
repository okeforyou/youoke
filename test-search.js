const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccountOptions = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'playokeforyou',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-v4p20@playokeforyou.iam.gserviceaccount.com',
  privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};

if (!admin.apps.length) {
  // we will try to read from .env.local if not loaded
  require('dotenv').config({ path: '/Users/boonyanone/Documents/GitHub/play.okeforyou.com/.env.local' });
  
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    console.error("Missing FIREBASE_SERVICE_ACCOUNT_KEY");
    process.exit(1);
  }
  
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function main() {
  const querySnapshot = await db.collection("users").where("email", "==", "setokimkiu32@gmail.com").get();
  if (querySnapshot.empty) {
    console.log("No matching documents.");
    
    // Check if it exists with other cases
    const allQuery = await db.collection("users").limit(5).get();
    console.log("Some users:");
    allQuery.forEach(doc => {
        console.log(doc.id, "=>", doc.data().email);
    });
  } else {
    querySnapshot.forEach(doc => {
      console.log(doc.id, "=>", doc.data());
    });
  }
}

main().catch(console.error);
