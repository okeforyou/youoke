import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

import { getAccessToken } from "../../../../services/spotify";
import { Artist, ArtistCategory, GetTopArtists } from "../../../../types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetTopArtists | { error: string }>
) {
  try {
    const accessToken = await getAccessToken();
    let artistList: Artist[] = [];
    let artistCategories: ArtistCategory[] = [];

    const playlistId = "4jn7rUR7AyqLFnAnHkkbfg";

    // Fetching the specific playlist by ID
    const playlistResponse = await axios.get(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const tracks = playlistResponse.data.items;

    const topHits = new Set<{ name: string; imageUrl: string }>();

    for (const item of tracks) {
      const track = item.track;

      topHits.add({
        name: track.artists[0].name,
        imageUrl: track.album.images[0]?.url || "",
      });
    }

    artistList = Array.from(topHits).slice(0, 12);

    const artists: GetTopArtists = {
      status: "success",
      artist: artistList,
      artistCategories,
    };

    res.status(200).json(artists);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
