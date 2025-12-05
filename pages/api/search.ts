import axios from "axios";

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
async function searchWithWebScraping(q: string): Promise<Video[]> {
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

async function searchWithYouTube(q: string, type: string, region: string): Promise<Video[]> {
  const apiKeys = getYouTubeApiKeys();

  if (apiKeys.length === 0) {
    // No API keys configured - use web scraping instead
    console.log("No YouTube API keys configured, using web scraping");
    return searchWithWebScraping(q);
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
        // All YouTube API keys failed - fallback to web scraping
        console.log("All YouTube API keys exhausted, falling back to web scraping");
        return searchWithWebScraping(q);
      }
    }
  }

  throw new Error("Search failed");
}

export default async function handler(req, res) {
  const { q, type, region } = req.query;
  try {
    if (!q) return res.status(200).json([]);

    const videos = await searchWithYouTube(q as string, type as string, region as string);
    res.status(200).json(videos);
  } catch (error: any) {
    console.error("Search API error:", error.message);
    res.status(500).json({
      error: error.message || "Search failed",
      hint: "Please configure YOUTUBE_API_KEY or YOUTUBE_API_KEYS environment variable"
    });
  }
}
