import type { NextApiRequest, NextApiResponse } from "next";
import { searchSpotifyPlaylists } from "../../../modules/spotify-theme/services/api";
import { scrapeYouTubePlaylistSearch } from "../../../utils/youtubeScraper";
import { adminFirestore } from "../../../firebase-admin";

// Genre-to-query mapping: produce high-quality playlist results for Thai genre keywords
const GENRE_QUERY_MAP: Record<string, string> = {
    "ลูกทุ่ง": "รวมเพลงลูกทุ่งยอดฮิต 100 ล้านวิว",
    "ลูกทุ่งยอดนิยม": "รวมเพลงลูกทุ่งยอดฮิต 100 ล้านวิว",
    "ลูกกรุง": "รวมเพลงลูกกรุง ฮิตตลอดกาล เพราะๆ",
    "เพื่อชีวิต": "รวมเพลงเพื่อชีวิต ฮิตตลอดกาล คาราบาว พงษ์สิทธิ์",
    "คันทรี": "เพลงคันทรี่ไทย ฮิต ลูกทุ่งอินเตอร์",
    "หมอลำ": "รวมเพลงหมอลำ ฮิต 2025 ยอดนิยม",
    "อีสาน": "รวมเพลงอีสาน ฮิต ยอดนิยม มาแรง",
    "ปักษ์ใต้": "รวมเพลงใต้ ยอดนิยม ฮิตตลอดกาล",
    "ป็อป": "เพลงป็อปไทย ฮิต 2025 T-Pop",
    "T-Pop Hits": "เพลงป็อปไทย ฮิต 2025 T-Pop",
    "ป็อปร็อก": "เพลงป็อปร็อกไทย ฮิต รวมเพลงดัง",
    "ฮาร์ดร็อก": "เพลงร็อกไทย ฮาร์ดร็อก ยอดนิยม",
    "ร็อกแอนด์โรล": "เพลงร็อกไทย ร็อกแอนด์โรล ฮิต",
    "ริทึมแอนด์บลูส์": "เพลง R&B ไทย ฮิต ยอดนิยม"
};

// Simple Cache Map
const searchCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 Minutes

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { q } = req.query;

    if (!q) {
        return res.status(400).json({ error: "Query 'q' is required" });
    }

    const searchQuery = q as string;

    // 1. Check Firestore Cache (music_cache/youtube_home) for highly common genres
    if (adminFirestore) {
        try {
            const cacheDoc = await adminFirestore.collection('music_cache').doc('youtube_home').get();
            if (cacheDoc.exists) {
                const cacheData = cacheDoc.data();
                // Check if this query exists as a pre-scraped genre
                if (cacheData?.genres && cacheData.genres[searchQuery]) {
                    console.log(`📡 Serving Search results for "${searchQuery}" from Firestore Cache`);
                    return res.status(200).json(cacheData.genres[searchQuery]);
                }
                
                // Fuzzy matching for genres (e.g. "ลูกทุ่ง" matches "ลูกทุ่งยอดนิยม")
                const genreKeys = Object.keys(cacheData?.genres || {});
                const match = genreKeys.find(k => k.includes(searchQuery) || searchQuery.includes(k));
                if (match && cacheData?.genres) {
                    console.log(`📡 Serving Fuzzy Search results for "${searchQuery}" (matched ${match}) from Firestore Cache`);
                    return res.status(200).json(cacheData.genres[match]);
                }
            }
        } catch (e) {
            console.warn('[API/Playlists] Firestore cache check failed, falling back to live search');
        }
    }

    const cacheKey = searchQuery;
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log(`⚡ Serving Search results for "${searchQuery}" from Memory Cache`);
        return res.status(200).json(cached.data);
    }

    try {
        let finalQuery = searchQuery;

        // Use mapped query if available, otherwise enhance with keywords
        if (GENRE_QUERY_MAP[finalQuery]) {
            finalQuery = GENRE_QUERY_MAP[finalQuery];
        } else {
            const thaiGenreKeywords = ["ลูกทุ่ง", "ลูกกรุง", "เพื่อชีวิต", "หมอลำ", "อีสาน", "ปักษ์ใต้", "ร็อก", "ป็อป", "เพลงไทย"];
            if (thaiGenreKeywords.some(k => finalQuery.includes(k))) {
                if (!finalQuery.includes("ไทย")) finalQuery += " ไทย";
                if (!finalQuery.includes("ฮิต")) finalQuery += " ฮิต";
            }
        }

        console.log(`[API] Searching playlists for: ${finalQuery} (Page: ${req.query.page || 1})`);

        const page = Number(req.query.page) || 1;
        const limit = 20;
        const offset = (page - 1) * limit;

        let results: any[] = [];

        // 1. Try Spotify FIRST (Most stable on Vercel)
        try {
            console.log(`[API] Attempting Spotify search for: ${searchQuery}`);
            let spotifyResults: any[] = [];
            spotifyResults = await searchSpotifyPlaylists(searchQuery, limit, offset);

            if (spotifyResults && Array.isArray(spotifyResults) && spotifyResults.length > 0) {
                results = spotifyResults
                    .filter((item: any) => item && item.id)
                    .map((item: any) => ({
                        playlistId: `sp-${item.id}`,
                        title: item.name,
                        thumbnail: item.images?.[0]?.url || "",
                        author: item.owner?.display_name || "Spotify",
                        videoCount: item.tracks?.total?.toString() || "playlist"
                    }));
                console.log(`[API] Spotify search SUCCESS for: ${searchQuery} (${results.length} results)`);
            } else {
                console.warn(`[API] Spotify search EMPTY for: ${searchQuery}`);
            }
        } catch (e: any) {
            console.warn(`[API] Spotify Search ERROR for ${searchQuery}:`, e.message);
        }

        // 2. Fallback to YouTube Scraper if Spotify didn't work
        if (results.length === 0) {
            console.log(`[API] Attempting YouTube Scraper fallback for: ${searchQuery}`);
            try {
                const ytResults = await scrapeYouTubePlaylistSearch(searchQuery);
                if (ytResults && ytResults.length > 0) {
                    results = ytResults.map(item => ({
                        ...item,
                        playlistId: item.playlistId.startsWith('yt-') ? item.playlistId : `yt-${item.playlistId}`
                    }));
                    console.log(`[API] YouTube scraper SUCCESS for: ${searchQuery} (${results.length} results)`);
                } else {
                    console.warn(`[API] YouTube scraper EMPTY for: ${searchQuery}`);
                }
            } catch (e: any) {
                console.warn(`[API] YouTube scraper ERROR for ${searchQuery}:`, e.message);
            }
        }

        if (results.length === 0) {
            return res.status(200).json([]);
        }

        // Cache successful results
        searchCache.set(cacheKey, { data: results, timestamp: Date.now() });

        return res.status(200).json(results);

    } catch (error: any) {
        console.error(`[API] Playlist search failed: ${error.message}`);
        return res.status(500).json({ error: "Failed to search playlists", details: error.message });
    }
}
