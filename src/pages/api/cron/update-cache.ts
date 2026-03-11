import { NextApiRequest, NextApiResponse } from 'next';
import { adminFirestore } from '../../../firebase-admin';
import { Innertube } from 'youtubei.js';

const CRON_SECRET = process.env.CRON_SECRET || 'dev_secret_key_for_local_testing';

// Comprehensive genres for a rich dashboard experience
const GENRES_TO_CACHE = [
    "ลูกทุ่ง", "ลูกกรุง", "เพื่อชีวิต", "คันทรี", "หมอลำ", "อีสาน", "ปักษ์ใต้",
    "ป็อป", "ป็อปร็อก", "ร็อกไทย", "อินดี้ไทย", "เพลงไทยใหม่ๆ", "T-Pop"
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
        console.log('🚀 [CRON] Starting InnerTube-powered Caching Job...');

        // 1. Initialize InnerTube
        const youtube = await Innertube.create();
        console.log('✅ InnerTube Connected.');

        // 2. Fetch Top Charts (Artists)
        console.log('Fetching Music Charts...');
        let topArtists: any[] = [];
        try {
            // InnerTube often provides charts via browse or specifically music.getExplore
            const explore = await youtube.music.getExplore();
            // We search for a shelf that might look like Top Artists
            const chartsShelf = explore.sections.find(s => s.title?.toString()?.includes('Artist') || s.title?.toString()?.includes('ศิลปิน'));
            if (chartsShelf && chartsShelf.contents) {
                topArtists = chartsShelf.contents.map(a => ({
                    name: a.title?.toString() || 'Unknown',
                    imageUrl: (a as any).thumbnails?.[0]?.url || ''
                })).slice(0, 20);
            }
        } catch (e) {
            console.warn('⚠️ Error fetching charts via Explore, continuing with empty charts:', (e as Error).message);
        }

        // 3. Fetch Genre Playlists using Search (highly reliable)
        console.log(`Fetching ${GENRES_TO_CACHE.length} Genres...`);
        const genreData: Record<string, any[]> = {};

        for (const genre of GENRES_TO_CACHE) {
            try {
                process.stdout.write(`🔍 [InnerTube] Scraping: ${genre}... `);
                const search = await youtube.music.search(genre, { type: 'playlist' });
                
                if (search.playlists && search.playlists.contents.length > 0) {
                    genreData[genre] = search.playlists.contents.map(p => ({
                        playlistId: p.id,
                        title: p.title?.toString() || 'Unknown',
                        thumbnail: (p as any).thumbnails?.[0]?.url || '',
                        author: p.author?.name || 'YouTube Music',
                        // Map to our existing Dashboard structure if needed
                        videoCount: '20+' 
                    })).slice(0, 20);
                    console.log(`✅ ${genreData[genre].length} items.`);
                } else {
                    console.log(`⚠️ No playlists found.`);
                }
            } catch (e) {
                console.error(`❌ Failed: ${genre}`, (e as Error).message);
            }
            // Polite delay
            await new Promise(r => setTimeout(r, 1000));
        }

        const youtubeCacheData = {
            topArtists: topArtists,
            genres: genreData,
            updatedAt: new Date().toISOString(),
            source: 'InnerTube-Pattern-V2'
        };

        // 4. Update Firestore
        const ytDocRef = adminFirestore.collection('music_cache').doc('youtube_home');
        await ytDocRef.set(youtubeCacheData, { merge: true });
        
        console.log('🎉 [CRON] Global InnerTube Caching Job Complete.');

        res.status(200).json({
            success: true,
            message: 'Music cache updated with high-quality InnerTube data',
            stats: {
                artists: topArtists.length,
                genres_count: Object.keys(genreData).length,
                genres_cached: Object.keys(genreData)
            }
        });

    } catch (error: any) {
        console.error('❌ [CRON] InnerTube Job Failed:', error);
        res.status(500).json({ success: false, error: error.message || 'Unknown error occurred' });
    }
}
