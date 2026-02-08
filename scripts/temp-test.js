const https = require('https');

// ==========================================
// MOCK SCRAPER LOGIC (Copied & Simplified)
// ==========================================

function getRandomUserAgent() {
    return 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
}

function extractYtInitialData(html) {
    const scriptMatch = html.match(/var ytInitialData = ({.+?});/s);
    if (scriptMatch) return JSON.parse(scriptMatch[1]);
    const directMatch = html.match(/ytInitialData = ({.+?});/s);
    if (directMatch) return JSON.parse(directMatch[1]);
    return null;
}

function parseVideoResults(ytInitialData) {
    const results = [];
    const seenIds = new Set();

    const findVideos = (obj) => {
        if (!obj || typeof obj !== 'object') return;

        if (obj.videoRenderer) {
            const v = obj.videoRenderer;
            const videoId = v.videoId;
            if (videoId && !seenIds.has(videoId)) {
                seenIds.add(videoId);
                results.push({
                    title: v.title?.runs?.[0]?.text || v.title?.simpleText || 'Unknown',
                    id: videoId,
                    type: 'videoRenderer'
                });
            }
        }

        if (obj.lockupViewModel && obj.lockupViewModel.contentId) {
            const lvm = obj.lockupViewModel;
            const videoId = lvm.contentId;
            if (videoId && !seenIds.has(videoId)) {
                seenIds.add(videoId);
                results.push({
                    title: lvm.metadata?.lockupMetadataViewModel?.title?.content || 'Unknown',
                    id: videoId,
                    type: 'lockupViewModel'
                });
            }
        }

        if (Array.isArray(obj)) {
            for (const item of obj) findVideos(item);
        } else {
            for (const key of Object.keys(obj)) {
                findVideos(obj[key]);
            }
        }
    };

    const contentRoot = ytInitialData.contents || ytInitialData.onResponseReceivedCommands || ytInitialData;
    findVideos(contentRoot);
    return results;
}

async function scrape(query) {
    return new Promise((resolve, reject) => {
        const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
        console.log(`Fetching: ${url}`);

        https.get(url, {
            headers: {
                'User-Agent': getRandomUserAgent(),
                'Accept-Language': 'en-US,en;q=0.9,th;q=0.8',
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const html = data;
                console.log(`Body Length: ${html.length}`);

                // Debug: Check if blocked
                if (html.includes("Before you continue to YouTube")) {
                    console.log("❌ BLOCKED: Consent Page detected");
                }

                const ytInitialData = extractYtInitialData(html);
                if (!ytInitialData) {
                    console.log("❌ ytInitialData NOT FOUND");
                    // console.log(html.substring(0, 500)); 
                    resolve([]);
                    return;
                }

                const results = parseVideoResults(ytInitialData);
                resolve(results);
            });
        }).on('error', err => reject(err));
    });
}

// TEST RUN
(async () => {
    const query = "BOWKYLION Ft. Jeff Satur - ลามปาม karaoke";
    console.log(`Test Search: "${query}"`);
    const results = await scrape(query);
    console.log(`Found ${results.length} results`);
    results.slice(0, 5).forEach(r => console.log(`- [${r.type}] ${r.title} (${r.id})`));
})();
