
const admin = require('firebase-admin');
const { Innertube } = require('youtubei.js');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Setup Firebase Admin
function getAdminApp() {
    if (admin.apps.length > 0) return admin.apps[0];

    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || process.env.CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined;

    if (projectId && clientEmail && privateKey) {
        return admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey,
            }),
        });
    }
    
    // Try from service account key if available in env
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountKey) {
        try {
            const cert = JSON.parse(serviceAccountKey);
            return admin.initializeApp({
                credential: admin.credential.cert(cert),
            });
        } catch (e) {}
    }

    return null;
}

async function runUpdate() {
    console.log('🚀 Starting Manual Music Cache Update (Fully Standalone)...');

    const app = getAdminApp();
    if (!app) {
        console.error('❌ Firebase Admin setup failed. Missing env vars in .env.local');
        process.exit(1);
    }
    const db = admin.firestore();

    try {
        console.log('Connecting to InnerTube...');
        const youtube = await Innertube.create();
        console.log('✅ InnerTube Connected.');

        console.log('Fetching Music Charts (TH)...');
        let topArtists = [];
        try {
            const charts = await youtube.music.getCharts('TH');
            const artistsShelf = charts.sections.find(s => 
                s.title?.toString()?.toLowerCase().includes('artist') || 
                s.title?.toString()?.includes('ศิลปิน')
            );
            
            if (artistsShelf && artistsShelf.contents) {
                topArtists = artistsShelf.contents.map(a => ({
                    name: a.title?.toString() || 'Unknown',
                    imageUrl: a.thumbnails?.[0]?.url?.replace('w120-h120', 'w500-h500') || ''
                })).slice(0, 20);
                console.log(`✅ Found ${topArtists.length} artists from Charts.`);
            }
        } catch (e) {
            console.warn('⚠️ Error fetching charts, attempting Explore fallback:', e.message);
            const explore = await youtube.music.getExplore();
            const chartsShelf = explore.sections.find(s => s.title?.toString()?.includes('Artist') || s.title?.toString()?.includes('ศิลปิน'));
            if (chartsShelf && chartsShelf.contents) {
                topArtists = chartsShelf.contents.map(a => ({
                    name: a.title?.toString() || 'Unknown',
                    imageUrl: a.thumbnails?.[0]?.url || ''
                })).slice(0, 20);
            }
        }

        const GENRES_TO_CACHE = [
            "ลูกทุ่ง", "ลูกกรุง", "เพื่อชีวิต", "คันทรี", "หมอลำ", "อีสาน", "ปักษ์ใต้",
            "ป็อป", "ป็อปร็อก", "ร็อกไทย", "อินดี้ไทย", "รวมเพลงดังมาแรง", "T-Pop"
        ];
        
        const genreData = {};
        for (const genre of GENRES_TO_CACHE) {
            try {
                process.stdout.write(`🔍 [InnerTube] Scraping: ${genre}... `);
                const search = await youtube.music.search(genre, { type: 'playlist' });
                if (search.playlists && search.playlists.contents.length > 0) {
                    genreData[genre] = search.playlists.contents.map(p => ({
                        playlistId: p.id,
                        title: p.title?.toString() || 'Unknown',
                        thumbnail: p.thumbnails?.[0]?.url || '',
                        author: p.author?.name || 'YouTube Music',
                        videoCount: '20+' 
                    })).slice(0, 10);
                    console.log(`✅ OK.`);
                } else {
                    console.log(`⚠️ Skip.`);
                }
            } catch (e) {
                console.log(`❌ Fail.`);
            }
        }

        const youtubeCacheData = {
            topArtists: topArtists,
            genres: genreData,
            updatedAt: new Date().toISOString(),
            source: 'Manual-Trigger-Standalone'
        };

        console.log('Saving to Firestore (music_cache/youtube_home)...');
        await db.collection('music_cache').doc('youtube_home').set(youtubeCacheData, { merge: true });
        
        console.log('🎉 Update Complete!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Update Failed:', error);
        process.exit(1);
    }
}

runUpdate();
