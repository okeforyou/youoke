import type { NextApiRequest, NextApiResponse } from "next";
import { searchSpotifyPlaylists } from "../../../modules/spotify-theme/services/api";
import { scrapeYouTubePlaylistSearch } from "../../../utils/youtubeScraper";

// Genre-to-query mapping: produce high-quality playlist results for Thai genre keywords
const GENRE_QUERY_MAP: Record<string, string> = {
    "ลูกทุ่ง": "รวมเพลงลูกทุ่งยอดฮิต 100 ล้านวิว",
    "ลูกกรุง": "รวมเพลงลูกกรุง ฮิตตลอดกาล เพราะๆ",
    "เพื่อชีวิต": "รวมเพลงเพื่อชีวิต ฮิตตลอดกาล คาราบาว พงษ์สิทธิ์",
    "คันทรี": "เพลงคันทรี่ไทย ฮิต ลูกทุ่งอินเตอร์",
    "หมอลำ": "รวมเพลงหมอลำ ฮิต 2025 ยอดนิยม",
    "อีสาน": "รวมเพลงอีสาน ฮิต ยอดนิยม มาแรง",
    "ปักษ์ใต้": "รวมเพลงใต้ ยอดนิยม ฮิตตลอดกาล",
    "ป็อป": "เพลงป็อปไทย ฮิต 2025 T-Pop",
    "ป็อปร็อก": "เพลงป็อปร็อกไทย ฮิต รวมเพลงดัง",
    "ฮาร์ดร็อก": "เพลงร็อกไทย ฮาร์ดร็อก ยอดนิยม",
    "ร็อกแอนด์โรล": "เพลงร็อกไทย ร็อกแอนด์โรล ฮิต",
    "ริทึมแอนด์บลูส์": "เพลง R&B ไทย ฮิต ยอดนิยม"
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { q } = req.query;

    if (!q) {
        return res.status(400).json({ error: "Query 'q' is required" });
    }

    try {
        let searchQuery = q as string;

        // Use mapped query if available, otherwise enhance with keywords
        if (GENRE_QUERY_MAP[searchQuery]) {
            searchQuery = GENRE_QUERY_MAP[searchQuery];
        } else {
            const thaiGenreKeywords = ["ลูกทุ่ง", "ลูกกรุง", "เพื่อชีวิต", "หมอลำ", "อีสาน", "ปักษ์ใต้", "ร็อก", "ป็อป", "เพลงไทย"];
            if (thaiGenreKeywords.some(k => searchQuery.includes(k))) {
                if (!searchQuery.includes("ไทย")) searchQuery += " ไทย";
                if (!searchQuery.includes("ฮิต")) searchQuery += " ฮิต";
            }
        }

        console.log(`[API] Searching playlists for: ${searchQuery} (Page: ${req.query.page || 1})`);

        const page = Number(req.query.page) || 1;
        const limit = 20;
        const offset = (page - 1) * limit;

        let results: any[] = [];

        // 1. Try YouTube Scraper FIRST (More reliable for Thai genres)
        try {
            const ytResults = await scrapeYouTubePlaylistSearch(searchQuery);
            if (ytResults && ytResults.length > 0) {
                results = ytResults;
                console.log(`[API] YouTube scraper returned ${results.length} playlists for: ${searchQuery}`);
            }
        } catch (e) {
            console.warn("[API] YouTube scraper failed, trying Spotify...", e);
        }

        // 2. Fallback to Spotify if YouTube didn't work
        if (results.length === 0) {
            try {
                let spotifyResults: any[] = [];
                try {
                    spotifyResults = await searchSpotifyPlaylists(searchQuery, limit, offset);
                } catch (err) {
                    console.warn("Spotify Search Skipped/Failed:", err);
                }

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
                    console.log(`[API] Spotify search returned ${results.length} playlists`);
                }
            } catch (e) {
                console.warn("[API] Spotify Search failed:", e);
            }
        }

        if (results.length === 0) {
            return res.status(200).json([]);
        }

        return res.status(200).json(results);

    } catch (error: any) {
        console.error(`[API] Playlist search failed: ${error.message}`);
        return res.status(500).json({ error: "Failed to search playlists", details: error.message });
    }
}
