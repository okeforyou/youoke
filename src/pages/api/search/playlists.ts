import type { NextApiRequest, NextApiResponse } from "next";
import { searchSpotifyPlaylists } from "../../../modules/spotify-theme/services/api";
import { scrapeYouTubePlaylistSearch } from "../../../utils/youtubeScraper";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { q } = req.query;

    if (!q) {
        return res.status(400).json({ error: "Query 'q' is required" });
    }

    try {
        let searchQuery = q as string;
        // Optimization: Enhance query for better Thai music results if it's a genre or general term
        const thaiGenreKeywords = ["ลูกทุ่ง", "ลูกกรุง", "เพื่อชีวิต", "หมอลำ", "อีสาน", "ปักษ์ใต้", "ร็อก", "ป็อป", "เพลงไทย"];
        if (thaiGenreKeywords.some(k => searchQuery.includes(k))) {
            if (!searchQuery.includes("ไทย")) searchQuery += " ไทย";
            if (!searchQuery.includes("ฮิต")) searchQuery += " ฮิต";
        }

        console.log(`[API] Searching playlists for: ${searchQuery} (Page: ${req.query.page || 1})`);

        // Pagination
        const page = Number(req.query.page) || 1;
        const limit = 20;
        const offset = (page - 1) * limit;

        // 1. Try Spotify First (Spotitube V1 Logic)
        let results: any[] = [];
        try {
            let spotifyResults: any[] = [];
            try {
                // This calls the internal service which uses getAccessToken
                spotifyResults = await searchSpotifyPlaylists(searchQuery, limit, offset);
            } catch (err) {
                console.warn("Spotify Search Skipped/Failed:", err);
            }

            if (spotifyResults && Array.isArray(spotifyResults) && spotifyResults.length > 0) {
                results = spotifyResults
                    .filter((item: any) => item && item.id)
                    .map((item: any) => ({
                        playlistId: `sp-${item.id}`, // Mark as Spotify ID
                        title: item.name,
                        thumbnail: item.images?.[0]?.url || "",
                        author: item.owner?.display_name || "Spotify",
                        videoCount: item.tracks?.total?.toString() || "playlist"
                    }));
                console.log(`[API] Spotify search returned ${results.length} playlists`);
            }
        } catch (e) {
            console.warn("[API] Spotify Search failed, trying fallback...", e);
        }

        // 2. Fallback to YouTube Scraper if Spotify failed or empty
        if (results.length === 0) {
            console.log(`[API] Fallback: Searching YouTube for: ${searchQuery}`);
            const ytResults = await scrapeYouTubePlaylistSearch(searchQuery);
            results = ytResults;
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
