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

        // 3. Helper to distinguish Singing vs Listening
        const isLongPlay = (title: string) => {
            const keywords = ['รวมเพลง', 'ฟังยาวๆ', 'medley', 'non stop', 'ต่อเนื่อง', '1 ชั่วโมง', 'ยาวๆ', 'full album', 'mix'];
            return keywords.some(k => title.toLowerCase().includes(k));
        };

        // 4. Add Recommended Shelves (Curated & Categorized)
        const genreTitles = Object.keys(cachedGenres).length > 0 ? Object.keys(cachedGenres) : STABLE_GENRES;
        const priorityGenres = ['T-Pop', 'ป็อป', 'รวมเพลงดังมาแรง', 'เพลงไทยใหม่ๆ', 'ป็อปร็อก', 'อินดี้ไทย', 'ลูกทุ่ง'];
        const sortedGenres = Array.from(new Set([...priorityGenres.filter(g => genreTitles.includes(g)), ...genreTitles]));

        // Separate items for Singing vs Listening
        const singingShelves = [];
        const listeningItems = [];

        for (const genre of sortedGenres.slice(0, 15)) {
            let rawItems = [];
            if (cachedGenres[genre]) {
                rawItems = cachedGenres[genre];
            } else {
                try {
                    rawItems = await scrapeYouTubePlaylistSearch(genre);
                } catch (e) { continue; }
            }

            const singingItems = [];
            for (const item of rawItems) {
                const mappedItem = {
                    id: item.playlistId || item.id,
                    playlistId: item.playlistId || item.id,
                    title: item.title,
                    subtitle: item.author || (isLongPlay(item.title) ? 'โหมดฟังยาวๆ' : 'YouTube Music'),
                    thumbnail: item.thumbnail,
                    type: 'playlist',
                    isLongPlay: isLongPlay(item.title),
                    isSong: false
                };

                if (mappedItem.isLongPlay) {
                    listeningItems.push(mappedItem);
                } else {
                    singingItems.push(mappedItem);
                }
            }

            if (singingItems.length > 0) {
                singingShelves.push({
                    title: `🎤 ${genre} (สำหรับร้อง)`,
                    items: singingItems.slice(0, 10),
                    mode: 'singing'
                });
            }
        }

        // Add 3-4 Singing Shelves first
        dynamicShelves.push(...singingShelves.slice(0, 5));

        // Add "Listening Lounge" (Long Plays) as a discovery row
        if (listeningItems.length > 0) {
            dynamicShelves.push({
                title: '🎧 โหมดฟังยาวๆ (Medley & Long Play)',
                items: Array.from(new Map(listeningItems.map(item => [item.id, item])).values()).slice(0, 12), // Deduplicate
                mode: 'listening'
            });
        }

        // Add remaining singing shelves
        dynamicShelves.push(...singingShelves.slice(5));

        // 5. Final Response & Fallback
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
