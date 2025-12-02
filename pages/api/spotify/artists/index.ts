import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

import { getAccessToken } from "../../../../services/spotify";
import { Artist, ArtistCategory, GetTopArtists } from "../../../../types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetTopArtists | { error: string }>
) {
  try {
    console.log('🎵 [API] Fetching top artists from Spotify...');
    const accessToken = await getAccessToken();
    console.log('✅ [API] Got Spotify access token:', accessToken ? 'Yes' : 'No');
    let artistList: Artist[] = [];
    let artistCategories: ArtistCategory[] = [];

    // Use Spotify's Top 50 - Thailand playlist (updates daily)
    // Alternative playlists for more variety:
    // - Top 50 - Thailand: 37i9dQZEVXbMnz8KAMyVOI
    // - Viral 50 - Thailand: 37i9dQZEVXbLjYEH7fRPUQ
    const playlistIds = [
      "37i9dQZEVXbMnz8KAMyVOI", // Top 50 - Thailand
      "37i9dQZEVXbLjYEH7fRPUQ", // Viral 50 - Thailand
    ];

    const artistsSet = new Set<string>();
    const artistsMap = new Map<string, { name: string; imageUrl: string }>();

    // Fetch artists from multiple trending playlists
    for (const playlistId of playlistIds) {
      try {
        console.log(`📡 [API] Fetching playlist: ${playlistId}`);
        const playlistResponse = await axios.get(
          `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            params: {
              limit: 50, // Get top 50 tracks
            },
          }
        );

        const tracks = playlistResponse.data.items;
        console.log(`📦 [API] Got ${tracks.length} tracks from playlist ${playlistId}`);

        for (const item of tracks) {
          const track = item?.track;
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
        }
        console.log(`✅ [API] Playlist ${playlistId} processed. Total unique artists: ${artistsMap.size}`);
      } catch (error) {
        console.error(`❌ [API] Error fetching playlist ${playlistId}:`, error.message);
        console.error(`❌ [API] Status:`, error.response?.status);
        console.error(`❌ [API] Data:`, error.response?.data);
        // Continue with other playlists
      }
    }

    artistList = Array.from(artistsMap.values()).slice(0, 12);

    console.log(`✅ [API] Found ${artistList.length} unique artists`);

    const artists: GetTopArtists = {
      status: "success",
      artist: artistList,
      artistCategories,
    };

    res.status(200).json(artists);
  } catch (error) {
    console.error('❌ [API] Error fetching top artists:', error.message);
    console.error('❌ [API] Full error:', error);
    res.status(500).json({ error: error.message });
  }
}
