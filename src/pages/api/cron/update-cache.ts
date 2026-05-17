import { NextApiRequest, NextApiResponse } from 'next';
import { adminFirestore } from '../../../firebase-admin';
import { Innertube } from 'youtubei.js';

const CRON_SECRET = process.env.CRON_SECRET || 'dev_secret_key_for_local_testing';

// Comprehensive genres for a rich dashboard experience
const GENRES_TO_CACHE = [
    "ลูกทุ่ง", "ลูกกรุง", "เพื่อชีวิต", "คันทรี", "หมอลำ", "อีสาน", "ปักษ์ใต้",
    "ป็อป", "ป็อปร็อก", "ร็อกไทย", "อินดี้ไทย", "เพลงไทยใหม่ๆ", "T-Pop"
];

// Mapping common names/aliases to Thai for consistency as per user request
const THAI_NAME_MAP: Record<string, string> = {
    'bodyslam': 'บอดี้สแลม',
    'three man down': 'ทรี แมน ดาวน์',
    'tilly birds': 'ทิลลี่ เบิร์ดส',
    'paper planes': 'เปเปอร์ เพลนส์',
    'cocktail': 'ค็อกเทล',
    'potato': 'โปเตโต้',
    'jeff satur': 'เจฟ ซาเตอร์',
    'ink waruntorn': 'อิ้งค์ วรันธร',
    'bowkylion': 'โบกี้ไลอ้อน',
    'safeplanet': 'เซฟแพลนเน็ต',
    'tattoo colour': 'แทททู คัลเลอร์',
    'big ass': 'บิ๊กแอส',
    'loso': 'โลโซ',
    'labanoon': 'ลาบานูน',
    'palmy': 'ปาล์มมี่',
    'da endorphine': 'ดา เอ็นโดรฟิน',
    'klear': 'เคลียร์',
    '25hours': 'ทเวนตี้ไฟว์อาวเวอร์ส',
    'paradox': 'พาราด็อกซ์',
    'mild': 'มายด์',
    'slot machine': 'สล็อตแมชชีน',
    'num kala': 'หนุ่ม กะลา',
    'numkala': 'หนุ่ม กะลา',
    'm.i.a.': 'M.I.A.',
    'f.hero': 'ฟักกลิ้ง ฮีโร่',
    'milli': 'มิลลิ',
    'youngohm': 'ยังโอม',
    'urboytj': 'ยัวร์บอยทีเจ',
    'the toys': 'เดอะ ทอยส์',
    'atom chanagun': 'อะตอม ชนกันต์',
    'scrape': 'สเกรป',
    'scrubb': 'สครับบ์',
    'polycat': 'โพลีแคท',
    'whal & dolph': 'วาฬ แอนด์ ดอล์ฟ',
    'violette wautier': 'วิโอเลต วอเทียร์',
    'phum viphurit': 'ภูมิ วิภูริศ'
};

