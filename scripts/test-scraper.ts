
// Run with: npx ts-node scripts/test-scraper.ts

import { scrapeMusicExplore, scrapeYouTubePlaylistSearch, scrapeYouTubeSearch } from '../src/utils/youtubeScraper';

async function test() {
    console.log("Testing scrapeMusicExplore...");
    try {
        const sections = await scrapeMusicExplore();
        console.log("Explore Sections found:", sections.length);
        sections.slice(0, 2).forEach((s: any) => {
            console.log(`- ${s.title}: ${s.items.length} items`);
        });
    } catch (e: any) {
        // console.error("scrapeMusicExplore Failed:", e.message);
        console.log("Skipping Explore test");
    }

    console.log("\nTesting scrapeYouTubeSearch (Karaoke)...");
    const kQueries = [
        "BOWKYLION Ft. Jeff Satur - ลามปาม karaoke",
        "ผู้บ่าวเสื้อปุ๋ย - ดิด คิตตี้ karaoke"
    ];

    for (const q of kQueries) {
        try {
            console.log(`Searching: "${q}"...`);
            const results = await scrapeYouTubeSearch(q);
            console.log(`✅ Found ${results.length} results.`);
            results.slice(0, 2).forEach((r: any) => {
                console.log(`   - ${r.title} (${r.videoId})`);
            });
        } catch (e: any) {
            console.error(`❌ Search Failed for "${q}":`, e.message);
        }
    }
}

test();
