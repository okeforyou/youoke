import { NextApiRequest, NextApiResponse } from 'next';
import { scrapeMusicExplore, scrapeMusicCharts, scrapeYouTubePlaylistSearch } from '../../utils/youtubeScraper';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        console.log('[API/Explore] Fetching Dynamic Music Data (YouTube-First)...');

        // Parallel fetch for speed
        const [topArtistsResult, exploreSectionsResult] = await Promise.allSettled([
            scrapeMusicCharts('TH'),
            scrapeMusicExplore()
        ]);

        const topArtists = topArtistsResult.status === 'fulfilled' ? topArtistsResult.value : [];
        const exploreSections = exploreSectionsResult.status === 'fulfilled' ? exploreSectionsResult.value : [];

        // 1. Construct Shelves
        const dynamicShelves: any[] = [];

        // Shelf 1: Top Artists (Circular Design)
        if (topArtists.length > 0) {
            dynamicShelves.push({
                title: '👑 ศิลปินยอดฮิต (Top Artists)',
                items: topArtists.slice(0, 12).map((a: any, i: number) => ({
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
                    items: section.items.slice(0, 12).map((item: any) => ({
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

        // Shelf 3: Emergency Fallback if still empty
        if (dynamicShelves.length < 2) {
            const genres = ['ลูกทุ่งฮิต', 'เพื่อชีวิต', 'T-Pop', 'เพลงไทย 2024'];
            for (const genre of genres) {
                try {
                    const results = await scrapeYouTubePlaylistSearch(genre);
                    if (results.length > 0) {
                        dynamicShelves.push({
                            title: `📂 ${genre}`,
                            items: results.slice(0, 8).map((r: any) => ({
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
            }
        }

        res.status(200).json({
            status: 'success',
            data: dynamicShelves,
            sections: dynamicShelves
        });

    } catch (error: any) {
        console.error('[API/Explore] CRITICAL ERROR:', error);
        res.status(500).json({
            status: 'error',
            message: error.message || 'Unknown Error'
        });
    }
}
