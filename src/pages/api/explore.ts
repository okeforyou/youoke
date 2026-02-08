
import { NextApiRequest, NextApiResponse } from 'next';
// @ts-ignore
import YTMusic from 'ytmusic-api';

let ytmusic: any;

const initializeYT = async () => {
    if (!ytmusic) {
        ytmusic = new YTMusic();
        // Initialize with Thailand Locale
        await ytmusic.initialize({ gl: 'TH', hl: 'th' });
    }
    return ytmusic;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    try {
        console.log('[API/Explore] Initializing YTMusic...');
        const yt = await initializeYT();

        console.log('[API/Explore] Fetching Data (Rich Thai Content)...');

        // CATEGORY CONFIGURATION (Thai Content Focus)
        // TODO: Move this to Admin Database later for dynamic configuration
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

        // Parallel Fetch with Individual Error Handling
        const results = await Promise.all(
            CATEGORIES.map(cat => yt.search(cat.query).then((res: any) => res).catch((e: any) => {
                console.error(`[API/Explore] Failed to search '${cat.query}':`, e.message);
                return [];
            }))
        );

        // Helper to map items
        const mapItems = (items: any[]) => items.map((item: any) => {
            const id = item.videoId || item.playlistId || item.browseId;
            if (!id) return null;

            const thumbnails = item.thumbnails || [];
            const thumbnail = thumbnails.length > 0 ? thumbnails[thumbnails.length - 1].url : undefined;

            return {
                title: item.name || item.title || 'Unknown',
                subtitle: Array.isArray(item.artists) ? item.artists.map((a: any) => a.name).join(', ') : (item.artist?.name || ''),
                thumbnail: thumbnail,
                id: id,
                type: item.videoId ? 'video' : (item.playlistId ? 'playlist' : 'unknown')
            };
        }).filter((i: any) => i !== null);


        // Construct Shelves (100% Custom Categories)
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
