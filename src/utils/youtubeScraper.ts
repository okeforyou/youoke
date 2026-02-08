/**
 * YouTube Direct Scraper (Inspired by bemusic)
 *
 * This scraper fetches YouTube search results by directly scraping youtube.com
 * instead of relying on unstable Invidious instances.
 *
 * FREE, UNLIMITED, and MORE STABLE than Invidious!
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

export interface MusicSection {
  title: string;
  items: YouTubePlaylistResult[];
}

/**
 * Scrape YouTube Music Destination (Feed)
 * URL: https://www.youtube.com/feed/music
 */
/**
 * Scrape YouTube Music Destination (Feed)
 * URL: https://www.youtube.com/feed/music
 */
export async function scrapeMusicExplore(
  timeout: number = 10000
): Promise<MusicSection[]> {
  const url = `https://www.youtube.com/feed/music`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept-Language': 'en-US,en;q=0.9,th;q=0.8',
        'Cookie': 'VISITOR_INFO1_LIVE=; YSC=;' // Try standard guest cookies
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`YouTube returned status ${response.status}`);
    const html = await response.text();
    const ytInitialData = extractYtInitialData(html);

    if (!ytInitialData) throw new Error('Could not find ytInitialData');

    // Traverse tabs -> content
    const tabs = ytInitialData?.contents?.twoColumnBrowseResultsRenderer?.tabs;
    const sections: MusicSection[] = [];

    // Helper to process a Shelf (Standard or Rich)
    const processShelf = (shelf: any, itemsRaw: any[]) => {
      const shelfTitle = shelf.title?.runs?.[0]?.text || shelf.title?.simpleText || "";
      if (!shelfTitle) return;

      const items: YouTubePlaylistResult[] = [];

      for (const itemWrapper of itemsRaw) {
        // Unwrap RichItem if needed
        const item = itemWrapper.richItemRenderer?.content || itemWrapper;

        // We look for various renderers
        const renderer = item.gridPlaylistRenderer ||
          item.compactStationRenderer ||
          item.lockupViewModel ||
          item.gridVideoRenderer ||
          item.videoRenderer;

        if (renderer) {
          let playlistId = renderer.playlistId || renderer.videoId || renderer.navigationEndpoint?.watchEndpoint?.playlistId;
          let itemTitle = renderer.title?.runs?.[0]?.text || renderer.title?.simpleText;
          let thumbnail = renderer.thumbnails?.[0]?.url;

          // Special handling for "LockupViewModel" (New YouTube UI)
          if (item.lockupViewModel) {
            const lvm = item.lockupViewModel;
            playlistId = lvm.contentId;
            itemTitle = lvm.metadata?.lockupMetadataViewModel?.title?.content;

            // Extract thumbnail from deep LockupViewModel structure
            thumbnail = lvm.contentImage?.collectionThumbnailViewModel?.primaryThumbnail?.image?.sources?.[0]?.url ||
              lvm.thumbnail?.ghostCardsThumbnailViewModel?.thumbnails?.[0]?.url ||
              lvm.contentImage?.image?.sources?.[0]?.url || // Standard video/playlist thumb
              "";
          }

          // Video Count / Subtitle
          let videoCount = "Playlist";
          if (renderer.videoCountShortText) {
            videoCount = renderer.videoCountShortText.simpleText || renderer.videoCountShortText.runs?.[0]?.text;
          } else if (renderer.shortBylineText) {
            videoCount = renderer.shortBylineText.runs?.[0]?.text || "Video";
          }

          if (playlistId && itemTitle) {
            items.push({
              playlistId,
              title: itemTitle,
              author: "YouTube Music",
              videoCount,
              thumbnail: thumbnail || ""
            });
          }
        }
      }

      if (items.length > 0) {
        sections.push({ title: shelfTitle, items });
      }
    };

    if (tabs) {
      for (const tab of tabs) {
        // Content can be in sectionListRenderer (Old) or richGridRenderer (New)
        const content = tab?.tabRenderer?.content;
        if (!content) continue;

        let potentialShelves: any[] = [];

        if (content.sectionListRenderer) {
          potentialShelves = content.sectionListRenderer.contents;
        } else if (content.richGridRenderer) {
          potentialShelves = content.richGridRenderer.contents;
        }

        for (const section of potentialShelves) {
          // Handle: SectionList -> ItemSection -> Shelf
          if (section.itemSectionRenderer?.contents?.[0]?.shelfRenderer) {
            const shelf = section.itemSectionRenderer.contents[0].shelfRenderer;
            const items = shelf.content?.horizontalListRenderer?.items || shelf.content?.expandedShelfContentsRenderer?.items || [];
            processShelf(shelf, items);
          }
          // Handle: RichGrid -> RichSection -> RichShelf
          else if (section.richSectionRenderer?.content?.richShelfRenderer) {
            const shelf = section.richSectionRenderer.content.richShelfRenderer;
            const items = shelf.contents || [];
            processShelf(shelf, items);
          }
        }
      }
    }

    console.log(`[YouTube Scraper] Parsed ${sections.length} music sections`);
    return sections;

  } catch (error: any) {
    console.error("[YouTube Scraper] Music explore failed:", error.message);
    throw error;
  }
}

