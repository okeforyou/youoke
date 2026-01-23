/**
 * YouTube Direct Scraper (Robust Deep Search Edition)
 * Backported from play.youoke on 2026-01-23
 *
 * Features:
 * - Deep Recursive Search (Finds videos despite HTML changes)
 * - Consent Bypass (Cookies)
 * - Optimized Thumbnails
 */

export interface YouTubeScraperResult {
    videoId: string;
    title: string;
    author?: string;
    authorId?: string;
    videoThumbnails: Array<{
        quality: string;
        url: string;
        width: number;
        height: number;
    }>;
}

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
];

function getRandomUserAgent(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function extractYtInitialData(html: string): any {
    // Method 1: Try to find ytInitialData in script tags
    const scriptMatch = html.match(/var ytInitialData = ({.+?});/s);
    if (scriptMatch && scriptMatch[1]) {
        try { return JSON.parse(scriptMatch[1]); } catch (e) { }
    }

    // Method 2: Try window["ytInitialData"] format
    const windowMatch = html.match(/window\["ytInitialData"\] = ({.+?});/s);
    if (windowMatch && windowMatch[1]) {
        try { return JSON.parse(windowMatch[1]); } catch (e) { }
    }

    // Method 3: Try ytInitialData = format (without var)
    const directMatch = html.match(/ytInitialData = ({.+?});/s);
    if (directMatch && directMatch[1]) {
        try { return JSON.parse(directMatch[1]); } catch (e) { }
    }

    return null;
}

function constructThumbnails(videoId: string) {
    return [
        { quality: 'maxres', url: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`, width: 1280, height: 720 },
        { quality: 'high', url: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`, width: 480, height: 360 },
        { quality: 'medium', url: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`, width: 320, height: 180 },
        { quality: 'default', url: `https://i.ytimg.com/vi/${videoId}/default.jpg`, width: 120, height: 90 },
    ];
}

function parseVideoResults(ytInitialData: any): YouTubeScraperResult[] {
    try {
        const results: YouTubeScraperResult[] = [];
        const seenIds = new Set<string>();

        // Deep Recursive Finder
        const findVideos = (obj: any) => {
            if (!obj || typeof obj !== 'object') return;

            // 1. Standard Video Renderer
            if (obj.videoRenderer) {
                const v = obj.videoRenderer;
                if (v.videoId && !seenIds.has(v.videoId)) {
                    seenIds.add(v.videoId);
                    // Optional: Skip ads if isAd is present (usually boolean or object)
                    if (v.isAd) return;

                    results.push({
                        videoId: v.videoId,
                        title: v.title?.runs?.[0]?.text || v.title?.simpleText || 'Unknown',
                        author: v.ownerText?.runs?.[0]?.text || v.shortBylineText?.runs?.[0]?.text || 'Unknown',
                        videoThumbnails: constructThumbnails(v.videoId)
                    });
                }
            }

            // 2. LockupViewModel (New UI)
            if (obj.lockupViewModel && obj.lockupViewModel.contentId) {
                const lvm = obj.lockupViewModel;
                const videoId = lvm.contentId;
                if (videoId && !seenIds.has(videoId)) {
                    seenIds.add(videoId);
                    results.push({
                        videoId: videoId,
                        title: lvm.metadata?.lockupMetadataViewModel?.title?.content || 'Unknown',
                        author: lvm.metadata?.lockupMetadataViewModel?.metadata?.content || 'Unknown',
                        videoThumbnails: constructThumbnails(videoId)
                    });
                }
            }

            // Recursion
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
    } catch (error) {
        console.error('Error parsing video results:', error);
        return [];
    }
}

function filterAndSortResults(results: YouTubeScraperResult[]): YouTubeScraperResult[] {
    const barWords = ['full album', 'album playlist', 'full playlist'];

    return results.sort((a, b) => {
        const aContainsBarWords = barWords.some(word =>
            a.title.toLowerCase().includes(word)
        );
        const bContainsBarWords = barWords.some(word =>
            b.title.toLowerCase().includes(word)
        );

        // Put full albums/playlists at the end
        if (aContainsBarWords && !bContainsBarWords) return 1;
        if (!aContainsBarWords && bContainsBarWords) return -1;
        return 0;
    });
}

/**
 * Main scraping function (New Robust Version)
 */
export async function scrapeYouTubeSearch(
    query: string,
    timeout: number = 8000
): Promise<YouTubeScraperResult[]> {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://www.youtube.com/results?search_query=${encodedQuery}`;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
            headers: {
                'User-Agent': getRandomUserAgent(),
                'Accept-Language': 'en-US,en;q=0.9,th;q=0.8',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Cookie': 'CONSENT=YES+cb.20210328-17-p0.en+FX+417; SOCS=CAESEwgDEgk1NzY3NDIwMzQaAmVuIAEaBgiA_LyaBg;',
            },
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`YouTube returned status ${response.status}`);
        }

        const html = await response.text();
        const ytInitialData = extractYtInitialData(html);

        if (!ytInitialData) {
            // Check if blocked
            if (html.includes("Before you continue") || html.includes("captcha")) {
                throw new Error("Consent/Captcha Blocked");
            }
            throw new Error('Could not find ytInitialData in YouTube HTML');
        }

        const results = parseVideoResults(ytInitialData);

        if (results.length === 0) {
            throw new Error('No video results found in YouTube data (Structure might have changed)');
        }

        const filteredResults = filterAndSortResults(results);
        console.log(`[YouTube Scraper] Found ${filteredResults.length} results for: ${query}`);

        return filteredResults;

    } catch (error: any) {
        if (error.name === 'AbortError') {
            throw new Error(`YouTube scraping timed out after ${timeout}ms`);
        }
        console.error(`[Scraper Error] ${error.message}`);
        throw error;
    }
}

/**
 * Maintain backward compatibility for existing calls, but use new logic
 */
export async function scrapeYouTubeSearchWithRetry(
    query: string,
    maxRetries: number = 2,
    timeout: number = 8000
): Promise<YouTubeScraperResult[]> {
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await scrapeYouTubeSearch(query, timeout);
        } catch (error: any) {
            lastError = error;
            console.error(`[YouTube Scraper] Attempt ${i + 1}/${maxRetries} failed`);

            // Exponential backoff
            if (i < maxRetries - 1) {
                const delay = Math.min(1000 * Math.pow(2, i), 3000);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    throw lastError || new Error('YouTube scraping failed after retries');
}
