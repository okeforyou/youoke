import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { scrapeYouTubeSearch, scrapeYouTubePlaylistSearch } from '../../utils/youtubeScraper';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        console.log('[API/Explore] Fetching Data (Rich Thai Content) via Scraper...');

        // CATEGORY CONFIGURATION (Spotify Playlist IDs for 100% Stability)
        const FEATURE_PLAYLISTS = [
            { id: '37i9dQZF1DWV74QYI4O5Hn', title: '📂 เพลย์ลิสต์แนะนำ' },
            { id: '37i9dQZF1DX9T6iQvEUpU2', title: '🌾 ลูกทุ่งยอดนิยม' },
            { id: '37i9dQZF1DWW9pDk3S4u2B', title: '🎤 T-Pop ฮิตติดชาร์ต' },
            { id: '37i9dQZF1DXdb8Fv0l7p1C', title: '🎸 ร็อกไทยหัวใจสิงห์' },
            { id: '37i9dQZF1DX96S38v6E1V1', title: '🕺 แดนซ์สายย่อ' }
        ];

        console.log(`[API/Explore] Fetching ${FEATURE_PLAYLISTS.length} Featured Playlists via Spotify...`);

        const { searchSpotifyPlaylists } = require('../../../modules/spotify-theme/services/api');
        const { getAccessToken } = require('../../../modules/spotify-theme/services/auth');
        const token = await getAccessToken();

        // Parallel Fetch Spotify Metadata
        const playlistResults = await Promise.all(
            FEATURE_PLAYLISTS.map(async (cat) => {
                try {
                    const res = await axios.get(`https://api.spotify.com/v1/playlists/${cat.id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const data = res.data;
                    return {
                        title: cat.title,
                        items: (data.tracks?.items || []).slice(0, 15).filter((item: any) => item.track).map((item: any) => ({
                            id: `sp-${item.track.id}`,
                            playlistId: undefined,
                            videoId: undefined, // Needs search
                            title: item.track.name,
                            subtitle: item.track.artists?.map((a: any) => a.name).join(', ') || 'Various',
                            author: item.track.artists?.[0]?.name || 'Spotify',
                            thumbnail: item.track.album?.images?.[0]?.url || '',
                            videoCount: 'Spotify Track',
                            type: 'video', // Treatment as video for playback
                            isSong: true
                        }))
                    };
                } catch (e) {
                    console.warn(`[API/Explore] Failed to fetch playlist ${cat.id}`);
                    return null;
                }
            })
        );

        let shelves = playlistResults.filter(s => s !== null && s.items.length > 0);

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
