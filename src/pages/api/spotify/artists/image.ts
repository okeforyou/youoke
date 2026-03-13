import { scrapeYouTubeSearch } from "../../../../utils/youtubeScraper";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ error: "Name parameter is required" });
  }

  try {
    // Search for the artist on YouTube 
    // We add "official music" to get better quality profile-like thumbnails from official channels
    const searchQuery = `${name} official music`;
    const results = await scrapeYouTubeSearch(searchQuery);

    // Try to find a channel thumbnail or a high-quality video thumbnail
    if (results && results.length > 0) {
      // YouTube scraper returns video thumbnails. We pick the best quality one.
      const firstResult = results[0];
      const imageUrl = firstResult.videoThumbnails?.find(t => t.quality === 'high' || t.quality === 'maxres')?.url 
                      || firstResult.videoThumbnails?.[0]?.url;

      if (imageUrl) {
        return res.redirect(imageUrl);
      }
    }

    // Fallback to placeholder if nothing found
    return res.redirect("/assets/avatar.jpeg");
  } catch (error) {
    console.error("❌ Artist Image API Error (YouTube Fallback):", (error as Error).message);
    return res.redirect("/assets/avatar.jpeg");
  }
}
