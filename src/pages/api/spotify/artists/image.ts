import axios from "axios";
import { scrapeYouTubeArtistProfile } from "../../../../utils/youtubeScraper";
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
    const artistName = (name as string).split(' (')[0].trim();
    const englishNameMatch = (name as string).match(/\((.*?)\)/);
    const englishName = englishNameMatch ? englishNameMatch[1] : artistName;

    // Phase 1: Try Deezer API (Professional, No-Auth, High-Quality Artist Profiles)
    // Deezer is excellent for high-res artist avatars without needing an API key
    try {
      // Try English first, then Thai
      const namesToTry = [englishName, artistName];
      for (const query of namesToTry) {
        const deezerResp = await axios.get(`https://api.deezer.com/search/artist?q=${encodeURIComponent(query)}`, { timeout: 2000 });
        const artist = deezerResp.data?.data?.[0];
        
        if (artist && artist.picture_big) {
          return res.redirect(artist.picture_big);
        }
      }
    } catch (deezerErr) {
      console.warn("⚠️ Deezer search failed, falling back...");
    }

    // Phase 2: Try iTunes Search API (Another great source for clean art)
    try {
      const itunesResp = await axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&entity=musicArtist&limit=1`, { timeout: 3000 });
      // Note: iTunes artist search sometimes doesn't return an image, so we might search for a song instead
      if (itunesResp.data?.results?.[0]?.artistLinkUrl) {
          // If we want to be aggressive, we could search for a song and use that artist's art, 
          // but let's stick to the fallback chain.
      }
    } catch (itErr) {}

    // Phase 3: Fallback to YouTube Official Channel Profile
    const profile = await scrapeYouTubeArtistProfile(artistName);
    if (profile && profile.thumbnail) {
        return res.redirect(profile.thumbnail);
    }

    // Phase 4: Last Resort Placeholder
    return res.redirect("/assets/avatar.jpeg");
  } catch (error) {
    console.error("❌ Artist Image API Error (Multi-Source Fallback):", (error as Error).message);
    return res.redirect("/assets/avatar.jpeg");
  }
}
