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

    // Phase 1: Try Deezer API (Best professional square portraits)
    try {
      const namesToTry = [englishName, artistName];
      for (const query of namesToTry) {
        const deezerResp = await axios.get(`https://api.deezer.com/search/artist?q=${encodeURIComponent(query)}`, { timeout: 2000 });
        const artist = deezerResp.data?.data?.[0];
        if (artist && artist.picture_big && artist.name.toLowerCase().includes(query.toLowerCase().split(' ')[0])) {
          return res.redirect(artist.picture_big);
        }
      }
    } catch (e) {}

    // Phase 2: Try Joox / Sanook (Great for Thai Artists)
    try {
      // Joox often has better metadata for Thai artists
      const jooxResp = await axios.get(`https://api-jooxtt.sanook.com/openjoox/v1/search/all?keyword=${encodeURIComponent(artistName)}&country=th&lang=th`, { timeout: 2000 });
      const jooxArtist = jooxResp.data?.artists?.items?.[0];
      if (jooxArtist && jooxArtist.images?.[0]?.url) {
        return res.redirect(jooxArtist.images[0].url);
      }
    } catch (e) {}

    // Phase 3: Try iTunes Search API
    try {
      const itunesResp = await axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&entity=musicArtist&limit=1`, { timeout: 2000 });
      const itunesArtist = itunesResp.data?.results?.[0];
      // iTunes sometimes doesn't give direct artist image, let's try searching for a song by that artist
      if (!itunesArtist) {
          const songResp = await axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&entity=song&limit=1`, { timeout: 2000 });
          const song = songResp.data?.results?.[0];
          if (song && song.artworkUrl100) {
              // Convert 100x100 to 600x600 for high res
              return res.redirect(song.artworkUrl100.replace('100x100bb', '600x600bb'));
          }
      }
    } catch (e) {}

    // Phase 4: Fallback to YouTube Official Channel Profile
    const profile = await scrapeYouTubeArtistProfile(artistName);
    if (profile && profile.thumbnail) {
        return res.redirect(profile.thumbnail);
    }

    // Last Resort
    return res.redirect("/assets/avatar.jpeg");
  } catch (error) {
    console.error("❌ Artist Image API Error:", (error as Error).message);
    return res.redirect("/assets/avatar.jpeg");
  }
}
