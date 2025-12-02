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

  // Display the code for manual use in setup script
  return res.status(200).send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Spotify Authorization Code</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #f9fafb;
          }
          .container {
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          h1 { color: #1db954; margin-top: 0; }
          .code-box {
            background: #f3f4f6;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            word-break: break-all;
            font-family: 'Courier New', monospace;
            font-size: 14px;
          }
          .copy-btn {
            background: #1db954;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
          }
          .copy-btn:hover { background: #1ed760; }
          .instructions {
            background: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 15px;
            margin: 20px 0;
            text-align: left;
          }
          .success { color: #16a34a; margin-top: 10px; display: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✅ Spotify Authorization Successful!</h1>
          <div class="instructions">
            <strong>📋 Next Steps:</strong>
            <ol>
              <li>Copy the authorization code below</li>
              <li>Go back to your terminal (where script is running)</li>
              <li>Paste the code when prompted</li>
              <li>Press Enter to get your refresh token</li>
            </ol>
          </div>
          <p><strong>Your Authorization Code:</strong></p>
          <div class="code-box" id="code">${code}</div>
          <button class="copy-btn" onclick="copyCode()">📋 Copy Code</button>
          <p class="success" id="success">✅ Copied!</p>
          <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            ⚠️ Code expires in 10 minutes
          </p>
        </div>
        <script>
          function copyCode() {
            navigator.clipboard.writeText(document.getElementById('code').textContent).then(() => {
              document.getElementById('success').style.display = 'block';
              setTimeout(() => document.getElementById('success').style.display = 'none', 3000);
            });
          }
        </script>
      </body>
    </html>
  `);
}
