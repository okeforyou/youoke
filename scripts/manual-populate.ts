import * as admin from 'firebase-admin';
import { scrapeMusicCharts, scrapeYouTubePlaylistSearch } from '../src/utils/youtubeScraper';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.join(__dirname, '../.env.local') });

async function populate() {
    console.log("🚀 Manual Data Population Started...");

    // 1. Get Credentials from JSON in env
    const saString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!saString) {
        console.error("❌ FIREBASE_SERVICE_ACCOUNT_KEY not found in .env.local");
        process.exit(1);
    }

    let serviceAccount;
    try {
        serviceAccount = JSON.parse(saString);
    } catch (e) {
        console.error("❌ Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON");
        process.exit(1);
    }

    // 2. Init Admin
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    }
    const db = admin.firestore();

    // 3. Scrape
    const GENRES = ["ลูกทุ่ง", "ลูกกรุง", "เพื่อชีวิต", "คันทรี", "หมอลำ", "อีสาน", "ปักษ์ใต้", "ป็อป", "ป็อปร็อก", "ร็อกไทย", "อินดี้ไทย", "รวมเพลงดังมาแรง"];
    
    console.log("Fetching Charts...");
    const charts = await scrapeMusicCharts('TH');
    console.log(`✅ Got ${charts.length} Top Artists`);

    const genreData: Record<string, any[]> = {};
    for (const genre of GENRES) {
        console.log(`Scraping Genre: ${genre}...`);
        try {
            const results = await scrapeYouTubePlaylistSearch(genre);
            if (results && results.length > 0) {
                genreData[genre] = results.slice(0, 20);
                console.log(`   ✅ ${results.length} items found.`);
            } else {
                console.warn(`   ⚠️ No results for ${genre}`);
            }
        } catch (e) {
            console.error(`   ❌ Failed to scrape ${genre}`);
        }
        // Small delay
        await new Promise(r => setTimeout(r, 1500));
    }

    const youtubeCacheData = {
        topArtists: charts.slice(0, 20),
        genres: genreData,
        updatedAt: new Date().toISOString()
    };

    // 4. Update Firestore
    console.log("Saving to Firestore (music_cache/youtube_home)...");
    await db.collection('music_cache').doc('youtube_home').set(youtubeCacheData, { merge: true });

    console.log("🎉 SUCCESS! Dashboard data is now 100% updated.");
    process.exit(0);
}

populate().catch(err => {
    console.error("❌ Fatal Error:", err);
    process.exit(1);
});
