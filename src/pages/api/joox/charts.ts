import type { NextApiRequest, NextApiResponse } from "next";
import { adminFirestore } from "@/firebase-admin";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Allow manual seeding if JOOX blocks Vercel IPs
  if (req.method === 'POST') {
    const { charts, secret } = req.body;
    if (secret === 'OKE_SEED_2024' && adminFirestore && Array.isArray(charts)) {
      await adminFirestore.collection('system_cache').doc('joox_charts').set({
        updatedAt: new Date().toISOString(),
        charts: charts
      });
      return res.status(200).json({ status: "success", seeded: true, count: charts.length });
    }
    return res.status(401).json({ status: "error", message: "Unauthorized or invalid data", method: req.method });
  }

  try {
    const force = req.query.force === 'true';

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
                return resolve({ id: chart.id, name: chart.name, singles: [], debug: 'no_v_data', htmlLen: html.length, snippet: html.substring(0, 200) });
              }

              try {
                const nextData = JSON.parse(match[1]);
                const pageProps = nextData?.props?.pageProps || {};
                
                // Deep search for tracks in various possible paths
                let items = pageProps?.trackList?.tracks?.items || 
                            pageProps?.tracks?.items || 
                            pageProps?.tracks || 
                            pageProps?.initialData?.trackList?.tracks?.items ||
                            pageProps?.initialData?.tracks?.items ||
                            pageProps?.data?.trackList?.tracks?.items ||
                            [];
                
                if (!Array.isArray(items)) {
                   // If still not an array, check if it's wrapped in an object we missed
                   items = [];
                }
                
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
                    pathFound: !!pageProps?.trackList ? 'trackList' : (!!pageProps?.tracks ? 'tracks' : 'none'),
                    pagePropsKeys: Object.keys(pageProps).slice(0, 15)
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

    let totalSongs = finalCharts.reduce((sum, c) => sum + (c.singles?.length || 0), 0);

    // 1. Fallback to Firestore Cache
    if (totalSongs === 0 && adminFirestore) {
      try {
        console.log("🔍 Checking Firestore cache for JOOX charts (Fallback Mode)...");
        const cacheDoc = await adminFirestore.collection('system_cache').doc('joox_charts').get();
        if (cacheDoc.exists) {
          const data = cacheDoc.data();
          if (data && data.charts && data.charts.length > 0) {
            const cacheTotalSongs = data.charts.reduce((sum: number, c: any) => sum + (c.singles?.length || 0), 0);
            if (cacheTotalSongs > 0) {
              console.log("⚡ Serving JOOX charts from Firestore Cache as fallback!");
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
      } catch (err) {
        console.error("❌ Failed to read Firestore cache fallback:", err);
      }
    }

    // 2. Fallback to Spotify Curated Playlists
    if (totalSongs === 0) {
      try {
        console.log("⚠️ JOOX & Firestore cache empty, attempting Spotify curated playlists fallback...");
        const { getAccessToken } = await import("@/modules/spotify-theme/services/auth");
        const accessToken = await getAccessToken().catch(() => null);
        if (accessToken) {
          const axios = (await import("axios")).default;
          const spotifyCharts = [
            { id: 42, name: "Thailand Top 100", playlistId: "3oLUwlQTdzsCkTK72wCbv9" },
            { id: 128, name: "อันดับเพลงใหม่", playlistId: "37i9dQZF1DX4F65Zr44g7e" },
            { id: 133, name: "อันดับเพลงมาแรง", playlistId: "37i9dQZF1DXcBWDOXla6n6" },
            { id: 57, name: "THTOP100 2024", playlistId: "37i9dQZF1DX5E5X2d19tQG" }
          ];

          const spotifyResults = await Promise.all(spotifyCharts.map(async (chart) => {
             try {
                const response = await axios.get(`https://api.spotify.com/v1/playlists/${chart.playlistId}/tracks`, {
                   headers: { Authorization: `Bearer ${accessToken}` }
                });
                const tracks = response.data.items || [];
                const singles = tracks
                   .filter((item: any) => item?.track)
                   .map((item: any) => {
                      const track = item.track;
                      return {
                         id: track.id,
                         title: track.name,
                         artist_name: track.artists.map((a: any) => a.name).join(", "),
                         coverImageURL: track.album?.images?.[0]?.url || ""
                      };
                   })
                   .slice(0, 30);
                
                return {
                   id: chart.id,
                   name: chart.name,
                   singles
                };
             } catch (err: any) {
                console.error(`Spotify fetch failed for ${chart.name}:`, err.message);
                return null;
             }
          }));
          
          const validSpotifyCharts = spotifyResults.filter(c => c !== null && c.singles.length > 0);
          if (validSpotifyCharts.length > 0) {
             finalCharts = validSpotifyCharts;
             totalSongs = finalCharts.reduce((sum, c) => sum + (c.singles?.length || 0), 0);
             console.log(`✅ Spotify Fallback Successful! Fetched ${totalSongs} songs across ${finalCharts.length} charts.`);
          }
        }
      } catch (spotifyErr: any) {
        console.error("❌ Spotify fallback failed:", spotifyErr.message);
      }
    }

    // 3. Fallback to YouTube Search Scraper
    if (totalSongs === 0) {
      try {
        console.log("⚠️ Spotify fallback failed or not configured, attempting YouTube search scraper fallback...");
        const { scrapeYouTubeSearch } = await import("@/utils/youtubeScraper");
        
        const youtubeCharts = [
          { id: 42, name: "Thailand Top 100", query: "เพลงไทยฮิตล่าสุด 2026" },
          { id: 128, name: "อันดับเพลงใหม่", query: "เพลงใหม่ล่าสุด 2026" },
          { id: 133, name: "อันดับเพลงมาแรง", query: "เพลงใหม่มาแรง 2026" },
          { id: 57, name: "THTOP100 2024", query: "เพลงไทยฮิตตลอดกาล" }
        ];

        const ytResults = await Promise.all(youtubeCharts.map(async (chart) => {
           try {
              const results = await scrapeYouTubeSearch(chart.query);
              const singles = results.slice(0, 30).map(item => ({
                 id: item.videoId,
                 title: item.title,
                 artist_name: item.author || "YouTube Music",
                 coverImageURL: item.videoThumbnails?.[0]?.url || item.videoThumbnails?.[1]?.url || ""
              }));
              return {
                 id: chart.id,
                 name: chart.name,
                 singles
              };
           } catch (err: any) {
              console.error(`YouTube fetch failed for ${chart.name}:`, err.message);
              return null;
           }
        }));
        
        const validYtCharts = ytResults.filter(c => c !== null && c.singles.length > 0);
        if (validYtCharts.length > 0) {
           finalCharts = validYtCharts;
           totalSongs = finalCharts.reduce((sum, c) => sum + (c.singles?.length || 0), 0);
           console.log(`✅ YouTube Fallback Successful! Fetched ${totalSongs} songs across ${finalCharts.length} charts.`);
        }
      } catch (ytErr: any) {
        console.error("❌ YouTube fallback failed:", ytErr.message);
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
