import { NextApiRequest, NextApiResponse } from 'next';
import { scrapeYouTubePlaylistSearch } from '../../utils/youtubeScraper';
import { adminFirestore } from '../../firebase-admin';

const CURATED_THAI_ARTISTS = [
    { name: 'Bodyslam', image: '/assets/avatar.jpeg' },
    { name: 'Three Man Down', image: '/assets/avatar.jpeg' },
    { name: 'Tilly Birds', image: '/assets/avatar.jpeg' },
    { name: 'Paper Planes', image: '/assets/avatar.jpeg' },
    { name: 'หนุ่ม กะลา', image: '/assets/avatar.jpeg' },
    { name: 'Cocktail', image: '/assets/avatar.jpeg' },
    { name: 'Potato', image: '/assets/avatar.jpeg' },
    { name: 'Lombok', image: '/assets/avatar.jpeg' },
    { name: 'Jeff Satur', image: '/assets/avatar.jpeg' },
    { name: 'INK WARUNTORN', image: '/assets/avatar.jpeg' }
];

const STABLE_GENRES = ['ลูกทุ่งฮิต', 'เพลงไทย 2024', 'เพื่อชีวิต', 'ร็อกไทย', 'สตริงฮิต'];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        console.log('[API/Explore] Fetching Dynamic Dashboard Data...');

        const dynamicShelves: any[] = [];

        // 1. Fetch from Firestore Cache if available
        let topArtistsFromCache = [];
        try {
            if (adminFirestore) {
                const doc = await adminFirestore.collection('music_cache').doc('youtube_home').get();
                if (doc.exists) {
                    const cacheData = doc.data();
                    if (cacheData?.topArtists && cacheData.topArtists.length > 0) {
                        topArtistsFromCache = cacheData.topArtists;
                        console.log(`✅ Loaded ${topArtistsFromCache.length} artists from cache.`);
                    }
                }
            }
        } catch (cacheErr) {
            console.warn('[Explore API] Cache Read Failed, using fallback artists.');
        }

        // 2. Add Top Artists Shelf
        const artistsToDisplay = topArtistsFromCache.length > 0 ? topArtistsFromCache : CURATED_THAI_ARTISTS;
        
        dynamicShelves.push({
            title: topArtistsFromCache.length > 0 ? '👑 ศิลปินยอดนิยม' : '👑 ศิลปินยอดฮิต (Curated)',
            items: artistsToDisplay.map((a: any, i: number) => ({
                id: `artist-${i}`,
                title: a.name || a.title,
                subtitle: 'ศิลปินยอดนิยม',
                thumbnail: a.imageUrl || a.image,
                type: 'artist',
                isSong: false
            }))
        });

        // 2. Stable Genre-based Playlists
        // We fetch a few high-quality ones to ensure we always have content
        const genrePromises = STABLE_GENRES.slice(0, 3).map(genre => scrapeYouTubePlaylistSearch(genre));
        const genreResults = await Promise.allSettled(genrePromises);

        genreResults.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value.length > 0) {
                dynamicShelves.push({
                    title: `📂 ${STABLE_GENRES[index]}`,
                    items: result.value.slice(0, 10).map((r: any) => ({
                        id: r.playlistId,
                        playlistId: r.playlistId,
                        title: r.title,
                        subtitle: r.videoCount || 'Playlist',
                        thumbnail: r.thumbnail,
                        type: 'playlist',
                        isSong: false
                    }))
                });
            }
        });

        // 3. Fallback if empty (Absolute Survival)
        if (dynamicShelves.length < 2) {
            dynamicShelves.push({
                title: '📂 หมวดหมู่แนะนำ (Fallback)',
                items: [
                    { id: 'yt-PLhP79Yv685p_F0uV5zK1YvR4pWJ3_p8N-', playlistId: 'PLhP79Yv685p_F0uV5zK1YvR4pWJ3_p8N-', title: 'เพลงไทยยอดฮิต', subtitle: 'รวมเพลงดังที่สุด', thumbnail: 'https://i.ytimg.com/vi/uXfXoD-M3M8/hqdefault.jpg', type: 'playlist', isSong: false },
                ]
            });
        }

        res.status(200).json({
            status: 'success',
            data: dynamicShelves,
            sections: dynamicShelves
        });

    } catch (error: any) {
        console.error('[API/Explore] CRITICAL ERROR:', error);
        res.status(200).json({
            status: 'success',
            data: [
                {
                    title: '📂 เพลย์ลิสต์แนะนำ (Recovery Mode)',
                    items: [
                        { id: 'yt-PLhP79Yv685p_F0uV5zK1YvR4pWJ3_p8N-', playlistId: 'PLhP79Yv685p_F0uV5zK1YvR4pWJ3_p8N-', title: 'เพลงไทยยอดฮิต', subtitle: 'กรุณาลองใหม่อีกครั้ง', thumbnail: 'https://i.ytimg.com/vi/uXfXoD-M3M8/hqdefault.jpg', type: 'playlist', isSong: false }
                    ]
                }
            ],
            sections: []
        });
    }
}