/**
 * User agents for rotation (to avoid bot detection)
 */
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
];

/**
 * Get random user agent
 */
function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Extract ytInitialData from YouTube HTML
 */
function extractYtInitialData(html: string): any {
  // Method 1: Try to find ytInitialData in script tags
  const scriptMatch = html.match(/var ytInitialData = ({.+?});/s);
  if (scriptMatch && scriptMatch[1]) {
    try {
      return JSON.parse(scriptMatch[1]);
    } catch (e) {
      // Try next method
    }
  }

  // Method 2: Try window["ytInitialData"] format
  const windowMatch = html.match(/window\["ytInitialData"\] = ({.+?});/s);
  if (windowMatch && windowMatch[1]) {
    try {
      return JSON.parse(windowMatch[1]);
    } catch (e) {
      // Try next method
    }
  }

  // Method 3: Try ytInitialData = format (without var)
  const directMatch = html.match(/ytInitialData = ({.+?});/s);
  if (directMatch && directMatch[1]) {
    try {
      return JSON.parse(directMatch[1]);
    } catch (e) {
      // Continue
    }
  }

  return null;
}

/**
 * Parse video results from ytInitialData JSON
 */
/**
 * Parse video results from ytInitialData JSON (Robust Deep Search)
 */
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
          results.push({
            videoId: v.videoId,
            title: v.title?.runs?.[0]?.text || v.title?.simpleText || 'Unknown',
            author: v.ownerText?.runs?.[0]?.text || v.shortBylineText?.runs?.[0]?.text || 'Unknown',
            authorId: v.ownerText?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId || '',
            videoThumbnails: constructThumbnails(v.videoId)
          });
        }
      }

      // 2. LockupViewModel (New UI)
      if (obj.lockupViewModel && obj.lockupViewModel.contentId) {
        const lvm = obj.lockupViewModel;
        const videoId = lvm.contentId;
        // Note: Sometimes contentType is missing, usually contentId implies availability
        if (videoId && !seenIds.has(videoId)) {
          seenIds.add(videoId);
          results.push({
            videoId: videoId,
            title: lvm.metadata?.lockupMetadataViewModel?.title?.content || 'Unknown',
            author: lvm.metadata?.lockupMetadataViewModel?.metadata?.content || 'Unknown',
            authorId: '',
            videoThumbnails: constructThumbnails(videoId)
          });
        }
      }

      // 3. Playlist Video Renderer (if mixed)
      if (obj.playlistVideoRenderer) {
        const v = obj.playlistVideoRenderer;
        if (v.videoId && !seenIds.has(v.videoId)) {
          seenIds.add(v.videoId);
          results.push({
            videoId: v.videoId,
            title: v.title?.runs?.[0]?.text || v.title?.simpleText || 'Unknown',
            author: v.shortBylineText?.runs?.[0]?.text || 'Unknown',
            authorId: '',
            videoThumbnails: constructThumbnails(v.videoId)
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

    // Start search from contents
    const contentRoot = ytInitialData.contents || ytInitialData.onResponseReceivedCommands || ytInitialData;
    findVideos(contentRoot);

    return results;
  } catch (error) {
    console.error('Error parsing video results:', error);
    return [];
  }
}

function constructThumbnails(videoId: string) {
  return [
    { quality: 'maxres', url: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`, width: 1280, height: 720 },
    { quality: 'high', url: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`, width: 480, height: 360 },
    { quality: 'medium', url: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`, width: 320, height: 180 },
  ];
}

/**
 * Filter out "full album" and "playlist" videos (like bemusic does)
 */
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

// Fallback Invidious Instances (Public)
const INVIDIOUS_INSTANCES = [
  'https://invidious.jing.rocks',
  'https://inv.tux.pizza',
  'https://vid.puffyan.us',
  'https://invidious.nerdvpn.de',
  'https://yt.artemislena.eu',
  // 'https://invidious.io' // Listing
];

async function scrapeInvidious(query: string): Promise<YouTubeScraperResult[]> {
  const instances = [...INVIDIOUS_INSTANCES].sort(() => Math.random() - 0.5); // Shuffle
  const selectedInstances = instances.slice(0, 5); // Pick top 5 (Try ALL for max speed probability)

  console.log(`[Scraper] Trying ${selectedInstances.length} Invidious instances in parallel...`);

  // Helper to fetch from one instance
  const fetchInstance = async (instance: string): Promise<YouTubeScraperResult[]> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s strict timeout

    try {
      const res = await fetch(`${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`, {
        headers: { 'User-Agent': getRandomUserAgent() },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data: any[] = await res.json();

      if (!Array.isArray(data) || data.length === 0) throw new Error("Empty results");

      console.log(`[Scraper] ✅ Success from ${instance} (${data.length} results)`);
      return data.map((item: any) => ({
        videoId: item.videoId,
        title: item.title,
        author: item.author,
        authorId: item.authorId,
        videoThumbnails: item.videoThumbnails || constructThumbnails(item.videoId)
      })).slice(0, 20);

    } catch (e: any) {
      clearTimeout(timeoutId);
      // console.warn(`[Scraper] ${instance} failed: ${e.message}`); // Optional debug
      throw e;
    }
  };

  try {
    // Race them! First success wins.
    return await Promise.any(selectedInstances.map(inst => fetchInstance(inst)));
  } catch (aggregateError) {
    console.error("[Scraper] All parallel Invidious instances failed.");
    throw new Error("All Invidious instances failed");
  }
}

/**
 * Main scraping function
 *
 * @param query - Search query
 * @param timeout - Timeout in milliseconds (default: 10000)
 * @returns Array of video results
 */
export async function scrapeYouTubeSearch(
  query: string,
  timeout: number = 2000 // Safer timeout for stability
): Promise<YouTubeScraperResult[]> {
  const encodedQuery = encodeURIComponent(query);
  const directUrl = `https://www.youtube.com/results?search_query=${encodedQuery}`;

  // TASK 1: Direct Scrape (Fastest possible path)
  const directTask = async (): Promise<YouTubeScraperResult[]> => {
    // console.log(`[Scraper] Starting Direct: ${directUrl}`);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(directUrl, {
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept-Language': 'en-US,en;q=0.9,th;q=0.8',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Cookie': 'CONSENT=YES+cb.20210328-17-p0.en+FX+417; SOCS=CAESEwgDEgk1NzY3NDIwMzQaAmVuIAEaBgiA_LyaBg;', // Bypass Consent Page
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429 || response.status === 403) throw new Error("Blocked");
        throw new Error(`Status ${response.status}`);
      }
      const html = await response.text();

      // OPTIMIZATION: Try to extract data FIRST. 
      // Sometimes the consent page wrapper still contains the data we need in valid JSON.
      const ytInitialData = extractYtInitialData(html);

      if (ytInitialData) {
        const results = parseVideoResults(ytInitialData);
        if (results.length > 0) {
          console.log(`[Scraper] ⚡ Direct WON! (${results.length} results)`);
          return filterAndSortResults(results);
        }
      }

      // If extraction failed, THEN check for blocks
      if (html.includes("Before you continue") || html.includes("captcha")) throw new Error("Consent");
      if (!ytInitialData) throw new Error('No Data');
      throw new Error('No Results');

    } catch (e: any) {
      console.warn(`[Scraper] ⚠️ Direct Scrape Failed: ${e.name === 'AbortError' ? 'Timeout' : e.message}`);
      throw e;
    }
  };

  // TASK 2: Invidious (Backup, but started immediately)
  const invidiousTask = async (): Promise<YouTubeScraperResult[]> => {
    // No delay. Fire immediately.
    return await scrapeInvidious(query);
  };

  // RACE
  try {
    console.log(`[Scraper] Racing Direct vs Invidious for: "${query}"`);
    return await Promise.any([directTask(), invidiousTask()]);
  } catch (error) {
    console.error(`[Scraper] All sources failed.`);
    throw new Error(`Scraping failed: ${query}`);
  }
}

/**
 * Scrape with retry logic
 */
export async function scrapeYouTubeSearchWithRetry(
  query: string,
  maxRetries: number = 2,
  timeout: number = 10000
): Promise<YouTubeScraperResult[]> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await scrapeYouTubeSearch(query, timeout);
    } catch (error: any) {
      lastError = error;
      console.error(`[YouTube Scraper] Attempt ${i + 1}/${maxRetries} failed:`, error.message);

      // Wait before retry (exponential backoff)
      if (i < maxRetries - 1) {
        const delay = Math.min(1000 * Math.pow(2, i), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('YouTube scraping failed');
}

// ============================================================================
// PLAYLIST SCRAPING SUPPORT (Added for Genre Redesign)
// ============================================================================

export interface YouTubePlaylistResult {
  playlistId: string;
  title: string;
  thumbnail: string;
  author: string;
  videoCount: string;
}

/**
 * Scrape YouTube Playlist Search Results
 * Uses sp=EgIQAw%3D%3D to filter for playlists
 */
export async function scrapeYouTubePlaylistSearch(
  query: string,
  timeout: number = 10000
): Promise<YouTubePlaylistResult[]> {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://www.youtube.com/results?search_query=${encodedQuery}&sp=EgIQAw%3D%3D`; // Force type=playlist

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept-Language': 'en-US,en;q=0.9,th;q=0.8',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`YouTube returned status ${response.status}`);
    const html = await response.text();
    const ytInitialData = extractYtInitialData(html);

    if (!ytInitialData) throw new Error('Could not find ytInitialData');

    const contents = ytInitialData?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
    if (!contents) return [];

    const results: YouTubePlaylistResult[] = [];

    for (const section of contents) {
      if (!section.itemSectionRenderer?.contents) continue;
      for (const item of section.itemSectionRenderer.contents) {
        const renderer = item.playlistRenderer;
        if (!renderer) continue;

        const playlistId = renderer.playlistId;
        const title = renderer.title.simpleText || renderer.title.runs?.[0]?.text || "Unknown";
        const author = renderer.shortBylineText?.runs?.[0]?.text || "Unknown";
        const videoCount = renderer.videoCountText?.simpleText || renderer.videoCountText?.runs?.[0]?.text || "0";
        const thumbnail = renderer.thumbnails?.[0]?.url || "";

        if (playlistId) {
          results.push({ playlistId, title, author, videoCount, thumbnail });
        }
      }
    }

    console.log(`[YouTube Scraper] Found ${results.length} playlists for query: ${query}`);
    return results;

  } catch (error: any) {
    console.error("[YouTube Scraper] Playlist search failed:", error.message);
    return [];
  }
}

export interface YouTubeVideoResult {
  videoId: string;
  title: string;
  author: string;
  videoThumbnails: Array<{ quality: string; url: string; width: number; height: number; }>;
}

/**
 * Scrape Videos from a specific Playlist ID
 */
export async function scrapeYouTubePlaylistVideos(
  playlistId: string,
  timeout: number = 10000
): Promise<YouTubeVideoResult[]> {
  const url = `https://www.youtube.com/playlist?list=${playlistId}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept-Language': 'en-US,en;q=0.9,th;q=0.8',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`YouTube returned status ${response.status}`);
    const html = await response.text();

    // Playlist pages are different, sometimes ytInitialData is used for valid videos
    const ytInitialData = extractYtInitialData(html);
    if (!ytInitialData) throw new Error('Could not find ytInitialData');

    // Traverse for playlistVideoListRenderer
    // Structure: contents -> twoColumnBrowseResultsRenderer -> tabs -> tabRenderer -> content -> sectionListRenderer -> contents -> itemSectionRenderer -> contents -> playlistVideoListRenderer -> contents
    // OR: contents -> twoColumnBrowseResultsRenderer -> tabs -> tabRenderer -> content -> sectionListRenderer -> contents -> itemSectionRenderer -> contents -> playlistVideoListRenderer -> contents

    // Simpler traverse helper
    const findContents = (obj: any): any[] => {
      if (!obj) return [];
      if (obj.playlistVideoListRenderer) return obj.playlistVideoListRenderer.contents;
      // Iterate keys
      for (const key in obj) {
        if (typeof obj[key] === 'object') {
          const res = findContents(obj[key]);
          if (res.length > 0) return res;
        }
      }
      return [];
    };

    // Targeted traversal (safer)
    const tabs = ytInitialData?.contents?.twoColumnBrowseResultsRenderer?.tabs;
    let videoItems: any[] = [];

    if (tabs) {
      for (const tab of tabs) {
        const sectionList = tab?.tabRenderer?.content?.sectionListRenderer?.contents;
        if (sectionList) {
          for (const section of sectionList) {
            const itemSection = section?.itemSectionRenderer?.contents;
            if (itemSection) {
              for (const item of itemSection) {
                if (item.playlistVideoListRenderer?.contents) {
                  videoItems = item.playlistVideoListRenderer.contents;
                  break;
                }
              }
            }
          }
        }
      }
    }

    if (videoItems.length === 0) {
      console.warn("[YouTube Scraper] No videos found via standard traversal, trying deep search");
      // Fallback: This implementation often changes.
    }

    const videos: YouTubeVideoResult[] = [];

    for (const item of videoItems) {
      const renderer = item.playlistVideoRenderer;
      if (!renderer) continue;

      const videoId = renderer.videoId;
      const title = renderer.title?.runs?.[0]?.text || renderer.title?.simpleText || "Unknown";
      const author = renderer.shortBylineText?.runs?.[0]?.text || "Unknown";

      if (videoId) {
        videos.push({
          videoId,
          title,
          author,
          videoThumbnails: [
            { quality: 'maxres', url: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`, width: 1280, height: 720 },
            { quality: 'medium', url: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`, width: 320, height: 180 }
          ]
        });
      }
    }

    console.log(`[YouTube Scraper] Parsed ${videos.length} videos from playlist ${playlistId}`);
    return videos;

  } catch (error: any) {
    console.error("[YouTube Scraper] Playlist fetch failed:", error.message);
    throw error;
  }
}
