import axios from 'axios'
import querystring from 'querystring'
import { getSystemConfig } from '../../../services/systemConfigService';

let accessToken: string | null = null;
let tokenExpiry: number | null = null;

// Removed hardcoded process.env values here, fetched in function

const getAccessToken = async () => {
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  let clientId, clientSecret, refreshToken;

  // Server-Side: Use Admin SDK to fetch sensitive config securely
  if (typeof window === 'undefined') {
    try {
      const { adminFirestore } = await import('../../../firebase-admin');
      if (adminFirestore) {
        const docSnap = await adminFirestore.collection('settings').doc('default').get();

        if (docSnap.exists) {
          const data = docSnap.data();
          const spotifyConfig = data?.integrations?.spotify || {};
          clientId = spotifyConfig.clientId;
          clientSecret = spotifyConfig.clientSecret;
          refreshToken = spotifyConfig.refreshToken;
          console.log("🔐 [SpotifyAuth] Fetched credentials via Admin SDK");
        }
      }
    } catch (adminErr) {
      console.warn("⚠️ [SpotifyAuth] Failed to fetch via Admin SDK:", adminErr);
    }
  } else {
    // Client-Side: Cannot securely fetch secrets.
    console.error("❌ [SpotifyAuth] Attempting to get access token on client-side (Unsafe/Impossible)");
    throw new Error("Spotify Access Token retrieval is Server-Side only");
  }

  // 🛡️ Fallback: If Firestore/Config has missing/empty values, try process.env directly
  if (!clientId) clientId = process.env.SPOTIFY_CLIENT_ID;
  if (!clientSecret) clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!refreshToken) refreshToken = process.env.SPOTIFY_REFRESH_TOKEN;

  console.log("🔐 [SpotifyAuth] Credentials Check:", {
    source: "AdminSDK/Env",
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret,
    hasRefreshToken: !!refreshToken
  });

  if (!refreshToken || !clientId || !clientSecret) {
    console.error("❌ Spotify credentials missing in System Config & Env", {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      hasRefreshToken: !!refreshToken
    });
    // Don't throw immediately, let the API handle the lack of token
    return null;
  }

  try {
    const response = await axios.post(
      "https://accounts.spotify.com/api/token",
      querystring.stringify({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
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

    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + response.data.expires_in * 1000;

    return accessToken;
  } catch (error: any) {
    console.error("Error refreshing access token:", error.response?.data || error.message);
    throw new Error(`Failed to refresh token: ${JSON.stringify(error.response?.data || error.message)}`);
  }
};


export { getAccessToken };

export const isSpotifyConfigured = async (): Promise<boolean> => {
  try {
    const config = await getSystemConfig();
    const { clientId, clientSecret, refreshToken } = config.integrations?.spotify || {};
    return !!(clientId && clientSecret && refreshToken);
  } catch (e) {
    return false;
  }
};
