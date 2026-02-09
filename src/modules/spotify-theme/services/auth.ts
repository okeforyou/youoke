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

  const config = await getSystemConfig();
  const { clientId, clientSecret, refreshToken } = config.integrations?.spotify || {};

  if (!refreshToken || !clientId || !clientSecret) {
    console.error("❌ Spotify credentials missing in System Config", {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      hasRefreshToken: !!refreshToken
    });
    throw new Error("No Spotify credentials configured (Check System Config or Environment Variables)");
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
