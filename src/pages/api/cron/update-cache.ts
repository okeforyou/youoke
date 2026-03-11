import { NextApiRequest, NextApiResponse } from 'next';
import { adminFirestore } from '../../../firebase-admin';
import { scrapeMusicExplore, scrapeMusicCharts, scrapeYouTubePlaylistSearch } from '../../../utils/youtubeScraper';

const CRON_SECRET = process.env.CRON_SECRET || 'dev_secret_key_for_local_testing';

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
        console.log('🚀 [CRON] Starting Database Caching Job...');

        console.log('Fetching YouTube Data...');
        const ytResults = await Promise.allSettled([
            scrapeMusicCharts('TH'),
            scrapeYouTubePlaylistSearch('ลูกทุ่งฮิต'),
            scrapeYouTubePlaylistSearch('เพลงไทย 2024')
        ]);

        const ytTopArtists = ytResults[0].status === 'fulfilled' ? ytResults[0].value : [];
        const ytLukTung = ytResults[1].status === 'fulfilled' ? ytResults[1].value : [];
        const ytThaiPop = ytResults[2].status === 'fulfilled' ? ytResults[2].value : [];

        const youtubeCacheData = {
            topArtists: ytTopArtists.slice(0, 15),
            genres: {
                'ลูกทุ่งฮิต': ytLukTung.slice(0, 15),
                'เพลงไทย 2024': ytThaiPop.slice(0, 15)
            },
            updatedAt: new Date().toISOString()
        };

        const ytDocRef = adminFirestore.collection('music_cache').doc('youtube_home');
        await ytDocRef.set(youtubeCacheData, { merge: true });
        console.log('✅ YouTube data cached successfully.');

        res.status(200).json({
            success: true,
            message: 'Music cache updated successfully',
            timestamp: new Date().toISOString(),
            youtube_stats: {
                artists: youtubeCacheData.topArtists.length,
                lukTung: youtubeCacheData.genres['ลูกทุ่งฮิต'].length
            }
        });

    } catch (error: any) {
        console.error('❌ [CRON] Failed to update cache:', error);
        res.status(500).json({ success: false, error: error.message || 'Unknown error occurred' });
    }
}
