import { NextApiRequest, NextApiResponse } from 'next';
import { adminFirestore } from '../../../firebase-admin';
import { scrapeMusicCharts, scrapeYouTubePlaylistSearch } from '../../../utils/youtubeScraper';

const CRON_SECRET = process.env.CRON_SECRET || 'dev_secret_key_for_local_testing';

// The genres we want to pre-cache for the SpotifyDashboard
const GENRES_TO_CACHE = [
    "ลูกทุ่ง",
    "ลูกกรุง",
    "เพื่อชีวิต",
    "คันทรี",
    "หมอลำ",
    "อีสาน",
    "ปักษ์ใต้",
    "ป็อป",
    "ป็อปร็อก",
    "ร็อกไทย",
    "อินดี้ไทย",
    "เพลงใหม่มาแรง"
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${CRON_SECRET}` && req.query.key !== CRON_SECRET) {
        console.warn('Unauthorized attempt to trigger cron job');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!adminFirestore) {
        return res.status(500).json({ error: 'Firebase Admin not initialized properly' });
    }

    try {
        console.log('🚀 [CRON] Starting Extended Database Caching Job...');

        // 1. Fetch Top Artists
        console.log('Fetching Top Artists...');
        const ytCharts = await scrapeMusicCharts('TH');
        
        // 2. Fetch Genres in Parallel (with batching to avoid hitting limits too hard)
        console.log(`Fetching ${GENRES_TO_CACHE.length} Genres...`);
        
        const genreData: Record<string, any[]> = {};
        
        // Split into chunks of 3 to be relatively gentle
        for (let i = 0; i < GENRES_TO_CACHE.length; i += 3) {
            const chunk = GENRES_TO_CACHE.slice(i, i + 3);
            const chunkResults = await Promise.allSettled(
                chunk.map(genre => scrapeYouTubePlaylistSearch(genre))
            );
            
            chunkResults.forEach((result, idx) => {
                const genreName = chunk[idx];
                if (result.status === 'fulfilled' && result.value.length > 0) {
                    genreData[genreName] = result.value.slice(0, 20);
                    console.log(`✅ Cached genre: ${genreName} (${result.value.length} items)`);
                } else if (result.status === 'rejected') {
                    console.error(`❌ Failed genre: ${genreName}`, result.reason);
                }
            });
            
            // Short delay between chunks
            if (i + 3 < GENRES_TO_CACHE.length) await new Promise(r => setTimeout(r, 1000));
        }

        const youtubeCacheData = {
            topArtists: ytCharts.slice(0, 20),
            genres: genreData,
            updatedAt: new Date().toISOString()
        };

        const ytDocRef = adminFirestore.collection('music_cache').doc('youtube_home');
        await ytDocRef.set(youtubeCacheData, { merge: true });
        
        console.log('✅ Global Caching Job Complete.');

        res.status(200).json({
            success: true,
            message: 'Music cache updated with all categories',
            stats: {
                artists: youtubeCacheData.topArtists.length,
                genres_count: Object.keys(genreData).length,
                genres_cached: Object.keys(genreData)
            }
        });

    } catch (error: any) {
        console.error('❌ [CRON] Global Job Failed:', error);
        res.status(500).json({ success: false, error: error.message || 'Unknown error occurred' });
    }
}
