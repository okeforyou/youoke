import { scrapeYouTubeSearch } from "../../utils/youtubeScraper";

export default async function handler(req: any, res: any) {
  const { q } = req.query;

  if (!q) return res.status(200).json([]);

  try {
    // console.log(`[API/Search] Handling query: "${q}"`);

    // Leverage the unified Concurrent Scraper (Proxies, Race, etc.)
    const results = await scrapeYouTubeSearch(q as string);

    // Map to expected Legacy format
    const videos = results.map((item) => ({
      videoId: item.videoId,
      title: item.title,
      author: item.author || "Unknown",
      videoThumbnails: item.videoThumbnails
    }));

    return res.status(200).json(videos);

  } catch (error: any) {
    console.error("[API/Search] Failed:", error.message);
    // Return empty array to prevent UI crashes (Sidebar Player often polls this)
    return res.status(200).json([]);
  }
}

