import axios from "axios";
import { scrapeYouTubeArtistProfile } from "../../../../utils/youtubeScraper";
import { safeSplit } from "../../../../utils/stringUtils";
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

  // Set aggressive caching headers for speed: 
  // Cache for 1 day on Vercel Edge/CDN, and 1 hour on the browser.
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=3600, max-age=3600');

  try {
    const artistName = safeSplit(name as string, ' (')[0].trim();
    const englishNameMatch = (name as string).match(/\((.*?)\)/);
    const englishName = englishNameMatch ? englishNameMatch[1] : artistName;

    // Phase 0: Check Firestore Overrides (Sustainable Backend Solution)
    if (adminFirestore) {
        try {
            // 0a: Priority 1 - Manual Overrides (Admin Set)
            const manualDoc = await adminFirestore.collection('artist_images').doc(artistName).get();
            if (manualDoc.exists && manualDoc.data()?.imageUrl) {
                console.log(`✅ [ImageAPI] Found Manual override for ${artistName}`);
                return res.redirect(manualDoc.data()?.imageUrl);
            }

            // 0b: Priority 2 - Auto-Cache (Previously found and saved)
            const autoDoc = await adminFirestore.collection('auto_artist_images').doc(artistName).get();
            if (autoDoc.exists && autoDoc.data()?.imageUrl) {
                console.log(`⚡ [ImageAPI] Found Auto-Cache for ${artistName}`);
                return res.redirect(autoDoc.data()?.imageUrl);
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
              }
          } catch (e) {}
      }

      const jooxQueries = [artistName, artistName.replace(/ /g, ''), englishName];
      for (const q of jooxQueries) {
          if (!q) continue;
          
          const cookie = (wmid && sessionKey) ? `wmid=${wmid}; session_key=${sessionKey};` : '';
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

          if (!artistItem) {
              const v2Resp = await axios.get(`https://cache.api.joox.com/openjoox/v2/search_type?country=th&lang=th&key=${encodeURIComponent(q)}&type=2`, { 
                  timeout: 2000,
                  headers: { 'Referer': 'https://www.joox.com/' }
              });
              artistItem = v2Resp.data?.item_list?.[0];
          }

          if (artistItem && artistItem.images) {
              const highRes = artistItem.images.find((img: any) => img.width === 1000 || img.url?.includes('/1000'));
              let imgUrl = (highRes || artistItem.images[0])?.url;
              
              if (!imgUrl && artistItem.images[0]?.id) {
                  imgUrl = `https://image.joox.com/JOOXcover/0/${artistItem.images[0].id}/1000`;
              }

              if (imgUrl) {
                  const finalUrl = imgUrl.replace(/\/(100|300|640)$/, '/1000');
                  
                  // 🔥 Save to Auto-Cache (Don't wait for it to return response faster)
                  if (adminFirestore) {
                      adminFirestore.collection('auto_artist_images').doc(artistName).set({
                          imageUrl: finalUrl,
                          updatedAt: new Date().toISOString(),
                          source: 'joox'
                      }).catch(() => {});
                  }

                  return res.redirect(finalUrl);
              }
          }
      }
    } catch (e) {}

    // Phase 2: Try Wikipedia (Fallbacks also get cached)
    try {
      const wikiResp = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(englishName)}`, { timeout: 1500 });
      if (wikiResp.data?.originalimage?.source) {
          const wikiUrl = wikiResp.data.originalimage.source;
          if (adminFirestore) {
            adminFirestore.collection('auto_artist_images').doc(artistName).set({
                imageUrl: wikiUrl,
                updatedAt: new Date().toISOString(),
                source: 'wikipedia'
            }).catch(() => {});
          }
          return res.redirect(wikiUrl);
      }
    } catch (e) {}

    return res.redirect("/assets/avatar.jpeg");
  } catch (error) {
    return res.redirect("/assets/avatar.jpeg");
  }
}
