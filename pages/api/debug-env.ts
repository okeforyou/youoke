import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import querystring from "querystring";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Check which environment variables are set
  const envCheck = {
    hasSpotifyClientId: !!process.env.SPOTIFY_CLIENT_ID,
    hasSpotifyClientSecret: !!process.env.SPOTIFY_CLIENT_SECRET,
    hasSpotifyRefreshToken: !!process.env.SPOTIFY_REFRESH_TOKEN,
    hasInvidiousUrl: !!process.env.NEXT_PUBLIC_INVIDIOUS_URL,
    spotifyClientIdLength: process.env.SPOTIFY_CLIENT_ID?.length || 0,
    spotifyRefreshTokenLength: process.env.SPOTIFY_REFRESH_TOKEN?.length || 0,
    invidiousUrl: process.env.NEXT_PUBLIC_INVIDIOUS_URL,
  };

  // Try to get access token
  let spotifyTest: any = {
    success: false,
    error: null,
  };

  try {
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      querystring.stringify({
        grant_type: "refresh_token",
        refresh_token: process.env.SPOTIFY_REFRESH_TOKEN,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
          ).toString("base64")}`,
        },
      }
    );

    spotifyTest.success = true;
    spotifyTest.hasAccessToken = !!response.data.access_token;
    spotifyTest.expiresIn = response.data.expires_in;
  } catch (error: any) {
    spotifyTest.error = error.response?.data || error.message;
    spotifyTest.statusCode = error.response?.status;
  }

  res.status(200).json({ envCheck, spotifyTest });
}
