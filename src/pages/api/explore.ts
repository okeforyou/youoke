import { NextApiRequest, NextApiResponse } from 'next';
import { scrapeMusicExplore, scrapeMusicCharts, scrapeYouTubePlaylistSearch } from '../../utils/youtubeScraper';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        console.log('[API/Explore] Fetching Dynamic Music Data (YouTube-First)...');

        // Parallel fetch for speed
        const results = await Promise.allSettled([
            scrapeMusicCharts('TH'),
            scrapeMusicExplore()
        ]);

        const topArtists = results[0].status === 'fulfilled' ? results[0].value : [];
        const exploreSections = results[1].status === 'fulfilled' ? results[1].value : [];

        console.log(`[API/Explore] Charts count: ${topArtists.length}, Explore count: ${exploreSections.length}`);

        // 1. Construct Shelves
        const dynamicShelves: any[] = [];

        // Shelf 1: Top Artists (Circular Design)
        if (topArtists.length > 0) {
            dynamicShelves.push({
                title: '👑 ศิลปินยอดฮิต (Top Artists)',
                items: topArtists.slice(0, 15).map((a: any, i: number) => ({
                    id: `artist-${i}`,
                    title: a.name,
                    subtitle: `อันดับ ${a.rank || i + 1}`,
                    thumbnail: a.imageUrl,
                    type: 'artist',
                    isSong: false
                }))
            });
        }

        // Shelf 2: From Explore Sections (Playlists/Videos)
        exploreSections.forEach((section: any) => {
            if (section.title && section.items?.length > 0) {
                dynamicShelves.push({
                    title: section.title,
                    items: section.items.slice(0, 15).map((item: any) => ({
                        id: item.playlistId || item.videoId,
                        playlistId: item.playlistId,
                        videoId: item.videoId,
                        title: item.title,
                        subtitle: item.author || 'YouTube Music',
                        thumbnail: item.thumbnail,
                        type: item.playlistId ? 'playlist' : 'video',
                        isSong: !!item.videoId
                    }))
                });
            }
        });

        // Shelf 3: Emergency Fallback if still empty or low on content
        if (dynamicShelves.length < 2) {
            console.log('[API/Explore] Content low, triggering genre fallback...');
            const genres = ['ลูกทุ่งฮิต', 'เพลงไทย 2024', 'เพื่อชีวิต', 'ร็อกไทย'];
            for (const genre of genres) {
                try {
                    const results = await scrapeYouTubePlaylistSearch(genre);
                    if (results.length > 0) {
                        dynamicShelves.push({
                            title: `📂 ${genre}`,
                            items: results.slice(0, 10).map((r: any) => ({
                                id: r.playlistId,
                                playlistId: r.playlistId,
                                title: r.title,
                                subtitle: r.videoCount,
                                thumbnail: r.thumbnail,
                                type: 'playlist',
                                isSong: false
                            }))
                        });
                    }
                } catch (err) { }
                if (dynamicShelves.length >= 4) break; // Don't overdo it
            }
        }

        // ABSOLUTE SANE FALLBACK (Hardcoded just in case everything above fails miserably)
        if (dynamicShelves.length === 0) {
            console.log('[API/Explore] CRITICAL: All scrapers failed. Using hardcoded survival fallback.');
            dynamicShelves.push({
                title: '📂 หมวดหมู่แนะนำ',
                items: [
                    { id: 'yt-PLhP79Yv685p_F0uV5zK1YvR4pWJ3_p8N-', playlistId: 'PLhP79Yv685p_F0uV5zK1YvR4pWJ3_p8N-', title: 'เพลงไทยยอดฮิต', subtitle: 'รวมเพลงดังที่สุด', thumbnail: 'https://i.ytimg.com/vi/uXfXoD-M3M8/hqdefault.jpg', type: 'playlist', isSong: false },
                    { id: 'yt-PL3y_Bf6-jFq8pD_7vW9A9Z6E-A_7Z-', playlistId: 'PL3y_Bf6-jFq8pD_7vW9A9Z6E-A_7Z-', title: 'ลูกทุ่งมหานคร', subtitle: 'ฮิตติดหู', thumbnail: 'https://i.ytimg.com/vi/uXfXoD-M3M8/hqdefault.jpg', type: 'playlist', isSong: false }
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
