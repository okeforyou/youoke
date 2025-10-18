// pages/api/login.ts
import type { NextApiRequest, NextApiResponse } from "next";

const clientId = process.env.SPOTIFY_CLIENT_ID!;
const redirectUri = process.env.SPOTIFY_REDIRECT_URI!;
const scopes = "playlist-read-private playlist-read-collaborative";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const authURL = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${encodeURIComponent(
    scopes
  )}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  res.redirect(authURL);
}
