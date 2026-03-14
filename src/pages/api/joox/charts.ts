import type { NextApiRequest, NextApiResponse } from "next";
import { adminFirestore } from "@/firebase-admin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const force = req.query.force === 'true';
    const test = req.query.test === 'true';
    
    if (test) {
      return res.status(200).json({ 
        method: req.method, 
        hasBody: !!req.body,
        bodyKeys: Object.keys(req.body || {}),
        firestore: !!adminFirestore 
      });
    }

    // Allow manual seeding if JOOX blocks Vercel IPs
    if (req.method === 'POST') {
      const { charts, secret } = req.body;
      if (secret !== 'OKE_SEED_2024') { 
        return res.status(401).json({ error: "Unauthorized", received: secret, method: req.method });
      }

      if (adminFirestore && Array.isArray(charts) && charts.length > 0) {
        await adminFirestore.collection('system_cache').doc('joox_charts').set({
          updatedAt: new Date().toISOString(),
          charts: charts
        });
        console.log('✅ Cache seeded manually via POST');
        return res.status(200).json({ status: "success", message: "Cache seeded manually" });
      }
      return res.status(400).json({ error: "Invalid data" });
    }

    const allowedCharts = [
      { id: 42, name: "Thailand Top 100" },
      { id: 128, name: "อันดับเพลงใหม่" },
      { id: 133, name: "อันดับเพลงมาแรง" },
      { id: 57, name: "THTOP100 2024" }
    ];

    if (adminFirestore && !force) {
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

    const fetchChart = (chart: { id: number; name: string }, depth = 0): Promise<any> => {
      if (depth > 3) return Promise.resolve(null);
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
              'Referer': 'https://www.joox.com/th/charts',
            }
          };

          const reqObj = https.request(options, (responseObj: any) => {
            if ([301, 302, 307, 308].includes(responseObj.statusCode) && responseObj.headers.location) {
              const loc = responseObj.headers.location;
              console.log(`Redirecting chart ${chart.id} to ${loc}`);
              return resolve(null); 
            }

            let html = '';
            responseObj.on('data', (chunk: any) => { html += chunk; });
            responseObj.on('end', () => {
              if (responseObj.statusCode !== 200) {
                console.error(`JOOX HTTP ${responseObj.statusCode} for chart ${chart.id}`);
                return resolve(null);
              }

              const match = html.match(/<script id="__NEXT_DATA__".*?>(.*?)<\/script>/);
              if (!match || !match[1]) {
                console.error(`No __NEXT_DATA__ found for chart ${chart.id}. HTML length: ${html.length}`);
                return resolve({ id: chart.id, name: chart.name, singles: [], debug: 'no_v_data', htmlLen: html.length });
              }

              try {
                const nextData = JSON.parse(match[1]);
                const pageProps = nextData?.props?.pageProps;
                
                // Try multiple paths for items
                let items = pageProps?.trackList?.tracks?.items || 
                            pageProps?.tracks?.items || 
                            pageProps?.tracks || 
                            pageProps?.initialData?.trackList?.tracks?.items;
                
                if (!Array.isArray(items)) items = [];
                
                const singles = items.map((song: any) => {
                  const songId = song.id || song.track_id || song.trackId;
                  const bestImage =
                    song.images?.find((img: any) => img.width === 1000)?.url ||
                    song.images?.[0]?.url ||
                    song.album_pic || 
                    "";

                  const artistName = (song.artist_list || song.artists || [])
                    .map((a: any) => a.name)
                    .join(", ");

                  return {
                    id: songId,
                    title: song.name || song.track_name,
                    artist_name: artistName,
                    coverImageURL: bestImage,
                  };
                });

                resolve({
                  id: chart.id,
                  name: chart.name,
                  singles,
                  debug: {
                    itemCount: items.length,
                    foundTracks: singles.length > 0
                  }
                });
              } catch (e) {
                 console.error(`JSON Parse/Map error for chart ${chart.id}:`, e);
                 resolve({ id: chart.id, name: chart.name, singles: [], debug: 'parse_error' });
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

    const results = await Promise.all(allowedCharts.map(c => fetchChart(c)));
    let finalCharts = results.filter(c => c !== null);

    const totalSongs = finalCharts.reduce((sum, c) => sum + (c.singles?.length || 0), 0);

    // If fetching failed OR returned 0 songs, try to serve ANY available cache as fallback
    if (totalSongs === 0 && adminFirestore) {
      const cacheDoc = await adminFirestore.collection('system_cache').doc('joox_charts').get();
      if (cacheDoc.exists) {
        const data = cacheDoc.data();
        if (data && data.charts && data.charts.length > 0) {
          const cacheTotalSongs = data.charts.reduce((sum: number, c: any) => sum + (c.singles?.length || 0), 0);
          if (cacheTotalSongs > 0) {
            res.setHeader("Cache-Control", "no-store");
            return res.status(200).json({ 
                status: "success", 
                charts: data.charts, 
                fallback: true,
                staleAt: data.updatedAt 
            });
          }
        }
      }
    }

    if (totalSongs > 0) {
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

    if (totalSongs > 0) {
       res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    } else {
       res.setHeader("Cache-Control", "no-store, max-age=0");
    }
    
    res.status(200).json({ 
        status: "success", 
        charts: finalCharts,
        debug: { totalSongs, chartCount: finalCharts.length, forceUsed: force }
    });
  } catch (error: any) {
    console.error("Error fetching JOOX charts:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
}
