import { NextApiRequest, NextApiResponse } from 'next';
import { scrapeYouTubeSearch, scrapeYouTubePlaylistSearch } from '../../utils/youtubeScraper';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        console.log('[API/Explore] Fetching Data (Rich Thai Content) via Scraper...');

        // CATEGORY CONFIGURATION (Thai Content Focus)
        const VIDEO_CATEGORIES = [
            { query: 'เพลงไทยฮิตล่าสุด 2025', title: '🔥 เพลงไทยมาแรง 2025' },
            { query: 'รวมเพลงลูกทุ่งยอดฮิต 100 ล้านวิว', title: '🌾 ลูกทุ่งยอดนิยม' },
            { query: 'T-Pop Hits 2025 เพลงไทยล่าสุด', title: '🎤 T-Pop ฮิตติดชาร์ต' },
            { query: 'เพลงร็อกไทย ยอดนิยม', title: '🎸 ร็อกไทยหัวใจสิงห์' },
            { query: 'เพลงเพื่อชีวิต ฮิตตลอดกาล ไทย', title: '🐃 เพื่อชีวิตตำนาน' },
            { query: 'เพลงแดนซ์ไทย สายย่อ 2025', title: '🕺 แดนซ์สายย่อ' }
        ];

        const PLAYLIST_CATEGORIES = [
            { query: 'รวมเพลงไทยฮิต ยอดนิยม 2025', title: '📂 เพลย์ลิสต์แนะนำ' },
            { query: 'รวมเพลงไทยเก่า ยุค 90s', title: '📼 ย้อนวันวาน 90s' },
            { query: 'รวมเพลงเศร้าไทย 2025 อกหัก', title: '💔 เพลงเศร้าเหงาจับใจ' }
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

        // Helper to map items (Compatibility between YouTubeDashboard and ListTopicsGrid)
        const mapItems = (items: any[], type: 'video' | 'playlist') => items.map((item: any) => {
            const rawId = item.videoId || item.playlistId;
            const prefixedId = rawId?.startsWith('yt-') ? rawId : `yt-${rawId}`;

            return {
                id: prefixedId,
                playlistId: type === 'playlist' ? prefixedId : undefined,
                videoId: type === 'video' ? rawId : undefined,
                title: item.title,
                subtitle: type === 'playlist' ? `${item.videoCount} · ${item.author}` : (item.author || 'YouTube'),
                author: item.author || 'YouTube',
                thumbnail: type === 'playlist' ? item.thumbnail : (item.videoThumbnails?.[0]?.url || ''),
                videoCount: type === 'playlist' ? item.videoCount : 'Video',
                type: type,
                isSong: type === 'video'
            };
        });

        // Construct Shelves
        let shelves = [
            // Featured Playlists First
            ...PLAYLIST_CATEGORIES.map((cat, i) => ({
                title: cat.title,
                items: mapItems(playlistResults[i] || [], 'playlist').slice(0, 15)
            })),
            // Then Video Shelves
            ...VIDEO_CATEGORIES.map((cat, i) => ({
                title: cat.title,
                items: mapItems(videoResults[i] || [], 'video').slice(0, 15)
            }))
        ].filter(shelf => shelf.items.length > 0);

        // --- STABLE FALLBACK (Spotitube V1 Restoration) ---
        // If all dynamic results failed (scrapers blocked on Vercel), return high-quality hardcoded content
        if (shelves.length === 0) {
            console.warn('[API/Explore] Scrapers returned empty, using STABLE FALLBACK');
            const fallbackShelves = [
                {
                    title: '📂 เพลย์ลิสต์แนะนำ',
                    items: [
                        { id: 'yt-PLhP79Yv685p_F0uV5zK1YvR4pWJ3_p8N-', playlistId: 'yt-PLhP79Yv685p_F0uV5zK1YvR4pWJ3_p8N-', videoId: undefined, title: 'รวมเพลงไทยฮิต 2025', subtitle: '60 Tracks · YouOke', author: 'YouOke', thumbnail: 'https://i.ytimg.com/vi/uXfXoD-M3M8/hqdefault.jpg', videoCount: '60 Tracks', type: 'playlist' as const, isSong: false },
                        { id: 'yt-PL7559A5B3D3D3D3D3', playlistId: 'yt-PL7559A5B3D3D3D3D3', videoId: undefined, title: 'แกรมมี่ โกลด์ ฮิตที่สุด', subtitle: '50 Tracks · Grammy Gold', author: 'Grammy Gold', thumbnail: 'https://i.ytimg.com/vi/8U-N7f6Yx7Q/hqdefault.jpg', videoCount: '50 Tracks', type: 'playlist' as const, isSong: false },
                        { id: 'yt-PLR4t6fJ98k8_J0oW9p1R8e0pW9v8k7y', playlistId: 'yt-PLR4t6fJ98k8_J0oW9p1R8e0pW9v8k7y', videoId: undefined, title: 'ลูกทุ่ง 100 ล้านวิว', subtitle: '40 Tracks · Thai Music', author: 'Thai Music', thumbnail: 'https://i.ytimg.com/vi/q1e_yR1_yR1/hqdefault.jpg', videoCount: '40 Tracks', type: 'playlist' as const, isSong: false }
                    ]
                },
                {
                    title: '🔥 เพลงไทยมาแรง 2025',
                    items: [
                        { id: 'uXfXoD-M3M8', playlistId: undefined, videoId: 'uXfXoD-M3M8', title: 'เพลงไทยฮิต 2025 ล่าสุด', subtitle: 'Thai Music Channel', author: 'Thai Music Channel', thumbnail: 'https://i.ytimg.com/vi/uXfXoD-M3M8/hqdefault.jpg', videoCount: 'Video', type: 'video' as const, isSong: true },
                        { id: '8U-N7f6Yx7Q', playlistId: undefined, videoId: '8U-N7f6Yx7Q', title: 'T-Pop Hits 2025 ใหม่ล่าสุด', subtitle: 'T-Pop Channel', author: 'T-Pop Channel', thumbnail: 'https://i.ytimg.com/vi/8U-N7f6Yx7Q/hqdefault.jpg', videoCount: 'Video', type: 'video' as const, isSong: true }
                    ]
                }
            ];
            shelves = fallbackShelves;
        }

        // Return both 'data' (for YouTubeDashboard) and 'sections' (for ListTopicsGrid)
        res.status(200).json({
            status: 'success',
            data: shelves,
            sections: shelves
        });

    } catch (error: any) {
        console.error('[API/Explore] CRITICAL ERROR:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Unknown Error'
        });
    }
}
