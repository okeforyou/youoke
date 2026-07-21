import { NextApiRequest, NextApiResponse } from 'next';
import YTMusic from 'ytmusic-api';
// @ts-ignore
import { scrapeYouTubeSearch } from '../../../utils/youtubeScraper';

const ytmusic = new YTMusic();
let isInitialized = false;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Initialize (Lazy & Cached)
    if (!isInitialized) {
        try {
            await ytmusic.initialize({ GL: 'TH', HL: 'th' });
            isInitialized = true;
        } catch (e) {
            console.error("YT Search Init Error:", e);
        }
    }

    const { q, type } = req.query;

    if (!q || typeof q !== 'string') {
        return res.status(400).json({ status: 'error', message: 'Missing query' });
    }

    // OPTIMIZATION: If query is for Karaoke, force SCRAPE mode immediately.
    // YTMusic is bad at karaoke and often blocked on Vercel, so skipping it saves 5-10s of timeout.
    let searchType = type;
    if (q.toLowerCase().includes('karaoke') || q.toLowerCase().includes('คาราโอเกะ')) {
        console.log(`🎤 Query contains 'karaoke', forcing SCRAPE mode.`);
        searchType = 'SCRAPE';
    }

    try {
        console.log(`Searching: "${q}" [Type: ${searchType || 'ALL'}]`);
        let formattedData: any[] = [];

        // SCRAPE MODE (Forced for Karaoke)
        if (searchType === 'SCRAPE') {
            console.log("🚀 Using Scraper for:", q);
            const raw = await scrapeYouTubeSearch(q);
            formattedData = raw.map((item: any) => ({
                id: item.videoId,
                title: item.title,
                subtitle: item.author,
                thumbnail: item.videoThumbnails?.[1]?.url || item.videoThumbnails?.[0]?.url || '',
                type: 'video'
            }));
        }
        // STANDARD MODE (Prioritize Scraper)
        else {
            try {
                console.log(`[Search] Using Primary Scraper for: ${q}`);
                // Try Scraper First (Direct -> Invidious)
                const raw = await scrapeYouTubeSearch(q);

                formattedData = raw.map((item: any) => ({
                    id: item.videoId,
                    title: item.title,
                    subtitle: item.author,
                    thumbnail: item.videoThumbnails?.[1]?.url || item.videoThumbnails?.[0]?.url || '',
                    type: 'video'
                }));
            } catch (scraperError: any) {
                console.warn(`[Search] Scraper failed (${scraperError.message}). Trying Fallback API...`);

                // Fallback to YTMusic API (if Scraper completely fails)
                try {
                    // @ts-ignore
                    const raw = await ytmusic.search(q);
                    formattedData = raw.map((item: any) => ({
                        id: item.videoId || item.id,
                        title: item.name || item.title,
                        subtitle: item.artist?.name || item.author,
                        thumbnail: item.thumbnails?.[1]?.url || item.thumbnails?.[0]?.url || '',
                        type: (item.type || 'video').toLowerCase()
                    }));
                } catch (apiError) {
                    console.error("Critical: Both Scraper and API failed");
                    throw scraperError; // Throw the original error or generic
                }
            }
        }

        if (formattedData.length === 0 && !req.query.noproxy) {
            try {
                console.log(`[YT Search] Proxying to VPS for "${q}"`);
                const proxyRes = await fetch(`https://play.okeforyou.com/api/yt/search?q=${encodeURIComponent(q as string)}&type=${type || ''}&noproxy=1`);
                if (proxyRes.ok) {
                    const proxyData = await proxyRes.json();
                    if (proxyData.status === 'success' && Array.isArray(proxyData.data) && proxyData.data.length > 0) {
                        console.log(`[YT Search] ✅ VPS Proxy: ${proxyData.data.length} results`);
                        return res.status(200).json(proxyData);
                    }
                }
            } catch (e: any) {
                console.error("[YT Search] VPS Proxy failed:", e.message);
            }
        }

        return res.status(200).json({ status: 'success', data: formattedData });
    } catch (error: any) {
        console.error("YT Search Error:", error);
        
        // Final Proxy attempt on hard crash
        if (!req.query.noproxy) {
            try {
                const proxyRes = await fetch(`https://play.okeforyou.com/api/yt/search?q=${encodeURIComponent(q as string)}&type=${type || ''}&noproxy=1`);
                if (proxyRes.ok) {
                    const proxyData = await proxyRes.json();
                    if (proxyData.status === 'success') {
                        return res.status(200).json(proxyData);
                    }
                }
            } catch (e) {}
        }

        res.status(500).json({
            status: 'error',
            message: error.message || 'Search failed',
            debug_info: error.toString()
        });
    }
}
