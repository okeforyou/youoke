const axios = require('axios');
const querystring = require('querystring');

// Credentials from vercel-env-vars.txt
const clientId = "be495e578f89486e9d3c8ca7be1b1e27";
const clientSecret = "c880a42058e2464bbd6f38674cfc59cd";
const refreshToken = "AQBuGQQHMN3x2wlVfz87Rr01MFWFrXejHWZ50r_5A6GXDV9Sqbx_exIw8CsDizASS36jcSWaMfgaHact5ii0u-i2Leh98MfeNwIwG_T6w1SuKfOOolLmgW-tkDH9i_gKOHo";

async function run() {
    console.log("🚀 Testing Spotify Integration...");

    // 1. Auth Message
    try {
        console.log("🔑 1. Requesting Access Token...");
        const tokenResponse = await axios.post(
            "https://accounts.spotify.com/api/token",
            querystring.stringify({
                grant_type: "refresh_token",
                refresh_token: refreshToken,
            }),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
                },
            }
        );

        const accessToken = tokenResponse.data.access_token;
        console.log("✅ Access Token Obtained:", accessToken.substring(0, 20) + "...");

        try {
            const me = await axios.get("https://api.spotify.com/v1/me", {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            console.log("👤 Authenticated As:", me.data.id, me.data.display_name, me.data.country);
        } catch (err) {
            console.warn("⚠️ Could not fetch profile (Client Creds flow?):", err.message);
        }

        // 2. Search for Playlist (to find valid ID)
        console.log("🎵 2. Searching for Playlist 'Pop'...");

        const searchResponse = await axios.get(`https://api.spotify.com/v1/search`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: { q: 'Pop', type: 'playlist', limit: 5, market: 'TH' }
        });

        console.log("Search Response Structure:", JSON.stringify(searchResponse.data, null, 2));

        const playlists = searchResponse.data.playlists.items;
        console.log(`✅ Found ${playlists.length} playlists:`);

        playlists.forEach((p, index) => {
            if (p) {
                console.log(`- [${index}] ${p.name} (ID: ${p.id}) by ${p.owner.display_name}`);
            } else {
                console.log(`- [${index}] NULL ITEM`);
            }
        });

        if (playlists.length > 0 && playlists[0]) {
            const firstId = playlists[0].id;
            console.log(`\n🎵 3. Fetching First Playlist (${firstId})...`);
            const playlistResponse = await axios.get(`https://api.spotify.com/v1/playlists/${firstId}/tracks`, {
                headers: { Authorization: `Bearer ${accessToken}` },
                params: { limit: 5, market: 'TH' }
            });
            console.log(`✅ Success! Found ${playlistResponse.data.items.length} tracks in ${playlists[0].name}`);
        } else {
            console.error("❌ No valid playlists found.");
        }

    } catch (error) {
        console.error("❌ Test Failed:");
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error("Data:", JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
    }
}

run();
