import axios from "axios";
import { scrapeYouTubeSearchWithRetry } from "../../utils/youtubeScraper";

interface VideoThumbnail {
  quality: string;
  url: string;
  width: number;
  height: number;
}

interface Video {
  videoId: string;
  title: string;
  author: string;
  videoThumbnails?: VideoThumbnail[];
}

// List of User-Agents
const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/537.36",
  "Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.73 Mobile Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/109.0.1518.78",
];

const getRandomUserAgent = () =>
  userAgents[Math.floor(Math.random() * userAgents.length)];

// export default async function handler(req, res) {
//   const { q, type, page, region, fields } = req.query;
//   try {
//     const response = await axios.get(`https://invidious.f5.si/api/v1/search`, {
//       params: { q, type, page, region, fields },
//       headers: {
//         "Access-Control-Allow-Origin": "*",
//       },
//     });
//     res.status(200).json(response.data);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// }

// ===================================================
// PRIMARY METHOD: Direct YouTube Scraping (FREE & STABLE!)
// ===================================================
// This is our main search method inspired by bemusic.
// Scrapes youtube.com directly instead of using unstable Invidious instances.
// Benefits: FREE, UNLIMITED, MORE STABLE, NO API KEYS NEEDED!
async function searchWithYouTubeDirect(q: string): Promise<Video[]> {
  console.log(`[YouTube Direct] Scraping youtube.com for: ${q}`);

  try {
    const results = await scrapeYouTubeSearchWithRetry(q, 2, 10000);

    const videos: Video[] = results.map((result) => ({
      videoId: result.videoId,
      title: result.title,
      author: result.author || "Unknown",
      videoThumbnails: result.videoThumbnails,
    }));

    console.log(`[YouTube Direct] ✅ SUCCESS - Found ${videos.length} videos`);
    return videos;
  } catch (error: any) {
    console.error(`[YouTube Direct] ❌ FAILED: ${error.message}`);
    throw error;
  }
}

// ===================================================
// FALLBACK 1: Invidious Web Scraping
// ===================================================
// Invidious instances for web scraping (no API key needed!)
// WARNING: Most instances are down due to YouTube blocking
// Updated 2025-12-05 based on official list: https://docs.invidious.io/instances/
// Only 2 official instances remain active as of Dec 2025
const INVIDIOUS_INSTANCES = [
  "https://yewtu.be", // 🇩🇪 Germany - Official instance
  "https://inv.nadeko.net", // 🇨🇱 Chile - Official instance
];

// Web scraping fallback - works without API keys!
// Try all instances in parallel for faster results
async function searchWithInvidiousScraping(q: string): Promise<Video[]> {
  console.log(`[Web Scraping] Trying ${INVIDIOUS_INSTANCES.length} instances in parallel`);

  const parseVideosFromHTML = (html: string): Video[] => {
    const videos: Video[] = [];
    const videoBlocks = html.split('<div class="h-box">').slice(1);

    videoBlocks.forEach((block) => {
      const getMatch = (regex: RegExp) => block.match(regex)?.[1]?.trim() || "";

      const videoId = getMatch(/href="\/watch\?v=([^"]+)"/);
      const title = getMatch(/<a href="\/watch\?v=[^"]+"><p dir="auto">([^<]+)<\/p>/);
      const author = getMatch(/<p class="channel-name"[^>]*dir="auto">([^<\n]+)/);

      if (videoId && title) {
        videos.push({
          videoId,
          title,
          author,
          videoThumbnails: [
            {
              quality: "maxres",
              url: `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
              width: 1280,
              height: 720,
            },
            {
              quality: "medium",
              url: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
              width: 320,
              height: 180,
            },
            {
              quality: "default",
              url: `https://i.ytimg.com/vi/${videoId}/default.jpg`,
              width: 120,
              height: 90,
            },
          ],
        });
      }
    });

    return videos;
  };

  // Try all instances in parallel - first one to respond wins!
  const promises = INVIDIOUS_INSTANCES.map(async (instance) => {
    try {
      if (!instance || instance === "undefined") {
        throw new Error("Invalid instance");
      }

      const response = await axios.get(`${instance}/search`, {
        params: { q },
        headers: { "User-Agent": getRandomUserAgent() },
        timeout: 8000, // 8 seconds timeout (instances are slower now)
        responseType: "text",
      });

      const videos = parseVideosFromHTML(response.data as string);

      if (videos.length > 0) {
        console.log(`[Web Scraping] ✅ SUCCESS from ${instance} (${videos.length} videos)`);
        return videos;
      } else {
        throw new Error("No videos found");
      }
    } catch (error: any) {
      console.error(`[Web Scraping] ❌ ${instance} failed: ${error.message}`);
      throw error;
    }
  });

  // Return the first successful result
  try {
    const result = await Promise.any(promises);
    return result;
  } catch (error: any) {
    console.error(`[Web Scraping] All instances failed`);
    throw new Error("All web scraping sources failed");
  }
}

