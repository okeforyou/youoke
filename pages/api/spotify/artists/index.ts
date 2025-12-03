import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

import { getAccessToken } from "../../../../services/spotify";
import { Artist, ArtistCategory, GetTopArtists } from "../../../../types";

/**
 * Get Top Artists from Spotify Search
 *
 * Uses Spotify Search API to find trending Thai artists
 * Updates dynamically based on search popularity
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetTopArtists | { error: string }>
) {
  try {
    const accessToken = await getAccessToken();
    console.log("✅ Got access token:", accessToken.substring(0, 20) + "...");
    let artistList: Artist[] = [];
    let artistCategories: ArtistCategory[] = [];

    // Use Spotify Search API for popular Thai artists
    // Search for popular Thai music terms to find trending artists
    const searchQueries = [
      "ไทย", // Thai
      "ลูกทุ่ง", // Luk Thung
      "ป๊อป", // Pop
      "แร็พ", // Rap
    ];

    const artistsSet = new Set<string>();
    const artistsMap = new Map<string, { name: string; imageUrl: string }>();

    // Search for popular Thai tracks
    for (const query of searchQueries) {
      try {
        console.log(`🔍 Searching for: ${query}`);
        const searchResponse = await axios.get(
          `https://api.spotify.com/v1/search`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            params: {
              q: query,
              type: "track",
              market: "TH", // Thailand market
              limit: 50,
            },
          }
        );

        const tracks = searchResponse.data.tracks?.items || [];
        console.log(`📊 Got ${tracks.length} tracks for query "${query}"`);

        for (const track of tracks) {
          if (!track || !track.artists || !track.artists[0]) continue;

          const artistName = track.artists[0].name;
          const artistImage = track.album?.images?.[0]?.url || "";

          // Store unique artists with their image
          if (!artistsSet.has(artistName) && artistImage) {
            artistsSet.add(artistName);
            artistsMap.set(artistName, {
              name: artistName,
              imageUrl: artistImage,
            });
          }

          // Stop if we have enough artists
          if (artistsMap.size >= 20) break;
        }

        // Stop if we have enough artists
        if (artistsMap.size >= 20) break;
      } catch (error) {
        console.error(`❌ Error searching for "${query}":`, error.message);
        console.error(`Error details:`, error.response?.data || error);
        // Continue with other searches
      }
    }

    artistList = Array.from(artistsMap.values()).slice(0, 12);
    console.log(`✅ Final artist list: ${artistList.length} artists`);

    const artists: GetTopArtists = {
      status: "success",
      artist: artistList,
      artistCategories,
    };

    res.status(200).json(artists);
  } catch (error) {
    console.error("Error fetching top artists:", error);
    res.status(500).json({ error: error.message });
  }
}
