import { scrapeYouTubeArtistProfile, scrapeYouTubeSearch } from "../../../../utils/youtubeScraper";
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
    // Phase 1: Try to get Official Channel Profile Image (Premium Circular Look)
    // We clean the name to avoid unnecessary noise for channel search
    let cleanName = (name as string).split(' (')[0].trim();
    const profile = await scrapeYouTubeArtistProfile(cleanName);

    if (profile && profile.thumbnail) {
        // Great! Official profile image found.
        return res.redirect(profile.thumbnail);
    }

    // Phase 2: Fallback to video thumbnail if no channel profile found
    const searchQuery = `${name} official music`;
    const results = await scrapeYouTubeSearch(searchQuery);

    if (results && results.length > 0) {
      const firstResult = results[0];
      const imageUrl = firstResult.videoThumbnails?.find(t => t.quality === 'high' || t.quality === 'maxres')?.url 
                      || firstResult.videoThumbnails?.[0]?.url;

      if (imageUrl) {
        return res.redirect(imageUrl);
      }
    }

    // Fallback to placeholder
    return res.redirect("/assets/avatar.jpeg");
  } catch (error) {
    console.error("❌ Artist Image API Error (Improved YouTube Source):", (error as Error).message);
    return res.redirect("/assets/avatar.jpeg");
  }
}
