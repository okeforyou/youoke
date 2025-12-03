import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

import { getAccessToken } from "../../../services/spotify";
import { Single } from "../../../types";

/**
 * Get Trending Hits from Spotify Search
 *
 * Uses Spotify Search API to find currently trending Thai songs
 * Updates dynamically based on real-time popularity
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const accessToken = await getAccessToken();
    console.log("✅ Got access token for hits:", accessToken.substring(0, 20) + "...");

    const topHits: Single[] = [];
    const trackSet = new Set<string>(); // Prevent duplicates

    // Search for trending Thai songs using multiple popular queries
    const searchQueries = [
      "ฮิต 2025", // Hit 2025
      "viral ไทย", // Viral Thai
      "เพลงใหม่", // New songs
      "trending thai", // Trending Thai
    ];

    for (const query of searchQueries) {
      try {
        console.log(`🔍 Searching for hits: ${query}`);
        const searchResponse = await axios.get(
          `https://api.spotify.com/v1/search`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            params: {
              q: query,
              type: "track",
              market: "TH", // Thailand market for local trending
              limit: 50,
            },
          }
        );

        const tracks = searchResponse.data.tracks?.items || [];
        console.log(`📊 Got ${tracks.length} tracks for query "${query}"`);

        for (const track of tracks) {
          if (!track || !track.name || !track.artists?.[0]) continue;

          const trackKey = `${track.name}-${track.artists[0].name}`;

          // Skip duplicates
          if (trackSet.has(trackKey)) continue;

          trackSet.add(trackKey);
          topHits.push({
            title: track.name,
            artist_name: track.artists[0].name,
            coverImageURL: track.album?.images?.[0]?.url || "",
          });

          // Stop if we have enough songs
          if (topHits.length >= 30) break;
        }

        // Stop if we have enough songs
        if (topHits.length >= 30) break;
      } catch (error) {
        console.error(`❌ Error searching for "${query}":`, error.message);
        // Continue with other searches
      }
    }

    console.log(`✅ Final hits list: ${topHits.length} songs`);

    const topics = {
      status: "success",
      singles: topHits.slice(0, 24), // Return top 24 trending hits
    };

    res.status(200).json(topics);
  } catch (error) {
    console.error("❌ Error fetching trending hits:", error);
    res.status(500).json({ error: error.message });
  }
}
