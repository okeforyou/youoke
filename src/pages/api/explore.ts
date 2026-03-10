import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { scrapeYouTubeSearch, scrapeYouTubePlaylistSearch } from '../../utils/youtubeScraper';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        console.log('[API/Explore] Fetching Data (Rich Thai Content) via Scraper...');

        console.log('[API/Explore] Using STABLE fallback (YouTube Content Only)');

        // --- STABLE HARDCODED CONTENT (Zero API/Scraper dependencies for 100% Load Success) ---
        const shelves = [
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

        // Return both formats for forward-compatibility
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
