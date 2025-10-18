import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

import { getAccessToken } from "../../../services/spotify";
import { Single } from "../../../types";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const accessToken = await getAccessToken();

  try {
    //   const response = await axios.get(
    //     "https://api.spotify.com/v1/browse/categories/toplists/playlists",
    //     {
    //       headers: {
    //         Authorization: `Bearer ${accessToken}`,
    //       },
    //       params: {
    //         country: "TH", // Thailand
    //       },
    //     }
    //   );

    //   const playlists = response.data.playlists.items;
    //   console.log(playlists);
    const playlistId = "4jn7rUR7AyqLFnAnHkkbfg";

    const topHits: Single[] = [];

    const playlistResponse = await axios.get(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const tracks = playlistResponse.data.items;

    for (const item of tracks) {
      const track = item.track;

      topHits.push({
        title: track.name,
        artist_name: track.artists[0].name,
        coverImageURL: track.album.images[0]?.url || "",
      });
    }

    const topics = {
      status: "success",
      singles: topHits,
    };

    res.status(200).json(topics);
  } catch (error) {
    // console.log(error);

    res.status(500).json({ error: error.message });
  }
}
