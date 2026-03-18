import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { getAccessToken } from "../../../modules/spotify-theme/services/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return res.status(401).json({ error: "Spotify not configured" });
    }

    const { limit = 50, offset = 0 } = req.query;

    const response = await axios.get("https://api.spotify.com/v1/me/playlists", {
      params: { limit, offset },
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    return res.status(200).json(response.data);

  } catch (error: any) {
    console.error("Fetch Spotify Playlists Failed:", error.response?.data || error.message);
    return res.status(500).json({ error: "Failed to fetch Spotify playlists" });
  }
}
