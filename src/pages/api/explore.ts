import { NextApiRequest, NextApiResponse } from 'next';
import { scrapeYouTubeSearch } from '../../utils/youtubeScraper';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        console.log('[API/Explore] Fetching Data (Rich Thai Content) via Scraper...');

        // CATEGORY CONFIGURATION (Thai Content Focus)
        const CATEGORIES = [
            { query: 'Top 100 Thailand', title: '🏆 Thailand Top 100' },
            { query: 'เพลงไทยฮิตล่าสุด', title: '🔥 เพลงไทยมาแรง 2025' },
            { query: 'ลูกทุ่งฮิต 100 ล้านวิว', title: '🌾 ลูกทุ่งยอดนิยม' },
            { query: 'หมอลำซิ่ง', title: '💃 หมอลำม่วนๆ' },
            { query: 'T-Pop Hits', title: '🎤 T-Pop ฮิตติดชาร์ต' },
            { query: 'เพลงร็อคไทยฮิต', title: '🎸 ร็อคไทยหัวใจสิงห์' },
            { query: 'เพลงไทย 90s', title: '📼 ฮิตยุค 90-2000' },
            { query: 'เพลงเพื่อชีวิตฮิต', title: '🐃 เพื่อชีวิตตำนาน' },
            { query: 'เพลงอินดี้ไทย', title: '🧣 Indie Thai' },
            { query: 'เพลงเศร้าอกหัก', title: '💔 เพลงเศร้าเคล้าน้ำตา' },
            { query: 'เพลงแดนซ์สายย่อ', title: '🕺 แดนซ์สายย่อ' }
        ];

        console.log(`[API/Explore] Fetching ${CATEGORIES.length} Thai Categories...`);

        // Parallel Fetch using our Robust Scraper
        const results = await Promise.all(
            CATEGORIES.map(cat =>
                scrapeYouTubeSearch(cat.query)
                    .then(res => res)
                    .catch(e => {
                        console.error(`[API/Explore] Failed to search '${cat.query}':`, e.message);
                        return [];
                    })
            )
        );

        // Helper to map scraper items to Shelf items
        const mapItems = (items: any[]) => items.map((item: any) => ({
            title: item.title,
            subtitle: item.author || '',
            thumbnail: item.videoThumbnails?.[0]?.url || item.videoThumbnails?.[1]?.url || '',
            id: item.videoId,
            type: 'video' // Scraper returns videos
        }));

        // Construct Shelves
        const parsedData = CATEGORIES.map((cat, index) => ({
            title: cat.title,
            items: mapItems(results[index] || []).slice(0, 25)
        })).filter(shelf => shelf.items.length > 0);

        res.status(200).json({
            status: 'success',
            data: parsedData
        });

    } catch (error: any) {
        console.error('[API/Explore] CRITICAL ERROR:', error);
        res.status(200).json({
            status: 'error',
            message: error.message || 'Unknown Error',
            debug_info: error.toString() + (error.stack ? `\n${error.stack}` : '')
        });
    }
}
