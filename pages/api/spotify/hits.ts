import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

import { getAccessToken } from "../../../services/spotify";
import { Single } from "../../../types";

/**
 * Get Trending Hits from Spotify Playlist
 *
 * Uses curated "Thailand Top 50" playlist
 * Updates automatically when playlist is updated
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const accessToken = await getAccessToken();
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

    console.log(`✅ Final hits list: ${topHits.length} songs`);

    const topics = {
      status: "success",
      singles: topHits,
    };

    res.status(200).json(topics);
  } catch (error) {
    console.error("❌ Error fetching trending hits:", error);
    res.status(500).json({ error: error.message });
  }
}
