const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

// --- MOCK SCRAPER LOGIC (PORTED TO JS) ---
async function scrapeYouTubePlaylistSearch(query) {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAw%3D%3D`;
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7'
            }
        });
        const html = await response.text();
        const match = html.match(/var ytInitialData = ({[\s\S]+?});/);
        if (!match) return [];
        const data = JSON.parse(match[1]);
        
        // Find playlist renderers
        const results = [];
        const findPlaylists = (obj) => {
            if (!obj || typeof obj !== 'object') return;
            if (obj.playlistRenderer || obj.gridPlaylistRenderer) {
                const r = obj.playlistRenderer || obj.gridPlaylistRenderer;
                results.push({
                    playlistId: r.playlistId,
                    title: r.title?.simpleText || r.title?.runs?.[0]?.text || "Unknown",
                    thumbnail: (r.thumbnail?.thumbnails || r.thumbnails?.[0]?.thumbnails || [])[0]?.url || "",
                    author: r.shortBylineText?.runs?.[0]?.text || "YouTube"
                });
            }
            for (const key in obj) findPlaylists(obj[key]);
        };
        findPlaylists(data);
        return results;
    } catch (e) {
        console.error(`Error scraping ${query}:`, e.message);
        return [];
    }
}

async function scrapeMusicCharts() {
    const url = `https://music.youtube.com/charts?c=TH`;
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7'
            }
        });
        const html = await response.text();
        const match = html.match(/var ytInitialData = ({[\s\S]+?});/);
        if (!match) return [];
        const data = JSON.parse(match[1]);
        
        const results = [];
        const findArtists = (obj) => {
            if (!obj || typeof obj !== 'object') return;
            if (obj.musicResponsiveListItemRenderer) {
                const mrl = obj.musicResponsiveListItemRenderer;
                const title = mrl.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text;
                const thumb = (mrl.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [])[0]?.url;
                if (title && (mrl.navigationEndpoint?.browseEndpoint?.browseId || "").startsWith('UC')) {
                    results.push({ name: title, imageUrl: thumb });
                }
            }
            if (Array.isArray(obj)) obj.forEach(findArtists);
            else Object.values(obj).forEach(findArtists);
        };
        findArtists(data);
        return results;
    } catch (e) {
        console.error(`Error scraping charts:`, e.message);
        return [];
    }
}

// --- MAIN POPULATOR ---
const GENRES = ["ลูกทุ่ง", "ลูกกรุง", "เพื่อชีวิต", "คันทรี", "หมอลำ", "อีสาน", "ปักษ์ใต้", "ป็อป", "ป็อปร็อก", "ร็อกไทย", "อินดี้ไทย"];

async function run() {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined;

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert({ projectId, clientEmail, privateKey })
        });
    }
    const db = admin.firestore();

    console.log("🚀 Starting Global Scrape...");
    const topArtists = await scrapeMusicCharts();
    const genreData = {};

    for (const genre of GENRES) {
        console.log(`Scraping genre: ${genre}...`);
        const playlists = await scrapeYouTubePlaylistSearch(genre);
        if (playlists.length > 0) {
            genreData[genre] = playlists.slice(0, 15);
            console.log(`✅ ${genre}: ${playlists.length} playlists found.`);
        }
        await new Promise(r => setTimeout(r, 1000));
    }

    const youtubeCacheData = {
        topArtists: topArtists.slice(0, 20),
        genres: genreData,
        updatedAt: new Date().toISOString()
    };

    console.log("Saving to Firestore...");
    await db.collection('music_cache').doc('youtube_home').set(youtubeCacheData, { merge: true });
    console.log("✅ Done!");
}

run();
