import { NextApiRequest, NextApiResponse } from 'next';
import { scrapeYouTubeSearch, scrapeYouTubePlaylistSearch } from '../../utils/youtubeScraper';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        console.log('[API/Explore] Fetching Data (Rich Thai Content) via Scraper...');

        // CATEGORY CONFIGURATION (Thai Content Focus)
        const VIDEO_CATEGORIES = [
            { query: 'เพลงไทยฮิตล่าสุด', title: '🔥 เพลงไทยมาแรง 2025' },
            { query: 'ลูกทุ่งฮิต 100 ล้านวิว', title: '🌾 ลูกทุ่งยอดนิยม' },
            { query: 'T-Pop Hits', title: '🎤 T-Pop ฮิตติดชาร์ต' },
            { query: 'เพลงร็อคไทยฮิต', title: '🎸 ร็อคไทยหัวใจสิงห์' },
            { query: 'เพลงเพื่อชีวิตฮิต', title: '🐃 เพื่อชีวิตตำนาน' },
            { query: 'เพลงแดนซ์สายย่อ', title: '🕺 แดนซ์สายย่อ' }
        ];

        const PLAYLIST_CATEGORIES = [
            { query: 'รวมเพลงไทยฮิต 2025', title: '📂 เพลย์ลิสต์แนะนำ' },
            { query: 'เพลงเก่าที่คิดถึง 90s', title: '📼 ย้อนวันวาน 90s' },
            { query: 'เพลงเศร้าอกหัก 2025', title: '💔 เพลงเศร้าเหงาจับใจ' }
        ];

        console.log(`[API/Explore] Fetching ${VIDEO_CATEGORIES.length} Video & ${PLAYLIST_CATEGORIES.length} Playlist Categories...`);

        // Parallel Fetch
        const [videoResults, playlistResults] = await Promise.all([
            Promise.all(VIDEO_CATEGORIES.map(cat =>
                scrapeYouTubeSearch(cat.query).catch(() => [])
            )),
            Promise.all(PLAYLIST_CATEGORIES.map(cat =>
                scrapeYouTubePlaylistSearch(cat.query).catch(() => [])
            ))
        ]);

        // Helper to map video items
        const mapVideos = (items: any[]) => items.map((item: any) => ({
            title: item.title,
            subtitle: item.author || 'YouTube',
            thumbnail: item.videoThumbnails?.[0]?.url || item.videoThumbnails?.[1]?.url || '',
            id: item.videoId,
            type: 'video'
        }));

        // Helper to map playlist items
        const mapPlaylists = (items: any[]) => items.map((item: any) => ({
            title: item.title,
            subtitle: `${item.videoCount} · ${item.author}`,
            thumbnail: item.thumbnail,
            id: item.playlistId,
            type: 'playlist'
        }));

        // Construct Shelves (Mix Playlists and Videos)
        const shelves = [
            // Featured Playlists First
            ...PLAYLIST_CATEGORIES.map((cat, i) => ({
                title: cat.title,
                items: mapPlaylists(playlistResults[i] || []).slice(0, 15)
            })),
            // Then Video Shelves
            ...VIDEO_CATEGORIES.map((cat, i) => ({
                title: cat.title,
                items: mapVideos(videoResults[i] || []).slice(0, 15)
            }))
        ].filter(shelf => shelf.items.length > 0);

        res.status(200).json({
            status: 'success',
            data: shelves
        });

    } catch (error: any) {
        console.error('[API/Explore] CRITICAL ERROR:', error);
        res.status(200).json({
            status: 'error',
            message: error.message || 'Unknown Error',
            debug_info: error.toString() + (error.stack ? `\n${error.stack}` : '')
        });
    }
}
