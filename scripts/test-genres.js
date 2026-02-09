const axios = require('axios');
const querystring = require('querystring');

// Credentials from vercel-env-vars.txt
const clientId = "be495e578f89486e9d3c8ca7be1b1e27";
const clientSecret = "c880a42058e2464bbd6f38674cfc59cd";
const refreshToken = "AQBuGQQHMN3x2wlVfz87Rr01MFWFrXejHWZ50r_5A6GXDV9Sqbx_exIw8CsDizASS36jcSWaMfgaHact5ii0u-i2Leh98MfeNwIwG_T6w1SuKfOOolLmgW-tkDH9i_gKOHo";

const featuredPlaylists = [
    { id: "37i9dQZF1DX2L0iB23Enbq", name: "ลูกทุ่ง 100 ล้านวิว" },
    { id: "37i9dQZF1DXa2SPUyWl8Y5", name: "GMM Grammy" },
    { id: "37i9dQZF1DX3XlBkCi835s", name: "T-Pop" },
    { id: "37i9dQZF1DWZtZ8vUCzXqi", name: "เพลงฮิตยุค 2000" },
    { id: "37i9dQZF1DX0t34Gq8hZba", name: "เพลงใหม่ล่าสุด" }
];

async function run() {
    console.log("🚀 Testing Genre Playlists...");

    try {
        console.log("🔑 Requesting Access Token...");
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
        console.log("✅ Access Token Obtained");

        console.log("\n🧪 Testing Existing IDs:");
        for (const playlist of featuredPlaylists) {
            try {
                await axios.get(`https://api.spotify.com/v1/playlists/${playlist.id}?fields=id,name`, {
                    headers: { Authorization: `Bearer ${accessToken}` },
                    params: { market: 'TH' }
                });
                console.log(`✅ [OK] ${playlist.name} (${playlist.id})`);
            } catch (err) {
                console.log(`❌ [FAIL] ${playlist.name} (${playlist.id}): ${err.response?.status} ${err.response?.data?.error?.message}`);

                // If failed, SEARCH for a replacement
                console.log(`   🔎 Searching replacement for: ${playlist.name}...`);
                try {
                    const searchRes = await axios.get(`https://api.spotify.com/v1/search`, {
                        headers: { Authorization: `Bearer ${accessToken}` },
                        params: { q: playlist.name, type: 'playlist', limit: 3, market: 'TH' }
                    });

                    const items = searchRes.data.playlists.items.filter(i => i !== null);
                    if (items.length > 0) {
                        console.log(`   ✨ Found replacement: "${items[0].name}" -> ID: ${items[0].id}`);
                    } else {
                        console.log(`   ⚠️ No replacement found.`);
                    }
                } catch (searchErr) {
                    console.log(`   ⚠️ Search failed: ${searchErr.message}`);
                }
            }
        }

    } catch (error) {
        console.error("❌ Fatal Error:", error.message);
    }
}

run();
