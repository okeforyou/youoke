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
        let cachedGenres: Record<string, any[]> = {};
        
        try {
            if (adminFirestore) {
                const doc = await adminFirestore.collection('music_cache').doc('youtube_home').get();
                if (doc.exists) {
                    const cacheData = doc.data();
                    if (cacheData?.topArtists) topArtistsFromCache = cacheData.topArtists;
                    if (cacheData?.genres) cachedGenres = cacheData.genres;
                    console.log(`✅ Loaded cache (Artists: ${topArtistsFromCache.length}, Genres: ${Object.keys(cachedGenres).length})`);
                }
            }
        } catch (cacheErr) {
            console.warn('[Explore API] Cache Read Failed, using live fallback.');
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

        // 3. Add Recommended Genre Shelves (Mixed Cache + Live)
        const genreTitles = Object.keys(cachedGenres).length > 0 
            ? Object.keys(cachedGenres) 
            : STABLE_GENRES;

        // Priority Genres for the "Recommended" section
        const priorityGenres = ['T-Pop', 'ป็อป', 'รวมเพลงดังมาแรง', 'เพลงไทยใหม่ๆ', 'ป็อปร็อก', 'อินดี้ไทย'];
        const sortedGenres = Array.from(new Set([...priorityGenres.filter(g => genreTitles.includes(g)), ...genreTitles]));

        for (let i = 0; i < sortedGenres.slice(0, 10).length; i++) {
            const genre = sortedGenres[i];
            let items = [];
            
            if (cachedGenres[genre]) {
                items = cachedGenres[genre].map((r: any) => ({
                    id: r.playlistId,
                    playlistId: r.playlistId,
                    title: r.title,
                    subtitle: r.author || 'YouTube Music',
                    thumbnail: r.thumbnail,
                    type: 'playlist',
                    isSong: false
                }));
            } else {
                // Live Fallback if this genre isn't in cache
                try {
                    const liveResults = await scrapeYouTubePlaylistSearch(genre);
                    items = liveResults.slice(0, 10).map((r: any) => ({
                        id: r.playlistId,
                        playlistId: r.playlistId,
                        title: r.title,
                        subtitle: r.videoCount || 'Playlist',
                        thumbnail: r.thumbnail,
                        type: 'playlist',
                        isSong: false
                    }));
                } catch (e) {
                    continue; // Skip if live fetch fails
                }
            }

            if (items.length > 0) {
                // Use a special title for the first genre if it's a priority one
                let shelfTitle = `📂 ${genre}`;
                if (i === 0 && priorityGenres.includes(genre)) {
                    shelfTitle = `✨ เพลงแนะนำสำหรับคุณ (${genre})`;
                }

                dynamicShelves.push({
                    title: shelfTitle,
                    items: items
                });
            }
        }

        // 4. Absolute Survival Fallback
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
