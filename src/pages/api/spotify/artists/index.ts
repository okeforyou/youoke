import type { NextApiRequest, NextApiResponse } from "next";
import { scrapeMusicCharts, scrapeYouTubeSearch } from "../../../../utils/youtubeScraper";
import { Artist, ArtistCategory, GetTopArtists } from "../../../../types";

/**
 * Get Top Artists (Official Charts Data - V1 Logic)
 *
 * Fetches the specific "Top Artists" chart from YouTube Music.
 * This ensures high-quality metadata (Correct Name, High-Res Image, Rank)
 * without relying on a static list or unstable video search parsing.
 */
// Simple In-Memory Cache
let cachedData: GetTopArtists | null = null;
let lastFetch: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 Hour

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetTopArtists | { error: string }>
) {
  // Check Cache
  if (cachedData && Date.now() - lastFetch < CACHE_DURATION) {
    console.log('⚡ Serving Top Artists from Cache (Charts)');
    return res.status(200).json(cachedData);
  }

  try {
    console.log(`🎵 Fetching Official Charts (TH)...`);

    // 1. Fetch Official Charts
    // This returns clean data like [{ name: "Three Man Down", ... }]
    const chartResults = await scrapeMusicCharts('TH');

    let topArtists: Artist[] = [];

    if (chartResults.length > 0) {
      console.log(`✅ Charts Scraper Success: Found ${chartResults.length} artists`);
      topArtists = chartResults.slice(0, 30).map(a => ({
        name: a.name,
        imageUrl: a.imageUrl || "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300&auto=format&fit=crop" // Fallback placeholder
      }));
    } else {
      // Fallback: If Charts fail (e.g. IP block, layout change), try a very specific search
      // But honestly, if Charts fail, we should probably return empty or try the "Top 100 Songs" scraper again as a desperate backup
      console.warn("⚠️ Charts Scraper returned empty. Trying fallback search...");
      const searchResults = await scrapeYouTubeSearch("Thailand Top Singers", 5000);

      // Basic filtering for fallback
      const uniqueNames = new Set<string>();
      for (const item of searchResults) {
        let name = item.title; // For "Singers" search, title often IS the name (channel)
        if (item.author && item.author !== "Unknown") name = item.author;

        // Clean
        name = name.replace(/ - Topic| Official|VEVO| Channel|Music/gi, "").trim();
        if (name.length > 2 && !uniqueNames.has(name)) {
          uniqueNames.add(name);
          topArtists.push({ name, imageUrl: item.videoThumbnails?.[0]?.url || "" });
        }
      }
      topArtists = topArtists.slice(0, 20);
    }

    // 2. Mock Categories (Playlists) - V1 Style
    // We can keep these as they provide good quick entry points
    const artistCategories: ArtistCategory[] = [
      { tag_id: "เพลงฮิต 100 ล้านวิว", tag_name: "🇹🇭 เพลงฮิต 100 ล้านวิว", imageUrl: "https://i.ytimg.com/vi/S7u3L7ZkOQ0/maxresdefault.jpg" },
      { tag_id: "ลูกทุ่งมาแรง", tag_name: "🌾 ลูกทุ่งมาแรง", imageUrl: "https://i.ytimg.com/vi/_C-Mfq-tO3k/maxresdefault.jpg" },
      { tag_id: "เพลงอินดี้ฟังสบาย", tag_name: "🧣 Indie ฟังสบาย", imageUrl: "https://i.ytimg.com/vi/Q2e8i-Pj3fA/maxresdefault.jpg" },
      { tag_id: "เพลงเศร้าอกหัก", tag_name: "💔 เพลงเศร้าคนอกหัก", imageUrl: "https://i.ytimg.com/vi/J_CFBjAyPWE/maxresdefault.jpg" },
      { tag_id: "เพลงแดนซ์ 90", tag_name: "💃 แดนซ์ 90s มันส์ๆ", imageUrl: "https://i.ytimg.com/vi/x_cZ7Z9WzJ8/maxresdefault.jpg" },
      { tag_id: "หมอลำซิ่ง", tag_name: "🎻 หมอลำม่วนๆ", imageUrl: "https://i.ytimg.com/vi/P1-2345678/maxresdefault.jpg" },
    ];

    const result: GetTopArtists = {
      status: "success",
      artist: topArtists,
      artistCategories: artistCategories
    };

    // Update Cache
    cachedData = result;
    lastFetch = Date.now();

    res.status(200).json(result);

  } catch (error: any) {
    console.error("Critical Error in Artists API:", error.message);
    if (cachedData) return res.status(200).json(cachedData);
    res.status(500).json({ error: error.message });
  }
}
