
const { scrapeYouTubeSearch } = require('../src/utils/youtubeScraper');

async function test() {
    const query = "PUN - DAY ONE karaoke";
    console.log(`Testing Scraper for: "${query}"`);
    try {
        const results = await scrapeYouTubeSearch(query);
        console.log(`Found ${results.length} results.`);
        if (results.length > 0) {
            console.log(JSON.stringify(results.slice(0, 3), null, 2));
        }
    } catch (e) {
        console.error("Scraper Failed:", e);
    }
}

test();
