import axios from "axios";

import { OKE_PLAYLIST } from "../../../const/common";
import { getAccessToken } from "../../../services/spotify";
import { SearchPlaylists } from "../../../types";

import type { NextApiRequest, NextApiResponse } from "next";
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SearchPlaylists | { error: string }>
) {
  try {
    const accessToken = await getAccessToken();
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: "Query parameter is required" });
    }
    let artistCategories = [];

    if (OKE_PLAYLIST === query) {
      const playlistResponse = await axios.get(
        "https://api.spotify.com/v1/users/31dt6lomfdeam2r24mfy6chevmoe/playlists?offset=0&limit=50&locale=th",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      artistCategories = playlistResponse.data.items
        .filter((item) => !!item)
        .map((playlist: any, index: number) => ({
          tag_id: playlist.id,
          tag_name: playlist.name,
          imageUrl: playlist.images[0]?.url || "",
        }));
    } else {
      // Step 1: Search for playlists
      const searchResponse = await axios.get(
        "https://api.spotify.com/v1/search",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            q: query,
            type: "playlist",
            limit: 20,
          },
        }
      );

      artistCategories = searchResponse.data.playlists.items
        .filter((item) => !!item)
        .map((playlist: any, index: number) => ({
          tag_id: playlist.id,
          tag_name: playlist.name,
          imageUrl: playlist.images[0]?.url || "",
        }));
    }

    const response: SearchPlaylists = {
      status: "success",
      artistCategories,
    };

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