// ===================================================
// FALLBACK 2: YouTube Data API v3 (OPTIONAL)
// ===================================================
// YouTube API Keys - support multiple keys for rotation (OPTIONAL)
function getYouTubeApiKeys(): string[] {
  const multiKeys = process.env.YOUTUBE_API_KEYS;
  const singleKey = process.env.YOUTUBE_API_KEY;

  if (multiKeys) {
    return multiKeys.split(',').map(k => k.trim()).filter(k => k);
  }
  if (singleKey) {
    return [singleKey];
  }
  return [];
}

let currentKeyIndex = 0;
const failedKeys = new Set<string>();

async function searchWithYouTubeAPI(q: string, type: string, region: string): Promise<Video[]> {
  const apiKeys = getYouTubeApiKeys();

  if (apiKeys.length === 0) {
    // No API keys configured - throw error to try next fallback
    console.log("[YouTube API] No API keys configured");
    throw new Error("No YouTube API keys configured");
  }

  // Try each key in rotation
  const maxAttempts = apiKeys.length;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const apiKey = apiKeys[currentKeyIndex];

    if (failedKeys.has(apiKey)) {
      currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
      attempts++;
      continue;
    }

    try {
      console.log(`Trying YouTube API with key index ${currentKeyIndex}`);

      const response = await axios.get("https://www.googleapis.com/youtube/v3/search", {
        params: {
          part: "snippet",
          q,
          type: type || "video",
          maxResults: 20,
          regionCode: region || "TH",
          key: apiKey,
        },
        timeout: 10000,
      });

      currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;

      return response.data.items.map((item: any) => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        author: item.snippet.channelTitle,
        videoThumbnails: [
          {
            quality: "maxres",
            url: `https://i.ytimg.com/vi/${item.id.videoId}/maxresdefault.jpg`,
            width: 1280,
            height: 720,
          },
          {
            quality: "medium",
            url: `https://i.ytimg.com/vi/${item.id.videoId}/mqdefault.jpg`,
            width: 320,
            height: 180,
          },
          {
            quality: "default",
            url: `https://i.ytimg.com/vi/${item.id.videoId}/default.jpg`,
            width: 120,
            height: 90,
          },
        ],
      }));

    } catch (error: any) {
      const status = error.response?.status;
      const errorData = error.response?.data?.error;

      if (status === 403 || status === 429) {
        console.log(`API key index ${currentKeyIndex} quota exceeded, marking as failed`);
        failedKeys.add(apiKey);
        setTimeout(() => failedKeys.delete(apiKey), 60 * 60 * 1000);
      }

      currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
      attempts++;

      if (attempts >= maxAttempts) {
        // All YouTube API keys exhausted
        console.log("[YouTube API] All API keys exhausted");
        throw new Error("All YouTube API keys exhausted");
      }
    }
  }

  throw new Error("YouTube API search failed");
}

// ===================================================
// MAIN HANDLER with FALLBACK CHAIN
// ===================================================
export default async function handler(req, res) {
  const { q, type, region } = req.query;

  try {
    if (!q) return res.status(200).json([]);

    console.log(`\n========================================`);
    console.log(`Search request: "${q}"`);
    console.log(`========================================\n`);

    let videos: Video[] = [];
    let lastError: Error | null = null;

    // PRIMARY: Try YouTube Direct Scraping first (FREE & STABLE!)
    try {
      console.log("🎯 [PRIMARY] Trying YouTube Direct Scraping...");
      videos = await searchWithYouTubeDirect(q as string);
      console.log(`✅ SUCCESS with YouTube Direct Scraping (${videos.length} results)\n`);
      return res.status(200).json(videos);
    } catch (error: any) {
      console.error(`❌ YouTube Direct Scraping failed: ${error.message}`);
      lastError = error;
    }

    // FALLBACK 1: Try Invidious Scraping
    try {
      console.log("🔄 [FALLBACK 1] Trying Invidious Scraping...");
      videos = await searchWithInvidiousScraping(q as string);
      console.log(`✅ SUCCESS with Invidious Scraping (${videos.length} results)\n`);
      return res.status(200).json(videos);
    } catch (error: any) {
      console.error(`❌ Invidious Scraping failed: ${error.message}`);
      lastError = error;
    }

    // FALLBACK 2: Try YouTube API (if configured)
    try {
      console.log("🔄 [FALLBACK 2] Trying YouTube API...");
      videos = await searchWithYouTubeAPI(q as string, type as string, region as string);
      console.log(`✅ SUCCESS with YouTube API (${videos.length} results)\n`);
      return res.status(200).json(videos);
    } catch (error: any) {
      console.error(`❌ YouTube API failed: ${error.message}`);
      lastError = error;
    }

    // All methods failed
    console.error("❌❌❌ ALL SEARCH METHODS FAILED ❌❌❌\n");
    throw lastError || new Error("All search methods failed");

  } catch (error: any) {
    console.error("Search API error:", error.message);
    res.status(500).json({
      error: error.message || "Search failed",
      details: "All search methods (YouTube Direct, Invidious, YouTube API) failed",
      hint: "Try again later or contact support"
    });
  }
}
