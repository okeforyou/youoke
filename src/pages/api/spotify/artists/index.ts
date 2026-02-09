import type { NextApiRequest, NextApiResponse } from "next";
import { scrapeYouTubeSearch } from "../../../../utils/youtubeScraper";
import { Artist, ArtistCategory, GetTopArtists } from "../../../../types";
import { TOP_THAI_ARTISTS } from "../../../../data/topArtists";

/**
 * Get Top Artists (Hybrid: Static Base + Dynamic Scraper)
 *
 * Ensures data completeness by using a curated list of top Thai artists
 * while still fetching trending data from YouTube to keep it fresh.
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
    console.log('⚡ Serving Top Artists from Cache (Hybrid)');
    return res.status(200).json(cachedData);
  }

  try {
    const searchQuery = "Thailand Top 100 Songs";
    console.log(`🎵 Fetching '${searchQuery}' via Scraper...`);

    // 1. Initialize Map with Static Base (Guarantees Quality)
    const artistMap = new Map<string, { name: string; imageUrl: string; songCount: number }>();

    // Pre-fill with our curated list
    TOP_THAI_ARTISTS.forEach(artist => {
      artistMap.set(artist.name, {
        name: artist.name,
        imageUrl: artist.imageUrl || "",
        songCount: 1 // Base weight
      });
    });

    // 2. Scrape Trending Songs (Dynamic Enrichment)
    try {
      // Increase timeout to 8s for deep scraping
      const searchResults = await scrapeYouTubeSearch(searchQuery, 8000);

      if (searchResults && searchResults.length > 0) {
        for (const item of searchResults) {
          // Clean up artist name (Simple heuristic)
          let artistName = item.author || "Unknown";
          // Filter out "Topic", "Official", "Vevo"
          artistName = artistName.replace(/ - Topic| Official|VEVO| Channel|Music|Records/gi, "").trim();

          // If author is a label, try extracting from title "Artist - Title"
          const genericLabels = ['GMM GRAMMY', 'RsiamMusic', 'rsfriends', 'Genierock', 'Sanamluang', 'Smallroom', 'Whattheduck', 'Gene Lab'];
          if (genericLabels.some(label => artistName.toLowerCase().includes(label.toLowerCase()))) {
            const parts = item.title.split('-');
            if (parts.length > 1) {
              artistName = parts[0].trim();
            }
          }

          // Skip invalid names
          if (artistName.length < 2 || artistName.includes("รวมเพลง") || artistName === "Unknown") continue;

          const imageUrl = item.videoThumbnails?.[1]?.url || item.videoThumbnails?.[0]?.url || "";

          if (artistMap.has(artistName)) {
            const entry = artistMap.get(artistName)!;
            entry.songCount += 5; // Boost trending artists!
            // Optionally update image if the scraped one is likely better (e.g. not a default placeholder)
            if (!entry.imageUrl && imageUrl) {
              entry.imageUrl = imageUrl;
            }
          } else {
            // New trending artist found!
            artistMap.set(artistName, { name: artistName, imageUrl, songCount: 5 });
          }
        }
      }
    } catch (e) {
      console.warn("⚠️ Scraper enrichment failed, falling back to static list only:", e);
    }

    // 3. Sort by Trending Score (songCount)
    // Map to API format
    const topArtists: Artist[] = Array.from(artistMap.values())
      .sort((a, b) => b.songCount - a.songCount)
      .slice(0, 24) // Top 24 to fill the grid
      .map(a => ({
        name: a.name,
        imageUrl: a.imageUrl // If empty, frontend should handle placeholder
      }));

    // 4. Mock Categories (Playlists) - Dynamic "Quick Access" based on search
    const artistCategories: ArtistCategory[] = [
      { tag_id: "เพลงฮิต 100 ล้านวิว", tag_name: "🇹🇭 เพลงไทยฮิต 100 ล้านวิว", imageUrl: "https://i.ytimg.com/vi/S7u3L7ZkOQ0/maxresdefault.jpg" },
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

    console.log(`✅ Hybrid Service: Served ${topArtists.length} artists.`);
    res.status(200).json(result);

  } catch (error: any) {
    console.error("Critical Error in Artists API:", error.message);
    // Absolute fallback
    if (cachedData) return res.status(200).json(cachedData);

    // Return just the static list if everything fails
    const fallbackArtists = TOP_THAI_ARTISTS.map(a => ({ name: a.name, imageUrl: a.imageUrl || "" }));
    res.status(200).json({
      status: "success",
      artist: fallbackArtists,
      artistCategories: []
    });
  }
}
