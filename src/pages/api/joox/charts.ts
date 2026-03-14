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
              // No Accept-Encoding to avoid gzip/br manually for now
            }
          };

          const reqObj = https.request(options, (responseObj: any) => {
            // Handle redirect
            if ([301, 302, 307, 308].includes(responseObj.statusCode) && responseObj.headers.location) {
              const loc = responseObj.headers.location;
              console.log(`Redirecting chart ${chart.id} to ${loc}`);
              // Implementation of relative redirect follow could be added here if needed
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
                
                // Try different common paths for track items
                let items = nextData?.props?.pageProps?.trackList?.tracks?.items;
                if (!items) items = nextData?.props?.pageProps?.tracks?.items;
                if (!items) items = nextData?.props?.pageProps?.tracks;
                if (!Array.isArray(items)) items = [];
                
                const singles = items.map((song: any) => {
                  // Fallback for ID as it can be track_id or id
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
                  debug: singles.length > 0 ? 'ok' : 'empty_items',
                  pathUsed: nextData?.props?.pageProps?.trackList ? 'trackList' : (nextData?.props?.pageProps?.tracks ? 'tracks' : 'none')
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

    // CRITICAL: Check if we actually got ANY songs. 
    // If we got charts but 0 songs total, it's a failure.
    const totalSongs = finalCharts.reduce((sum, c) => sum + (c.singles?.length || 0), 0);

    // If fetching failed OR returned 0 songs, try to serve ANY available cache as fallback
    if (totalSongs === 0 && adminFirestore) {
      console.log("⚠️ Fresh fetch returned 0 songs. Attempting to serve ANY stale cache as fallback...");
      const cacheDoc = await adminFirestore.collection('system_cache').doc('joox_charts').get();
      if (cacheDoc.exists) {
        const data = cacheDoc.data();
        if (data && data.charts && data.charts.length > 0) {
          const cacheTotalSongs = data.charts.reduce((sum: number, c: any) => sum + (c.singles?.length || 0), 0);
          if (cacheTotalSongs > 0) {
            console.log("🩹 Serving STALE Firestore Cache as emergency fallback");
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

    // If new data was fetched AND has actual songs, cache it.
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

    // Edge caching logic
    if (totalSongs > 0) {
       res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
    } else {
       res.setHeader("Cache-Control", "no-store, max-age=0");
    }
    
    res.status(200).json({ 
        status: "success", 
        charts: finalCharts,
        debug: { totalSongs, chartCount: finalCharts.length }
    });
  } catch (error: any) {
    console.error("Error fetching JOOX charts:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
}
