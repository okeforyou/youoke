import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

import { getAccessToken } from "../../../modules/spotify-theme/services/auth";
import { Single } from "../../../types";

/**
 * Get Trending Hits from Spotify Playlist
 *
 * Uses curated "Thailand Top 50" playlist
 * Updates automatically when playlist is updated
 */
// Simple Cache Map for Hits
const hitsCache = { data: null as any, timestamp: 0 };
const CACHE_DURATION = 15 * 60 * 1000; // 15 Minutes

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check Cache
  if (hitsCache.data && Date.now() - hitsCache.timestamp < CACHE_DURATION) {
    console.log("⚡ Serving Trending Hits from Cache");
    return res.status(200).json(hitsCache.data);
  }

  try {
    const accessToken = await getAccessToken().catch((err) => {
      console.warn("⚠️ Spotify not configured or failed to get token:", err.message);
      return null;
    });

    if (!accessToken) {
      return res.status(200).json({ status: "success", singles: [] });
    }

    console.log("✅ Got access token for hits:", accessToken.substring(0, 20) + "...");

    const topHits: Single[] = [];

    // Use "Thailand Top 50" playlist - user-curated, regularly updated
    // Alternative: "Thai Charts - TOP 50 Thai only" (6JCfbfqPJMWkg7LpMFHmKF)
    const playlistId = "3oLUwlQTdzsCkTK72wCbv9";

    console.log(`🎵 Fetching playlist: ${playlistId}`);
    const playlistResponse = await axios.get(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const tracks = playlistResponse.data.items;
    console.log(`📊 Got ${tracks.length} tracks from Thailand Top 50 playlist`);

    // Helper function to check if text contains Thai characters
    const hasThaiCharacters = (text: string) => {
      return /[\u0E00-\u0E7F]/.test(text);
    };

    for (const item of tracks) {
      if (!item?.track) continue;

      const track = item.track;
      const trackName = track.name || "";
      const artistName = track.artists[0]?.name || "";

      // Filter: Only include tracks with Thai characters in title OR artist name
      if (!hasThaiCharacters(trackName) && !hasThaiCharacters(artistName)) {
        console.log(`⏭️  Skipping non-Thai track: ${trackName} - ${artistName}`);
        continue;
      }

      topHits.push({
        title: trackName,
        artist_name: artistName,
        coverImageURL: track.album?.images?.[0]?.url || "",
      });
    }

    // --- Fallback if Spotify returns nothing or fails ---
    if (topHits.length === 0) {
      console.log("⚠️ Spotify hits empty, falling back to YouTube scraper...");
      try {
        const { scrapeYouTubeSearch } = await import("../../../utils/youtubeScraper");
        const ytResults = await scrapeYouTubeSearch("เพลงไทยฮิตล่าสุด 2025");
        if (ytResults && ytResults.length > 0) {
          for (const item of ytResults.slice(0, 30)) {
            topHits.push({
              title: item.title,
              artist_name: item.author || "YouTube",
              coverImageURL: item.videoThumbnails?.[0]?.url || item.videoThumbnails?.[1]?.url || ""
            });
          }
        }
      } catch (ytErr) {
        console.error("YouTube fallback failed too:", ytErr);
      }
    }

    console.log(`✅ Final hits list: ${topHits.length} songs`);

    const topics = {
      status: "success",
      singles: topHits,
    };

    // Cache results
    hitsCache.data = topics;
    hitsCache.timestamp = Date.now();

    res.status(200).json(topics);
  } catch (error) {
    console.error("❌ Error fetching trending hits:", error);
    // Even on error, try to return YouTube fallback if possible
    res.status(200).json({ status: "success", singles: [] });
  }
}
