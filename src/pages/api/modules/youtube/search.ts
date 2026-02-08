import { NextApiRequest, NextApiResponse } from 'next';
// @ts-ignore
import { scrapeYouTubeSearch } from '../../../../utils/youtubeScraper';

/**
 * YouTube Theme Dedicated Search API
 * 
 * This module is isolated from the main Spotify-integrated search.
 * It strictly uses the YouTube Scraper engine for "Karaoke Mode" and "YouTube Theme" features.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
        return res.status(400).json({ status: 'error', message: 'Missing query' });
    }

    try {
        console.log(`[Module:YouTube] Searching for: "${q}"`);

        // Use the optimized Concurrent Scraper (Fastest)
        const raw = await scrapeYouTubeSearch(q);

        const formattedData = raw.map((item: any) => ({
            id: item.videoId,
            title: item.title,
            subtitle: item.author,
            thumbnail: item.videoThumbnails?.[1]?.url || item.videoThumbnails?.[0]?.url || '',
            type: 'video'
        }));

        res.status(200).json({
            status: 'success',
            data: formattedData
        });

    } catch (error: any) {
        console.error("[Module:YouTube] Search Error:", error);
        res.status(200).json({
            status: 'error',
            message: error.message || 'Search failed',
            debug_info: error.toString(),
            data: []
        });
    }
}
