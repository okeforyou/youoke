import type { NextApiRequest, NextApiResponse } from "next";

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

  res.status(200).json(envCheck);
}
