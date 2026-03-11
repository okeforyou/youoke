import { Innertube, MusicUtils } from 'youtubei.js';
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import path from 'path';

// --- CONFIG ---
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function populateV2() {
    console.log("🚀 [Metrolist/InnerTune Technique] Starting Data Population V2...");

    // 1. Init Firebase
    const saKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!saKey) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY missing");
    
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(JSON.parse(saKey))
        });
    }
    const db = admin.firestore();

    // 2. Init InnerTube
    console.log("📡 Connecting to InnerTube API...");
    const youtube = await Innertube.create();
    console.log("✅ InnerTube Connected.");

    const GENRES = ["ลูกทุ่ง", "ลูกกรุง", "เพื่อชีวิต", "หมอลำ", "อีสาน", "ปักษ์ใต้", "T-Pop", "เพลงไทยใหม่ๆ", "ร็อกไทย", "อินดี้ไทย"];
    const genreData = {};

    // 3. Fetching Home/Explore Sections (Like Metrolist)
    console.log("📥 Fetching Global Explore Data...");
    try {
        const explore = await youtube.music.getExplore();
        // InnerTube Explore often has 'New Releases' etc.
        // We'll store some of these as 'trending'
        genreData["มาแรง"] = explore.sections[0]?.contents?.map(i => ({
            id: i.id,
            title: i.title?.toString(),
            thumbnail: i.thumbnails?.[0]?.url,
            author: i.author?.name || "YouTube Music"
        })).slice(0, 15) || [];
    } catch (e) {
        console.warn("⚠️ Could not fetch auto-explore sections, skipping...");
    }

    // 4. Fetching Specific Genres
    for (const genre of GENRES) {
        console.log(`🔍 Fetching Genre: ${genre}...`);
        try {
            const search = await youtube.music.search(genre, { type: 'playlist' });
            if (search.playlists && search.playlists.contents.length > 0) {
                genreData[genre] = search.playlists.contents.map(p => ({
                    id: p.id,
                    title: p.title?.toString(),
                    thumbnail: p.thumbnails?.[0]?.url,
                    author: p.author?.name || "YouTube Music"
                })).slice(0, 20);
                console.log(`   ✅ Success: ${genreData[genre].length} playlists.`);
            } else {
                console.log(`   ⚠️ No playlists found for ${genre}.`);
            }
        } catch (e) {
            console.error(`   ❌ Failed to fetch ${genre}:`, e.message);
        }
        // Small delay to be polite
        await new Promise(r => setTimeout(r, 1000));
    }

    // 5. Save to Firestore
    const finalData = {
        genres: genreData,
        updatedAt: new Date().toISOString(),
        source: "InnerTube-v16"
    };

    console.log("💾 Saving to Firestore (music_cache/home_v2)...");
    await db.collection('music_cache').doc('home_v2').set(finalData, { merge: true });
    
    console.log("🎉 ALL DONE! Your database is now populated with InnerTube high-quality data.");
    process.exit(0);
}

populateV2().catch(err => {
    console.error("❌ Fatal Error:", err);
    process.exit(1);
});
