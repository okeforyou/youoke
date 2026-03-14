import type { NextApiRequest, NextApiResponse } from "next";
import { adminFirestore } from "@/firebase-admin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const allowedCharts = [
      { id: 42, name: "Thailand Top 100" },
      { id: 128, name: "อันดับเพลงใหม่" },
      { id: 133, name: "อันดับเพลงมาแรง" },
      { id: 57, name: "THTOP100 2024" }
    ];

    if (adminFirestore) {
      try {
        console.log("🔍 Checking Firestore cache for JOOX charts...");
        const cacheDoc = await adminFirestore.collection('system_cache').doc('joox_charts').get();
        if (cacheDoc.exists) {
          const data = cacheDoc.data();
          if (data && data.updatedAt && Array.isArray(data.charts) && data.charts.length > 0) {
            const cacheAge = new Date().getTime() - new Date(data.updatedAt).getTime();
            
            // Validate that charts actually have singles
            const hasSingles = data.charts.some((c: any) => Array.isArray(c.singles) && c.singles.length > 0);
            
            // If cache is less than 24 hours old and has valid data, return it.
            if (cacheAge < 24 * 60 * 60 * 1000 && hasSingles) {
              console.log("⚡ Serving JOOX charts from Firestore Cache (Last updated:", data.updatedAt, ")");
              res.setHeader("Cache-Control", "public, s-maxage=2592000, stale-while-revalidate=86400");
              return res.status(200).json({ status: "success", charts: data.charts });
            } else {
              console.log("⚠️ Cache is stale or empty of singles, fetching fresh data from JOOX...");
            }
          }
        }
      } catch (err) {
        console.error("❌ Failed to read Firestore cache:", err);
      }
    }

    const fetchChart = (chart: {id: number, name: string}): Promise<any> => {
      return new Promise((resolve) => {
        try {
          const https = require('https');
          const options = {
            hostname: 'www.joox.com',
            path: `/th/chart/${chart.id}`,
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
              'Accept-Language': 'th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7',
            }
          };

          const reqObj = https.request(options, (responseObj: any) => {
            let html = '';
            responseObj.on('data', (chunk: any) => { html += chunk; });
            responseObj.on('end', () => {
              if (responseObj.statusCode !== 200) {
                console.error(`JOOX HTTP ${responseObj.statusCode} for chart ${chart.id}`);
                return resolve(null);
              }

              const match = html.match(/<script id="__NEXT_DATA__".*?>(.*?)<\/script>/);
              if (!match || !match[1]) return resolve(null);

              try {
                const nextData = JSON.parse(match[1]);
                const items = nextData?.props?.pageProps?.trackList?.tracks?.items || [];
                
                const singles = items.map((song: any) => {
                  const bestImage =
                    song.images?.find((img: any) => img.width === 1000)?.url ||
                    song.images?.[0]?.url ||
                    "";

                  const artistName = (song.artist_list || [])
                    .map((a: any) => a.name)
                    .join(", ");

                  return {
                    id: song.id,
                    title: song.name,
                    artist_name: artistName,
                    coverImageURL: bestImage,
                  };
                });

                resolve({
                  id: chart.id,
                  name: chart.name,
                  singles,
                });
              } catch (e) {
                 resolve(null);
              }
            });
          });

          reqObj.on('error', (e: any) => {
            console.error("HTTPS request error:", e);
            resolve(null);
          });
          reqObj.end();
        } catch (e) {
          console.error("fetchChart error:", e);
          resolve(null);
        }
      });
    };

    const results = await Promise.all(allowedCharts.map(fetchChart));
    let finalCharts = results.filter(c => c !== null);

    // If fetching failed (e.g. blocked or JOOX down), try to serve ANY available cache as fallback
    if (finalCharts.length === 0 && adminFirestore) {
      console.log("⚠️ Fresh fetch failed. Attempting to serve ANY stale cache as fallback...");
      const cacheDoc = await adminFirestore.collection('system_cache').doc('joox_charts').get();
      if (cacheDoc.exists) {
        const data = cacheDoc.data();
        if (data && data.charts && data.charts.length > 0) {
          console.log("🩹 Serving STALE Firestore Cache as emergency fallback");
          return res.status(200).json({ status: "success", charts: data.charts, fallback: true });
        }
      }
    }

    // If new data was fetched, cache it to Firestore backend.
    if (finalCharts.length > 0 && finalCharts.some(c => c.singles.length > 0)) {
      if (adminFirestore) {
        try {
          const docRef = adminFirestore.collection('system_cache').doc('joox_charts');
          await docRef.set({
            updatedAt: new Date().toISOString(),
            charts: finalCharts
          });
          console.log("✅ Cached new JOOX charts to Firestore");
        } catch (err: any) {
          console.error("Failed to cache to Firestore:", err.message);
        }
      }
    }

    const hasSingles = finalCharts.some(c => c.singles.length > 0);
    // If we have actual singles data, cache it at Vercel edge for 1 hour.
    // If not (empty array), do not cache at all, to force refetch next time.
    if (hasSingles) {
       res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    } else {
       res.setHeader("Cache-Control", "no-store, max-age=0");
       console.log("⚠️ Refusing to cache empty dataset at Vercel Edge");
    }
    
    res.status(200).json({ status: "success", charts: finalCharts });
  } catch (error: any) {
    console.error("Error fetching JOOX charts:", error);
    res.status(500).json({ status: "error", message: error.message, stack: error.stack });
  }
}
