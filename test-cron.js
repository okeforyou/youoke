const { scrapeMusicCharts, scrapeYouTubePlaylistSearch } = require('./src/utils/youtubeScraper');
const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

// Ensure we have minimal credentials to talk to Firebase Admin
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined;

if (!admin.apps.length) {
    console.log('Initializing Firebase Admin...');
    admin.initializeApp({
        credential: admin.credential.cert({
          projectId: projectId,
          clientEmail: clientEmail,
          privateKey: privateKey,
        }),
        databaseURL: `https://${projectId}.firebaseio.com`
    });
}
const db = admin.firestore();

async function runPOC() {
    console.log('🚀 [CRON POC] Starting Local Scraping to Database...');

    try {
        console.log('Fetching YouTube Data...');
        const ytResults = await Promise.allSettled([
            scrapeMusicCharts('TH'),
            scrapeYouTubePlaylistSearch('ลูกทุ่งฮิต'),
            scrapeYouTubePlaylistSearch('เพลงไทย 2024')
        ]);

        const ytTopArtists = ytResults[0].status === 'fulfilled' ? ytResults[0].value : [];
        const ytLukTung = ytResults[1].status === 'fulfilled' ? ytResults[1].value : [];
        const ytThaiPop = ytResults[2].status === 'fulfilled' ? ytResults[2].value : [];

        console.log(`Found: ${ytTopArtists.length} Artists, ${ytLukTung.length} LukTung, ${ytThaiPop.length} ThaiPop`);

        const youtubeCacheData = {
            topArtists: ytTopArtists.slice(0, 15),
            genres: {
                'ลูกทุ่งฮิต': ytLukTung.slice(0, 15),
                'เพลงไทย 2024': ytThaiPop.slice(0, 15)
            },
            updatedAt: new Date().toISOString()
        };

        console.log('Saving to Firestore...');
        const docRef = db.collection('music_cache').doc('youtube_home');
        await docRef.set(youtubeCacheData, { merge: true });
        
        console.log('✅ SUCCESS! Check your Firestore Database -> music_cache -> youtube_home');
        process.exit(0);
    } catch (e) {
        console.error('❌ Failed:', e);
        process.exit(1);
    }
}

runPOC();
