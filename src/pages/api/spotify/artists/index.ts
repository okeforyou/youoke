import type { NextApiRequest, NextApiResponse } from "next";
import { scrapeYouTubeSearch } from "../../../../utils/youtubeScraper";
import { Artist, ArtistCategory, GetTopArtists } from "../../../../types";

/**
 * Get Top Artists from YouTube Scraper (Mocking Spotify)
 *
 * Uses "Thailand Top 100" search results to find trending artists.
 * Dynamic and auto-updating based on YouTube trends.
 */
// Simple In-Memory Cache
let cachedData: GetTopArtists | null = null;
let lastFetch: number = 0;
const CACHE_DURATION = 30 * 60 * 1000; // 30 Minutes

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetTopArtists | { error: string }>
) {
  // Check Cache
  if (cachedData && Date.now() - lastFetch < CACHE_DURATION) {
    console.log('⚡ Serving Top Artists from Cache (Scraper)');
    return res.status(200).json(cachedData);
  }

  try {
    const searchQuery = "Thailand Top 100 Songs";
    console.log(`🎵 Fetching '${searchQuery}' via Scraper...`);

    // 1. Scrape Trending Songs
    // Increase timeout to 8s for deep scraping
    const searchResults = await scrapeYouTubeSearch(searchQuery, 8000);

    if (!searchResults || searchResults.length === 0) {
      throw new Error("No results from scraper");
    }

    // 2. Extract Artists from Video Titles/Authors
    const artistMap = new Map<string, { name: string; imageUrl: string; songCount: number }>();

    for (const item of searchResults) {
      // Clean up artist name (Simple heuristic)
      let artistName = item.author || "Unknown";

      // Filter out "Topic", "Official", "Vevo"
      artistName = artistName.replace(/ - Topic| Official|VEVO| Channel|Music|Records/gi, "").trim();

      // If author is a label, try extracting from title "Artist - Title"
      const genericLabels = ['GMM GRAMMY', 'RsiamMusic', 'rsfriends', 'Genierock', 'Sanamluang Music', 'Smallroom', 'Whattheduck', 'Gene Lab'];
      if (genericLabels.some(label => artistName.toLowerCase().includes(label.toLowerCase()))) {
        const parts = item.title.split('-');
        if (parts.length > 1) {
          artistName = parts[0].trim();
        }
      }

      // Skip invalid names
      if (artistName.length < 2 || artistName.includes("รวมเพลง")) continue;

      const imageUrl = item.videoThumbnails?.[1]?.url || item.videoThumbnails?.[0]?.url || "";

      if (artistMap.has(artistName)) {
        const entry = artistMap.get(artistName)!;
        entry.songCount++;
        // Keep the image if we have one, or update if we found a better one? 
        // Just keep first found for stability.
      } else {
        artistMap.set(artistName, { name: artistName, imageUrl, songCount: 1 });
      }
    }

    // 3. Sort by occurrences (Trends)
    // Map to API format
    const topArtists: Artist[] = Array.from(artistMap.values())
      .sort((a, b) => b.songCount - a.songCount)
      .slice(0, 18) // Top 18 to fill the grid
      .map(a => ({
        name: a.name,
        imageUrl: a.imageUrl
      }));

    // 4. Mock Categories (Playlists) - Dynamic "Quick Access" based on search
    // We point to "tag_id" which usually meant Playlist ID in Spotify. 
    // Here we can use it as a "Keyword" if we funnel it to searchPlaylists?
    // Let's use it as a KEYWORD for now, and handle it in searchPlaylists
    const artistCategories: ArtistCategory[] = [
      { tag_id: "เพลงฮิต 100 ล้านวิว", tag_name: "🇹🇭 เพลงไทยฮิต 100 ล้านวิว", imageUrl: "https://i.ytimg.com/vi/S7u3L7ZkOQ0/maxresdefault.jpg" },
      { tag_id: "ลูกทุ่งมาแรง", tag_name: "🌾 ลูกทุ่งมาแรง", imageUrl: "https://i.ytimg.com/vi/_C-Mfq-tO3k/maxresdefault.jpg" },
      { tag_id: "เพลงอินดี้ฟังสบาย", tag_name: "🧣 Indie ฟังสบาย", imageUrl: "https://i.ytimg.com/vi/Q2e8i-Pj3fA/maxresdefault.jpg" },
      { tag_id: "เพลงเศร้าอกหัก", tag_name: "💔 เพลงเศร้าคนอกหัก", imageUrl: "https://i.ytimg.com/vi/J_CFBjAyPWE/maxresdefault.jpg" },
      { tag_id: "เพลงแดนซ์ 90", tag_name: "💃 แดนซ์ 90s มันส์ๆ", imageUrl: "https://i.ytimg.com/vi/x_cZ7Z9WzJ8/maxresdefault.jpg" },
    ];

    const result: GetTopArtists = {
      status: "success",
      artist: topArtists,
      artistCategories: artistCategories
    };

    // Update Cache
    cachedData = result;
    lastFetch = Date.now();

    console.log(`✅ Scraped ${topArtists.length} artists. Serving fresh data.`);
    res.status(200).json(result);

  } catch (error: any) {
    console.error("Error scraping top artists:", error.message);
    // Fallback to cache if available
    if (cachedData) {
      console.log("⚠️ Scraper failed, serving stale cache.");
      return res.status(200).json(cachedData);
    }

    // Final Fallback: Return empty structure to prevent UI crash
    res.status(200).json({
      status: "success", // Fake success to avoid error page
      artist: [],
      artistCategories: []
    });
  }
}
