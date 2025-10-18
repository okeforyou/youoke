import axios from 'axios'
import querystring from 'querystring'

import { storeTokensInMemory } from '../../../services/spotify'

import type { NextApiRequest, NextApiResponse } from "next";
const clientId = process.env.SPOTIFY_CLIENT_ID!;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;
const redirectUri = process.env.SPOTIFY_REDIRECT_URI!;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const code = req.query.code as string;

  if (!code) {
    return res.status(400).send("Missing authorization code");
  }

  try {
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      querystring.stringify({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: redirectUri,
      }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${Buffer.from(
            `${clientId}:${clientSecret}`
          ).toString("base64")}`,
        },
      }
    );

    const {
      access_token: newAccessToken,
      refresh_token: newRefreshToken,
      expires_in,
    } = response.data;

    // Store tokens in memory
    storeTokensInMemory(
      newAccessToken,
      newRefreshToken,
      Date.now() + expires_in * 1000
    );

    res.redirect("/"); // Redirect to a protected route or dashboard
  } catch (error) {
    console.error("Error exchanging code for tokens:", error);
    res.status(500).send("Authentication failed");
  }
}
