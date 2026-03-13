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

    // Phase 1: Try JOOX V3 API (Official High-Quality Source - Web Replicated)
    try {
      // 1a: Fetch Session Keys from Firestore for maximum stability
      let wmid = process.env.JOOX_WMID;
      let sessionKey = process.env.JOOX_SESSION_KEY;

      if (adminFirestore && (!wmid || !sessionKey)) {
          try {
              const configDoc = await adminFirestore.collection('system_config').doc('joox_api').get();
              if (configDoc.exists) {
                  const data = configDoc.data();
                  wmid = wmid || data?.wmid;
                  sessionKey = sessionKey || data?.session_key;
                  if (data?.wmid) console.log(`✅ [ImageAPI] Using Firestore JOOX Auth for ${artistName}`);
              }
          } catch (e) {
              console.warn(`⚠️ [ImageAPI] Firestore config check failed:`, (e as Error).message);
          }
      }

      const jooxQueries = [artistName, artistName.replace(/ /g, ''), englishName];
      for (const q of jooxQueries) {
          if (!q) continue;
          
          // Setup Account Headers
          const cookie = (wmid && sessionKey) 
            ? `wmid=${wmid}; session_key=${sessionKey};`
            : '';

          const jooxResp = await axios.get(`https://cache.api.joox.com/openjoox/v3/search?country=th&lang=th&keyword=${encodeURIComponent(q)}`, { 
              timeout: 4000,
              headers: { 
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                  'Referer': 'https://www.joox.com/',
                  'Origin': 'https://www.joox.com',
                  'Cookie': cookie,
                  'Accept': 'application/json, text/plain, */*'
              }
          });
          
          const sectionList = jooxResp.data?.section_list || [];
          // 5: Best Match Artist, 1: Best Match General, 2: Artists
          const targetSections = [5, 1, 2];
          let items: any[] = [];
          for (const type of targetSections) {
              const section = sectionList.find((s: any) => s.section_type === type);
              if (section?.item_list) items = [...items, ...section.item_list];
          }

          let artistItem = items.find((item: any) => {
              const name = item.singer?.name || "";
              return name.toLowerCase() === artistName.toLowerCase() || 
                     name.toLowerCase() === q.toLowerCase();
          })?.singer || items[0]?.singer;

          // Double check with V2 if V3 results are poor
          if (!artistItem) {
              const v2Resp = await axios.get(`https://cache.api.joox.com/openjoox/v2/search_type?country=th&lang=th&key=${encodeURIComponent(q)}&type=2`, { 
                  timeout: 2000,
                  headers: { 'Referer': 'https://www.joox.com/' }
              });
              artistItem = v2Resp.data?.item_list?.[0];
          }

          if (artistItem && artistItem.images) {
              // Prefer 1000px resolution
              const highRes = artistItem.images.find((img: any) => img.width === 1000 || img.url?.includes('/1000'));
              let imgUrl = (highRes || artistItem.images[0])?.url;
              
              if (!imgUrl && artistItem.images[0]?.id) {
                  imgUrl = `https://image.joox.com/JOOXcover/0/${artistItem.images[0].id}/1000`;
              }

              if (imgUrl) {
                  // Force resolution suffix replacement for consistent High-Res
                  const finalUrl = imgUrl.replace(/\/(100|300|640)$/, '/1000');
                  return res.redirect(finalUrl);
              }
          }
      }
    } catch (e) {
        console.warn(`⚠️ [ImageAPI] JOOX detailed search failed for ${artistName}:`, (e as Error).message);
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
