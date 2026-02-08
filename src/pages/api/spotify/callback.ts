import axios from 'axios'
import querystring from 'querystring'
import { getSystemConfig } from '../../../services/systemConfigService';
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { code, error } = req.query;

  if (error) {
    return res.status(400).send(`
      <!DOCTYPE html>
      <html><head><title>Error</title></head>
      <body style="font-family: system-ui; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center;">
        <h1 style="color: #dc2626;">❌ Authorization Failed</h1>
        <p>Error: ${error}</p>
      </body></html>
    `);
  }

  if (!code) {
    return res.status(400).send("Missing authorization code");
  }

  try {
    const config = await getSystemConfig();
    const { clientId, clientSecret } = config.integrations?.spotify || {};
    const redirectUri = process.env.SPOTIFY_REDIRECT_URI || "http://localhost:3000/api/spotify/callback"; // Fallback or needs config

    if (!clientId || !clientSecret) {
      throw new Error("Missing Spotify Credentials in System Config");
    }

    // Exchange Code for Tokens
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
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        },
      }
    );

    const { refresh_token, access_token } = response.data;

    // Display the Refresh Token for manual setup
    return res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Spotify Token Generated</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: system-ui; max-width: 800px; margin: 40px auto; padding: 20px; background: #f9fafb; text-align: center; }
              .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
              h1 { color: #1db954; margin-bottom: 20px; }
              .box { background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; word-break: break-all; font-family: monospace; border: 1px solid #e5e7eb; }
              .btn { background: #1db954; color: white; border: none; padding: 10px 20px; border-radius: 20px; cursor: pointer; font-weight: bold; text-decoration: none; display: inline-block; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>✅ Spotify Connected Successfully!</h1>
              <p>Here is your <strong>Refresh Token</strong>. Copy this and paste it into the <strong>Admin > Config > Integrations</strong> page.</p>
              
              <div class="box">${refresh_token}</div>
              
              <p style="color: #6b7280; font-size: 0.9em;">(Access Token was also generated but it expires quickly. The Refresh Token is what you need.)</p>
              
              <a href="/admin/config" class="btn">Go to Admin Config</a>
            </div>
          </body>
        </html>
      `);

  } catch (err: any) {
    console.error("Token Exchange Failed", err.response?.data || err.message);
    return res.status(500).send(`Token Exchange Failed: ${JSON.stringify(err.response?.data || err.message)}`);
  }
}