const getThaiName = (name: string): string => {
    if (!name) return 'Unknown';
    // Remove dots, special chars, and normalize whitespace (including \u00A0)
    const clean = name.replace(/[.\s\u00A0]+/g, ' ').trim().toLowerCase();
    
    // Exact match on cleaned name
    if (THAI_NAME_MAP[clean]) return THAI_NAME_MAP[clean];
    
    // Secondary check: remove all spaces for aggressive matching
    const noSpace = clean.replace(/\s+/g, '');
    if (THAI_NAME_MAP[noSpace]) return THAI_NAME_MAP[noSpace];
    
    return name;
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
                    const rawName = a.title?.toString() || a.name?.toString() || 'Unknown';
                    return {
                        name: getThaiName(rawName),
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
                        const rawName = a.title?.toString() || a.name?.toString() || 'Unknown';
                        return {
                            name: getThaiName(rawName),
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
                        const rawName = artist.name || artist.title?.toString() || query;
                        targetedArtists.push({
                            name: getThaiName(rawName),
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

        // 4. Update Firestore for youtube_home
        const ytDocRef = adminFirestore.collection('music_cache').doc('youtube_home');
        await ytDocRef.set(youtubeCacheData, { merge: true });
        console.log('✅ Global youtube_home cache updated.');

        // 5. Update Official Charts (v5.5.85)
        console.log('🚀 [CRON] Starting YouTube Music Playlists Sync...');
        let youtubeChartsConfig: any = null;
        try {
           const configDoc = await adminFirestore.collection('settings').doc('default').get();
           if (configDoc.exists) {
              const configData = configDoc.data();
              youtubeChartsConfig = configData?.integrations?.youtubeCharts || null;
           }
        } catch (err: any) {
           console.warn('⚠️ [CRON] Failed to read custom charts config from settings:', err.message);
        }

        const playlistMappings = [
          { id: 42, name: "Thailand Top 100", playlistId: youtubeChartsConfig?.top100 || "PLRhRrJscB-C7OA83mRjBr9RHdw1jNk2Aa" },
          { id: 128, name: "อันดับเพลงใหม่", playlistId: youtubeChartsConfig?.newSongs || "PLRhRrJscB-C6x26E-R2xZPrsV8m-WnslU" },
          { id: 133, name: "อันดับเพลงมาแรง", playlistId: youtubeChartsConfig?.trending || "PLRhRrJscB-C4T4pT8Vw9w9p4pS8g0N_5d" },
          { id: 57, name: "THTOP100 2024", playlistId: youtubeChartsConfig?.evergreen || "PLMC9KNkIncKvYin_USF1qoIQ7dfyOPAKr" }
        ];

        const fetchYouTubePlaylist = async (playlistId: string) => {
           try {
              let playlist: any;
              try {
                 playlist = await youtube.music.getPlaylist(playlistId);
              } catch (musicErr: any) {
                 console.warn(`[CRON YOUTUBE] YTM playlist fetch failed for ${playlistId} (${musicErr.message}), trying YouTube Main API...`);
                 playlist = await youtube.getPlaylist(playlistId);
              }
              
              if (playlist && (playlist.contents || playlist.videos)) {
                 const rawItems = playlist.contents || playlist.videos || [];
                 const tracks = rawItems
                    .map((v: any) => {
                       const videoId = v.id || v.videoId || "";
                       let title = v.title?.toString() || "";
                       
                       // Resilient artist name mapping
                       let artistName = "Unknown Artist";
                       if (v.artists && Array.isArray(v.artists) && v.artists.length > 0) {
                          artistName = v.artists.map((art: any) => art.name || art.toString()).join(", ");
                       } else if (v.author) {
                          artistName = typeof v.author === 'string' ? v.author : (v.author.name || v.author.toString() || "Unknown Artist");
                       } else if (v.short_byline_text) {
                          artistName = v.short_byline_text.toString();
                       }
                       
                       const coverImageURL = v.thumbnails?.[0]?.url 
                          ? v.thumbnails[0].url.split('?')[0] 
                          : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
                       
                       title = title
                          .replace(/Official MV/i, "")
                          .replace(/\[.*?\]/g, "")
                          .replace(/\(.*?\)/g, "")
                          .trim();
                          
                       artistName = artistName.replace(/ - Topic$/i, "").replace(/Official$/i, "").trim();
                       
                       return {
                          id: videoId,
                          title: title,
                          artist_name: artistName,
                          coverImageURL: coverImageURL
                       };
                    })
                    .filter((song: any) => song.id && song.title);
                    
                 if (tracks.length > 0) {
                    return tracks.slice(0, 20);
                 }
              }
           } catch (err: any) {
              console.error(`[CRON YOUTUBE] Failed for ${playlistId}:`, err.message);
           }
           return null;
        };

        const ytResults = [];
        for (const chart of playlistMappings) {
           console.log(`[CRON YOUTUBE] Syncing ${chart.name} (${chart.playlistId})...`);
           const singles = await fetchYouTubePlaylist(chart.playlistId);
           if (singles && singles.length > 0) {
              ytResults.push({
                 id: chart.id,
                 name: chart.name,
                 singles: singles
              });
           }
           await new Promise(resolve => setTimeout(resolve, 300));
        }

        if (ytResults.length > 0) {
           const chartsDocRef = adminFirestore.collection('system_cache').doc('joox_charts');
           await chartsDocRef.set({
              updatedAt: new Date().toISOString(),
              charts: ytResults
           });
           console.log(`🎉 [CRON] Saved ${ytResults.length} charts to system_cache/joox_charts.`);
        }
        
        console.log('🎉 [CRON] Global InnerTube Caching Job Complete.');

        res.status(200).json({
            success: true,
            message: 'Music and Charts cache updated with high-quality InnerTube data',
            stats: {
                artists: topArtists.length,
                artist_names: topArtists.map((a: any) => a.name),
                raw_artist_length: topArtists.length,
                genres_count: Object.keys(genreData).length,
                genres_cached: Object.keys(genreData),
                charts_count: ytResults.length,
                charts_names: ytResults.map(c => c.name)
            }
        });

    } catch (error: any) {
        console.error('❌ [CRON] InnerTube Job Failed:', error);
        res.status(500).json({ success: false, error: error.message || 'Unknown error occurred' });
    }
}
