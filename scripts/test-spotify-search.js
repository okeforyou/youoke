const axios = require('axios');

const CLIENT_ID = 'be495e578f89486e9d3c8ca7be1b1e27';
const CLIENT_SECRET = 'c880a42058e2464bbd6f38674cfc59cd';

async function getToken() {
    try {
        const res = await axios.post('https://accounts.spotify.com/api/token',
            new URLSearchParams({ 'grant_type': 'client_credentials' }), {
            headers: {
                'Authorization': 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        return res.data.access_token;
    } catch (e) {
        console.error("Token Error:", e.message);
        process.exit(1);
    }
}

async function testSearch() {
    try {
        const token = await getToken();
        console.log("Got Token");

        const queries = [
            "GMM Grammy Hits",
            "Thailand Top 50",
            "ลูกทุ่ง 100 ล้านวิว",
            "เพลงแดนซ์",
            "เพลงร้านกาแฟ",
            "เพลงเศร้า",
            "เพลงยุค 90",
            "เพื่อชีวิต"
        ];

        for (const q of queries) {
            console.log(`\nSearching: "${q}"`);
            try {
                const res = await axios.get(`https://api.spotify.com/v1/search`, {
                    params: { q: q, type: 'playlist', limit: 3 },
                    headers: { Authorization: `Bearer ${token}` }
                });
                const items = res.data.playlists.items;
                console.log(`Found: ${items.length} playlists`);
                if (items.length > 0) {
                    console.log(`   Top Result: ${items[0].name} (by ${items[0].owner.display_name})`);
                } else {
                    console.log(`   ❌ NO RESULTS`);
                }
            } catch (err) {
                console.log(`   ❌ ERROR: ${err.message}`);
            }
        }

    } catch (e) {
        console.error("Error:", e.response ? e.response.data : e.message);
    }
}

testSearch();
