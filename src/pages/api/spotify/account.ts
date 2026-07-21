import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { getAccessToken } from "../../../services/spotifyAuth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const accessToken = await getAccessToken();
    if (!accessToken) {
      return res.status(401).json({ 
        status: "disconnected", 
        error: "No access token retrieved. Check your config." 
      });
    }

    const response = await axios.get("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    return res.status(200).json({
      status: "connected",
      user: {
        id: response.data.id,
        display_name: response.data.display_name,
        email: response.data.email,
        images: response.data.images,
        product: response.data.product
      }
    });

  } catch (error: any) {
    console.error("Spotify Status Check Failed:", error.response?.data || error.message);
    return res.status(200).json({ 
      status: "error", 
      error: error.response?.data?.error?.message || error.message,
      details: error.response?.data
    });
  }
}
