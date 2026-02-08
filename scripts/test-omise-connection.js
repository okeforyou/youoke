require('dotenv').config({ path: '.env.local' });
const Omise = require('omise');

const pkey = process.env.OMISE_PUBLIC_KEY;
const skey = process.env.OMISE_SECRET_KEY;

if (!pkey || !skey) {
    console.error("❌ Missing OMISE keys in .env.local");
    console.error("Please add:");
    console.error('OMISE_PUBLIC_KEY="pkey_test_..."');
    console.error('OMISE_SECRET_KEY="skey_test_..."');
    process.exit(1);
}

const omise = Omise({
    publicKey: pkey,
    secretKey: skey,
});

async function testConnection() {
    console.log(`🔑 Testing Omise Connection...`);
    console.log(`   Public Key: ${pkey.substring(0, 10)}...`);

    try {
        const account = await new Promise((resolve, reject) => {
            omise.account.retrieve((err, resp) => {
                if (err) reject(err);
                else resolve(resp);
            });
        });

        console.log("\n✅ Connection Successful!");
        console.log(`   Account Email: ${account.email}`);
        console.log(`   Mode: ${account.livemode ? '🚨 LIVE (REAL MONEY)' : '🧪 TEST MODE'}`);
        console.log(`   Currency: ${account.currency}`);

    } catch (error) {
        console.error("\n❌ Connection Failed:", error.message);
    }
}

testConnection();
