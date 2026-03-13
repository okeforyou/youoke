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

    // Phase 1: Try JOOX V3 API (Official High-Quality Source)
    try {
      const jooxQueries = [artistName, artistName.replace(/ /g, ''), englishName];
      for (const q of jooxQueries) {
          if (!q) continue;
          const jooxResp = await axios.get(`https://cache.api.joox.com/openjoox/v3/search?country=th&lang=th&keyword=${encodeURIComponent(q)}`, { 
              timeout: 3000,
              headers: { 
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                  'Referer': 'https://www.joox.com/',
                  'Origin': 'https://www.joox.com'
              }
          });
          
          const sectionList = jooxResp.data?.section_list || [];
          
          // JOOX V3 Section Types:
          // 5: Best Match (Artist)
          // 1: Best Match (General)
          // 2: Artists
          const bestMatchSection = sectionList.find((s: any) => s.section_type === 5 || s.section_type === 1);
          const artistSection = sectionList.find((s: any) => s.section_type === 2);
          
          // Search in Best Match first, then Artists section
          const items = [
              ...(bestMatchSection?.item_list || []),
              ...(artistSection?.item_list || [])
          ];

          // Find the best singer match
          const artistItem = items.find((item: any) => {
              const name = item.singer?.name || "";
              return name.toLowerCase() === artistName.toLowerCase() || 
                     name.toLowerCase() === q.toLowerCase();
          })?.singer || items[0]?.singer;

          if (artistItem && artistItem.images) {
              // Prefer 1000px resolution
              const highRes = artistItem.images.find((img: any) => img.width === 1000 || img.url?.includes('/1000'));
              const mainImg = highRes || artistItem.images[0];
              
              if (mainImg?.url) {
                  return res.redirect(mainImg.url);
              } else if (mainImg?.id) {
                  return res.redirect(`https://image.joox.com/JOOXcover/0/${mainImg.id}/1000`);
              }
          }
      }
    } catch (e) {
        console.warn(`⚠️ [ImageAPI] JOOX V3 failed for ${artistName}:`, (e as Error).message);
    }

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
