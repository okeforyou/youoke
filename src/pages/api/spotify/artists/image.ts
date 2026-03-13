import axios from "axios";
import { getAccessToken } from "../../../../modules/spotify-theme/services/auth";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ error: "Name parameter is required" });
  }

  try {
    const accessToken = await getAccessToken();

    // Clean name: "บอดี้สแลม (Bodyslam)" -> "Bodyslam" (prefer English for Spotify search as it's more reliable)
    // Actually, let's try Thai first, but clean it.
    let searchQuery = (name as string);
    if (searchQuery.includes('(')) {
        // Extract English part if exists, e.g. "บอดี้สแลม (Bodyslam)" -> "Bodyslam"
        const match = searchQuery.match(/\((.*?)\)/);
        if (match && match[1]) {
            searchQuery = match[1];
        } else {
            searchQuery = searchQuery.split('(')[0].trim();
        }
    }

    // Step 1: Search for artist to get their image
    const searchResponse = await axios.get("https://api.spotify.com/v1/search", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        q: searchQuery,
        type: "artist",
        limit: 1,
      },
    });

    const artist = searchResponse.data.artists.items[0];
    const imageUrl = artist?.images?.[0]?.url;

    if (imageUrl) {
      // Redirect to the actual Spotify image URL
      return res.redirect(imageUrl);
    } else {
      // Fallback to a placeholder if no image found
      return res.redirect("/assets/avatar.jpeg");
    }
  } catch (error) {
    console.error("❌ Artist Image API Error:", (error as Error).message);
    // Fallback on error
    return res.redirect("/assets/avatar.jpeg");
  }
}
