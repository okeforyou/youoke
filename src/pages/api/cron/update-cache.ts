import { NextApiRequest, NextApiResponse } from 'next';
import { adminFirestore } from '../../../firebase-admin';
import { Innertube } from 'youtubei.js';

const CRON_SECRET = process.env.CRON_SECRET || 'dev_secret_key_for_local_testing';

// Comprehensive genres for a rich dashboard experience
const GENRES_TO_CACHE = [
    "ลูกทุ่ง", "ลูกกรุง", "เพื่อชีวิต", "คันทรี", "หมอลำ", "อีสาน", "ปักษ์ใต้",
    "ป็อป", "ป็อปร็อก", "ร็อกไทย", "อินดี้ไทย", "เพลงไทยใหม่ๆ", "T-Pop"
];

// Mapping English names to Thai for consistency as per user request
const THAI_NAME_MAP: Record<string, string> = {
    'Bodyslam': 'บอดี้สแลม',
    'Three Man Down': 'ทรี แมน ดาวน์',
    'Tilly Birds': 'ทิลลี่ เบิร์ดส',
    'Paper Planes': 'เปเปอร์ เพลนส์',
    'Cocktail': 'ค็อกเทล',
    'Potato': 'โปเตโต้',
    'Jeff Satur': 'เจฟ ซาเตอร์',
    'Ink Waruntorn': 'อิ้งค์ วรันธร',
    'Bowkylion': 'โบกี้ไลอ้อน',
    'Safeplanet': 'เซฟแพลนเน็ต',
    'Tattoo Colour': 'แทททู คัลเลอร์',
    'Big Ass': 'บิ๊กแอส',
    'Loso': 'โลโซ',
    'Labanoon': 'ลาบานูน',
    'Palmy': 'ปาล์มมี่',
    'Da Endorphine': 'ดา เอ็นโดรฟิน',
    'Klear': 'เคลียร์',
    '25hours': 'ทเวนตี้ไฟว์อาวเวอร์ส',
    'Paradox': 'พาราด็อกซ์',
    'Mild': 'มายด์',
    'Slot Machine': 'สล็อตแมชชีน'
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${CRON_SECRET}` && req.query.key !== CRON_SECRET) {
        console.warn('Unauthorized attempt to trigger cron job');
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!adminFirestore) {
        return res.status(500).json({ error: 'Firebase Admin not initialized properly' });
    }

    try {
        console.log('🚀 [CRON] Starting InnerTube-powered Caching Job...');

        // 1. Initialize InnerTube with region/lang for TH data
        const youtube = await Innertube.create({
            region: 'TH',
            language: 'th'
        });
        console.log('✅ InnerTube Connected with region: TH, lang: th.');

        // 2. Fetch Top Charts (Artists)
        console.log('Fetching Music Charts (TH)...');
        let topArtists: any[] = [];
        try {
            // Priority 1: Official Music Charts for Thailand
            const charts = await youtube.music.getCharts('TH');
            const artistsShelf = charts.sections.find((s: any) => {
                const title = s.title?.toString()?.toLowerCase() || '';
                return title.includes('artist') || title.includes('ศิลปิน') || title.includes('top') || title.includes('ยอดนิยม');
            });
            
            if (artistsShelf && artistsShelf.contents) {
                topArtists = artistsShelf.contents.map((a: any) => {
                    const name = a.title?.toString() || a.name?.toString() || 'Unknown';
                    return {
                        name: THAI_NAME_MAP[name] || name,
                        imageUrl: a.thumbnails?.[0]?.url?.replace('w120-h120', 'w500-h500') || ''
                    };
                }).filter((a: any) => a.name !== 'Unknown').slice(0, 20);
                console.log(`✅ Found ${topArtists.length} artists from Charts.`);
            }

            // Priority 2: Fallback to Explore if Charts didn't work
            if (topArtists.length === 0) {
                const explore = await youtube.music.getExplore();
                const chartsShelf = explore.sections.find((s: any) => {
                    const title = s.title?.toString() || '';
                    return title.includes('Artist') || title.includes('ศิลปิน') || title.includes('ยอดนิยม');
                });
                if (chartsShelf && chartsShelf.contents) {
                    topArtists = chartsShelf.contents.map((a: any) => {
                        const name = a.title?.toString() || a.name?.toString() || 'Unknown';
                        return {
                            name: THAI_NAME_MAP[name] || name,
                            imageUrl: a.thumbnails?.[0]?.url || ''
                        };
                    }).filter((a: any) => a.name !== 'Unknown').slice(0, 20);
                    console.log(`✅ Found ${topArtists.length} artists from Explore.`);
                }
            }
        } catch (e) {
            console.warn('⚠️ Error fetching charts, attempting search fallback:', (e as Error).message);
        }

        // Priority 3: Guaranteed Fetching via Targeted Search
        if (topArtists.length < 5) {
            console.log('🚨 Fetching Targeted Artists for Guaranteed Results...');
            const FAMOUS_ARTISTS = [
                'บอดี้สแลม', 'ทรี แมน ดาวน์', 'ทิลลี่ เบิร์ดส', 'เปเปอร์ เพลนส์', 
                'หนุ่ม กะลา', 'ค็อกเทล', 'โปเตโต้', 'เจฟ ซาเตอร์', 'อิ้งค์ วรันธร',
                'โบกี้ไลอ้อน', 'เซฟแพลนเน็ต', 'แทททู คัลเลอร์', 'ลาบานูน', 'บิ๊กแอส'
            ];
            
            const targetedArtists: any[] = [];
            for (const query of FAMOUS_ARTISTS) {
                try {
                    const search = await youtube.music.search(query, { type: 'artist' });
                    const artist = search.artists?.contents?.[0];
                    if (artist) {
                        const name = artist.name || artist.title?.toString() || query;
                        targetedArtists.push({
                            name: THAI_NAME_MAP[name] || name,
                            imageUrl: artist.thumbnails?.[0]?.url || ''
                        });
                    }
                } catch (e) {
                    console.warn(`Failed to fetch artist: ${query}`);
                }
                if (targetedArtists.length >= 12) break;
            }
            
            if (targetedArtists.length > 0) {
                topArtists = targetedArtists;
                console.log(`✅ Guaranteed Fetch: ${topArtists.length} artists.`);
            }
        }

        // 3. Fetch Genre Playlists using Search (highly reliable)
        console.log(`Fetching ${GENRES_TO_CACHE.length} Genres...`);
        const genreData: Record<string, any[]> = {};

        for (const genre of GENRES_TO_CACHE) {
            try {
                process.stdout.write(`🔍 [InnerTube] Scraping: ${genre}... `);
                const search = await youtube.music.search(genre, { type: 'playlist' });
                
                if (search.playlists && search.playlists.contents.length > 0) {
                    genreData[genre] = search.playlists.contents.map((p: any) => ({
                        playlistId: p.id,
                        title: p.title?.toString() || 'Unknown',
                        thumbnail: (p as any).thumbnails?.[0]?.url || '',
                        author: p.author?.name || 'YouTube Music',
                        // Map to our existing Dashboard structure if needed
                        videoCount: '20+' 
                    })).slice(0, 20);
                    console.log(`✅ ${genreData[genre].length} items.`);
                } else {
                    console.log(`⚠️ No playlists found.`);
                }
            } catch (e) {
                console.error(`❌ Failed: ${genre}`, (e as Error).message);
            }
            // Polite delay
            await new Promise(r => setTimeout(r, 1000));
        }

        const youtubeCacheData = {
            topArtists: topArtists,
            genres: genreData,
            updatedAt: new Date().toISOString(),
            source: 'InnerTube-Pattern-V2'
        };

        // 4. Update Firestore
        const ytDocRef = adminFirestore.collection('music_cache').doc('youtube_home');
        await ytDocRef.set(youtubeCacheData, { merge: true });
        
        console.log('🎉 [CRON] Global InnerTube Caching Job Complete.');

        res.status(200).json({
            success: true,
            message: 'Music cache updated with high-quality InnerTube data',
            stats: {
                artists: topArtists.length,
                artist_names: topArtists.map((a: any) => a.name),
                raw_artist_length: topArtists.length,
                genres_count: Object.keys(genreData).length,
                genres_cached: Object.keys(genreData)
            }
        });

    } catch (error: any) {
        console.error('❌ [CRON] InnerTube Job Failed:', error);
        res.status(500).json({ success: false, error: error.message || 'Unknown error occurred' });
    }
}
