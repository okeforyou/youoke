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

// ===================================================
// PRIMARY METHOD: Direct YouTube Scraping (Updated V2)
// ===================================================
async function searchWithYouTubeDirect(q: string): Promise<Video[]> {
  console.log(`[YouTube Direct] Scraping youtube.com for: ${q}`);

  try {
    // Use the robust V2 scraper with retry
    const results = await scrapeYouTubeSearchWithRetry(q, 2, 8000);

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
// FALLBACK: YouTube Data API v3 (Safety Net)
// ===================================================
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
    console.log("[YouTube API] No API keys configured (Fallback unavailable)", process.env.YOUTUBE_API_KEY);
    throw new Error("No YouTube API keys configured");
  }

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
      if (status === 403 || status === 429) {
        console.log(`API key index ${currentKeyIndex} quota exceeded`);
        failedKeys.add(apiKey);
        setTimeout(() => failedKeys.delete(apiKey), 60 * 60 * 1000); // 1 hour cooldown
      }
      currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
      attempts++;
    }
  }

  throw new Error("YouTube API search failed (All keys exhausted)");
}

// ===================================================
// MAIN HANDLER
// ===================================================
export default async function handler(req, res) {
  const { q, type, region } = req.query;

  try {
    if (!q) return res.status(200).json([]);

    // 1. Try Optimized Scraper (Free & Fast)
    try {
      const videos = await searchWithYouTubeDirect(q as string);
      return res.status(200).json(videos);
    } catch (error) {
      console.log("Scraping failed, attempting API fallback...");
    }

    // 2. Fallback to API (Reliable)
    try {
      const videos = await searchWithYouTubeAPI(q as string, type as string, region as string);
      return res.status(200).json(videos);
    } catch (error) {
      console.error("API Fallback failed:", error.message);
    }

    // 3. Give up
    throw new Error("All search methods failed");

  } catch (error: any) {
    res.status(500).json({ error: error.message || "Search failed" });
  }
}
