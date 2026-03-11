import { scrapeMusicCharts, scrapeYouTubePlaylistSearch } from './src/utils/youtubeScraper';
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined;

if (!admin.apps.length) {
    console.log('Initializing Firebase Admin...');
    admin.initializeApp({
        credential: admin.credential.cert({
          projectId: projectId || '',
          clientEmail: clientEmail || '',
          privateKey: privateKey || '',
        }),
        databaseURL: `https://${projectId}.firebaseio.com`
    });
}
const db = admin.firestore();

const GENRES_TO_CACHE = [
    "ลูกทุ่ง", "ลูกกรุง", "เพื่อชีวิต", "คันทรี", "หมอลำ", "อีสาน", "ปักษ์ใต้", "ป็อป", "ป็อปร็อก", "ร็อกไทย", "อินดี้ไทย", "เพลงใหม่มาแรง"
];

async function runPOC() {
    console.log('🚀 [CRON POC] Starting Comprehensive Local Scraping to Database...');

    try {
        console.log('1. Fetching Top Artists...');
        const ytCharts = await scrapeMusicCharts('TH');
        
        console.log(`2. Fetching ${GENRES_TO_CACHE.length} Genres...`);
        const genreData: Record<string, any[]> = {};
        
        for (let i = 0; i < GENRES_TO_CACHE.length; i += 2) {
            const chunk = GENRES_TO_CACHE.slice(i, i + 2);
            const chunkResults = await Promise.allSettled(
                chunk.map(genre => scrapeYouTubePlaylistSearch(genre))
            );
            
            chunkResults.forEach((result, idx) => {
                const genreName = chunk[idx];
                if (result.status === 'fulfilled' && result.value.length > 0) {
                    genreData[genreName] = result.value.slice(0, 20);
                    console.log(`✅ Cached: ${genreName}`);
                }
            });
            await new Promise(r => setTimeout(r, 1000));
        }

        const youtubeCacheData = {
            topArtists: ytCharts.slice(0, 20),
            genres: genreData,
            updatedAt: new Date().toISOString()
        };

        console.log('Saving to Firestore...');
        await db.collection('music_cache').doc('youtube_home').set(youtubeCacheData, { merge: true });
        
        console.log('✅ SUCCESS! Database populated with all categories.');
        process.exit(0);
    } catch (e) {
        console.error('❌ Failed:', e);
        process.exit(1);
    }
}

runPOC();
