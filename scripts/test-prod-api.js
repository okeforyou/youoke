const axios = require('axios');

async function testProd() {
    const url = 'https://playyouoke.vercel.app/api/search/playlists?q=GMM Grammy Hits';
    console.log(`Testing: ${url}`);

    try {
        const res = await axios.get(url);
        console.log("Status:", res.status);
        console.log("Data Length:", res.data.length);
        console.log("First Item:", res.data[0]);
    } catch (e) {
        console.error("Error:", e.message);
        if (e.response) {
            console.error("Response Data:", e.response.data);
            console.error("Response Status:", e.response.status);
        }
    }
}

testProd();
