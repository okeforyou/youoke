import axios from "axios";
import { scrapeYouTubeArtistProfile } from "../../../../utils/youtubeScraper";
import { adminFirestore } from "../../../../firebase-admin";
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

    // Phase 0: Check Firestore Overrides (Sustainable Backend Solution)
    if (adminFirestore) {
        try {
            const doc = await adminFirestore.collection('artist_images').doc(artistName).get();
            if (doc.exists && doc.data()?.imageUrl) {
                console.log(`✅ [ImageAPI] Found Firestore override for ${artistName}`);
                return res.redirect(doc.data()?.imageUrl);
            }
        } catch (e) {
            console.warn(`⚠️ [ImageAPI] Firestore check failed for ${artistName}:`, (e as Error).message);
        }
    }

    // Phase 1: Try Joox / Sanook (EXCELLENT curated press photos for Thai Artists)
    try {
      const jooxQueries = [artistName, artistName.replace(/ /g, ''), englishName];
      for (const q of jooxQueries) {
          if (!q) continue;
          const jooxResp = await axios.get(`https://api-jooxtt.sanook.com/openjoox/v1/search/all?keyword=${encodeURIComponent(q)}&country=th&lang=th`, { 
              timeout: 2500,
              headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36' }
          });
          
          // Try to find an exact artist match first
          const artists = jooxResp.data?.artists?.items || [];
          const exactMatch = artists.find((a: any) => 
            a.name.toLowerCase() === q.toLowerCase() || 
            a.name.toLowerCase() === artistName.toLowerCase()
          );

          const artist = exactMatch || artists[0];
          if (artist && artist.images?.[0]?.url) {
            return res.redirect(artist.images[0].url);
          }
      }
    } catch (e) {}

    // Phase 2: Try Wikipedia (High quality, neutral, sustainable)
    try {
      const namesToTry = [englishName, artistName];
      for (const query of namesToTry) {
          if (!query) continue;
          const wikiResp = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`, { timeout: 1500 });
          if (wikiResp.data?.originalimage?.source) {
              return res.redirect(wikiResp.data.originalimage.source);
          }
      }
    } catch (e) {}

    // Phase 3: Try Deezer API
    try {
      const namesToTry = [englishName, artistName];
      for (const query of namesToTry) {
        if (!query) continue;
        const deezerResp = await axios.get(`https://api.deezer.com/search/artist?q=${encodeURIComponent(query)}`, { timeout: 2000 });
        const artist = deezerResp.data?.data?.[0];
        if (artist && artist.picture_big && artist.name.toLowerCase().includes(query.toLowerCase().split(' ')[0])) {
          return res.redirect(artist.picture_big);
        }
      }
    } catch (e) {}

    // Phase 4: YouTube Official / Music Profile (Very Strict Fallback)
    const profile = await scrapeYouTubeArtistProfile(artistName);
    if (profile && profile.thumbnail) {
        return res.redirect(profile.thumbnail);
    }

    // Last Resort: iTunes
    try {
        const itunesResp = await axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&entity=musicArtist&limit=1`, { timeout: 2000 });
        const itunesArtist = itunesResp.data?.results?.[0];
        if (itunesArtist && itunesArtist.artworkUrl100) {
            return res.redirect(itunesArtist.artworkUrl100.replace('100x100bb', '600x600bb'));
        }
    } catch (e) {}

    return res.redirect("/assets/avatar.jpeg");
  } catch (error) {
    console.error("❌ Artist Image API Error:", (error as Error).message);
    return res.redirect("/assets/avatar.jpeg");
  }
}
