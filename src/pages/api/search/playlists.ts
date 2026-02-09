import type { NextApiRequest, NextApiResponse } from "next";
import { searchSpotifyPlaylists } from "../../../modules/spotify-theme/services/api";
import { scrapeYouTubePlaylistSearch } from "../../../utils/youtubeScraper";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { q } = req.query;

    if (!q) {
        return res.status(400).json({ error: "Query 'q' is required" });
    }

    try {
        console.log(`[API] Searching playlists via Spotify API for: ${q} (Page: ${req.query.page || 1})`);

        // Pagination
        const page = Number(req.query.page) || 1;
        const limit = 20;
        const offset = (page - 1) * limit;

        // 1. YouTube Scraper (Primary Source for Reliability)
        let results = await scrapeYouTubePlaylistSearch(q as string);

        // 2. Spotify Fallback (Optional/Legacy check)
        // If scraper fails (empty), we *could* try Spotify, but since Spotify Auth is broken...
        // let's just stick to YouTube for now to ensure consistency.
        if (results.length === 0) {
            console.warn(`[API] Scraper returned 0 playlists for '${q}'.`);
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
