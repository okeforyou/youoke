import type { NextApiRequest, NextApiResponse } from "next";
import { getSystemConfig } from "../../../services/systemConfigService";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const config = await getSystemConfig();
  const clientId = config.integrations?.spotify?.clientId;

  // Determine redirect URI dynamically or fallback
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host;
  const redirectUri = `${protocol}://${host}/api/spotify/callback`;

  const scopes = "playlist-read-private playlist-read-collaborative";

  if (!clientId) {
    return res.status(500).send("Spotify Client ID not configured in Admin Settings");
  }

  const authURL = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${encodeURIComponent(
    scopes
  )}&redirect_uri=${encodeURIComponent(redirectUri)}`;

  res.redirect(authURL);
}
