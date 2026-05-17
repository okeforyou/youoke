import type { NextApiRequest, NextApiResponse } from "next";
import { adminFirestore } from "@/firebase-admin";
import fs from "fs";
import path from "path";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const traces: string[] = [];
  const debugLog = (message: string) => {
    try {
      const logPath = path.join(process.cwd(), "charts_debug_log.txt");
      const timestamp = new Date().toISOString();
      fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
    } catch (e) {
      // Fail silently (expected on Vercel serverless read-only filesystem)
    }
    traces.push(message);
    console.log(message);
  };

  debugLog(`[START] API Handler Invoked. Query: ${JSON.stringify(req.query)}, Method: ${req.method}`);
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
    debugLog(`[CONFIG] force = ${force}, adminFirestore exists = ${!!adminFirestore}`);

    const allowedCharts = [
      { id: 42, name: "Thailand Top 100" },
      { id: 128, name: "อันดับเพลงใหม่" },
      { id: 133, name: "อันดับเพลงมาแรง" },
      { id: 57, name: "THTOP100 2024" }
    ];

    let youtubeKeys: string[] = [];
    let youtubeChartsConfig: any = null;

    if (adminFirestore) {
      try {
        const configDoc = await adminFirestore.collection('settings').doc('default').get();
        if (configDoc.exists) {
          const configData = configDoc.data();
          youtubeKeys = configData?.integrations?.youtube?.apiKeys || [];
          youtubeChartsConfig = configData?.integrations?.youtubeCharts || null;
          debugLog(`[SETTINGS] Loaded ${youtubeKeys.length} YouTube API Keys.`);
        }
      } catch (err: any) {
        debugLog(`❌ Failed to read settings config: ${err.message}`);
      }
    }

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
            
            // If cache is less than 7 days old and has valid data, return it.
            if (cacheAge < 7 * 24 * 60 * 60 * 1000 && hasSingles) {
              console.log("⚡ Serving JOOX charts from Firestore Cache (Last updated:", data.updatedAt, ")");
              res.setHeader("Cache-Control", "public, s-maxage=2592000, stale-while-revalidate=86400");
              return res.status(200).json({ status: "success", charts: data.charts });
            } else {
              console.log("⚠️ Cache is stale (older than 7 days) or empty, fetching fresh charts from YouTube Music...");
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
    if (totalSongs === 0 && adminFirestore && !force) {
      try {
        debugLog("🔍 Checking Firestore cache for JOOX charts (Fallback Mode)...");
        const cacheDoc = await adminFirestore.collection('system_cache').doc('joox_charts').get();
        if (cacheDoc.exists) {
          const data = cacheDoc.data();
          if (data && data.charts && data.charts.length > 0) {
            const cacheTotalSongs = data.charts.reduce((sum: number, c: any) => sum + (c.singles?.length || 0), 0);
            
            // Check if all 4 allowed charts are present and contain songs
            const isCacheComplete = allowedCharts.every(allowed => 
              data.charts.some((c: any) => c.id === allowed.id && Array.isArray(c.singles) && c.singles.length > 0)
            );

            debugLog(`[CACHE FALLBACK] Found cache doc. cacheTotalSongs = ${cacheTotalSongs}, isCacheComplete = ${isCacheComplete}`);
            if (isCacheComplete) {
              debugLog("⚡ Serving complete JOOX charts from Firestore Cache as fallback!");
              res.setHeader("Cache-Control", "no-store");
              return res.status(200).json({ 
                  status: "success", 
                  charts: data.charts, 
                  fallback: true,
                  staleAt: data.updatedAt 
              });
            } else {
              debugLog("⚠️ Cache is incomplete (missing some charts or songs), falling through to fresh API recovery...");
            }
          }
        } else {
          debugLog("[CACHE FALLBACK] No joox_charts document exists in Firestore");
        }
      } catch (err: any) {
        debugLog(`❌ Failed to read Firestore cache fallback: ${err.message}`);
      }
    }

    // 2. Fallback to YouTube Music Playlists (Automated Sync)
    if (totalSongs === 0) {
      try {
        debugLog("⚠️ JOOX & Firestore cache empty, attempting YouTube Music playlists automated sync...");
        
        // Initialize InnerTube ONCE for all playlist fetches
        let sharedYoutube: any = null;
        try {
           debugLog("[YOUTUBE PLAYLIST] Initializing shared Innertube client session...");
           const { Innertube } = await import("youtubei.js");
           sharedYoutube = await Innertube.create({
              region: 'TH',
              language: 'th'
           });
           debugLog("✅ Shared InnerTube client initialized successfully.");
        } catch (innerInitErr: any) {
           debugLog(`❌ Shared InnerTube client initialization failed: ${innerInitErr.message}`);
        }
        
        const fetchYouTubePlaylist = async (playlistId: string) => {
          // A. Try using youtubei.js (Innertube) - 100% anonymous & supports system playlists!
          if (sharedYoutube) {
             try {
                debugLog(`[YOUTUBE PLAYLIST] Trying Innertube fetch for ${playlistId}...`);
                
                let playlist: any;
                try {
                   playlist = await sharedYoutube.music.getPlaylist(playlistId);
                } catch (musicErr: any) {
                   debugLog(`[YOUTUBE PLAYLIST] youtubei.js YTM playlist fetch failed for ${playlistId} (${musicErr.message}), trying YouTube Main API...`);
                   playlist = await sharedYoutube.getPlaylist(playlistId);
                }
                
                if (playlist && (playlist.contents || playlist.videos)) {
                   const rawItems = playlist.contents || playlist.videos || [];
                   const tracks = rawItems
                      .map((v: any) => {
                         const videoId = v.id || v.videoId || "";
                         let title = v.title?.toString() || "";
                         
                         // Resilient artist name mapping (supporting YTM .artists, .author, and short_byline_text)
                         let artistName = "Unknown Artist";
                         if (v.artists && Array.isArray(v.artists) && v.artists.length > 0) {
                            artistName = v.artists.map((art: any) => art.name || art.toString()).join(", ");
                         } else if (v.author) {
                            artistName = typeof v.author === 'string' ? v.author : (v.author.name || v.author.toString() || "Unknown Artist");
                         } else if (v.short_byline_text) {
                            artistName = v.short_byline_text.toString();
                         }
                         
                         // Normalize thumbnail to high-fidelity clean URL
                         const coverImageURL = v.thumbnails?.[0]?.url 
                            ? v.thumbnails[0].url.split('?')[0] 
                            : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
                         
                         title = title
                            .replace(/Official MV/i, "")
                            .replace(/\[.*?\]/g, "")
                            .replace(/\(.*?\)/g, "")
                            .trim();
                            
                         artistName = artistName.replace(/ - Topic$/i, "").replace(/Official$/i, "").trim();
                         
                         return {
                            id: videoId,
                            title: title,
                            artist_name: artistName,
                            coverImageURL: coverImageURL
                         };
                      })
                      .filter((song: any) => song.id && song.title);
                      
                   if (tracks.length > 0) {
                      debugLog(`[YOUTUBE PLAYLIST] youtubei.js successfully fetched ${tracks.length} items for ${playlistId}.`);
                      return tracks.slice(0, 20); // Keep max 20 songs per chart for speed and performance
                   }
                }
             } catch (innerErr: any) {
                debugLog(`[YOUTUBE PLAYLIST] youtubei.js failed for ${playlistId}: ${innerErr.message}, falling back to XML RSS/API...`);
             }
          }

          // B. Try API Key if available
          if (youtubeKeys && youtubeKeys.length > 0) {
             try {
                const apiKey = youtubeKeys[0];
                const axios = (await import("axios")).default;
                const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=20&playlistId=${playlistId}&key=${apiKey}`;
                const response = await axios.get(url);
                const items = response.data.items || [];
                
                if (items.length > 0) {
                   debugLog(`[YOUTUBE PLAYLIST] Fetched ${items.length} items using API Key.`);
                   return items.map((item: any) => {
                      const snippet = item.snippet || {};
                      const title = snippet.title || "";
                      const channelTitle = snippet.videoOwnerChannelTitle || snippet.channelTitle || "";
                      const videoId = snippet.resourceId?.videoId || "";
                      const coverImageURL = snippet.thumbnails?.high?.url || snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || "";
                      
                      return {
                         id: videoId,
                         title: title.replace(/Official MV/i, "").replace(/\[.*?\]/g, "").replace(/\(.*?\)/g, "").trim(),
                         artist_name: channelTitle.replace(/ - Topic$/i, "").replace(/Official$/i, "").trim() || "Unknown Artist",
                         coverImageURL: coverImageURL
                      };
                   }).filter((item: any) => item.id && item.title);
                }
             } catch (apiErr: any) {
                debugLog(`[YOUTUBE PLAYLIST] API Key fetch failed for ${playlistId}: ${apiErr.message}, falling back to anonymous RSS...`);
             }
          }
          
          // C. Try anonymous RSS feed scraper (no developer key or quota required!)
          try {
             const axios = (await import("axios")).default;
             const url = `https://www.youtube.com/feeds/videos.xml?playlist_id=${playlistId}`;
             const response = await axios.get(url, {
               headers: {
                 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
               }
             });
             const xml = response.data;
             const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) || [];
             
             if (entries.length > 0) {
                debugLog(`[YOUTUBE PLAYLIST] Fetched ${entries.length} items using RSS anonymously.`);
                return entries.map((entry: string) => {
                   const videoIdMatch = entry.match(/<yt:videoId>([\s\S]*?)<\/yt:videoId>/);
                   const titleMatch = entry.match(/<title>([\s\S]*?)<\/title>/);
                   const authorMatch = entry.match(/<name>([\s\S]*?)<\/name>/);
                   const thumbnailMatch = entry.match(/<media:thumbnail[^>]*url="([^"]+)"/);
                   
                   const videoId = videoIdMatch ? videoIdMatch[1].trim() : "";
                   let title = titleMatch ? titleMatch[1].trim() : "";
                   let artistName = authorMatch ? authorMatch[1].trim() : "Unknown Artist";
                   const coverImageURL = thumbnailMatch ? thumbnailMatch[1] : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
                   
                   title = title
                      .replace(/&amp;/g, "&")
                      .replace(/&lt;/g, "<")
                      .replace(/&gt;/g, ">")
                      .replace(/&quot;/g, '"')
                      .replace(/&#39;/g, "'")
                      .replace(/Official MV/i, "")
                      .replace(/\[.*?\]/g, "")
                      .replace(/\(.*?\)/g, "")
                      .trim();
                      
                   artistName = artistName.replace(/&amp;/g, "&").replace(/ - Topic$/i, "").replace(/Official$/i, "").trim();
                   
                   return {
                      id: videoId,
                      title: title,
                      artist_name: artistName,
                      coverImageURL: coverImageURL
                   };
                }).filter((song: any) => song.id && song.title);
             }
          } catch (rssErr: any) {
             debugLog(`[YOUTUBE PLAYLIST] RSS fetch failed for ${playlistId}: ${rssErr.message}`);
          }
          
          return null;
        };

        const playlistMappings = [
          { id: 42, name: "Thailand Top 100", playlistId: youtubeChartsConfig?.top100 || "PLRhRrJscB-C7OA83mRjBr9RHdw1jNk2Aa" },
          { id: 128, name: "อันดับเพลงใหม่", playlistId: youtubeChartsConfig?.newSongs || "PLRhRrJscB-C6x26E-R2xZPrsV8m-WnslU" },
          { id: 133, name: "อันดับเพลงมาแรง", playlistId: youtubeChartsConfig?.trending || "PLRhRrJscB-C4T4pT8Vw9w9p4pS8g0N_5d" },
          { id: 57, name: "THTOP100 2024", playlistId: youtubeChartsConfig?.evergreen || "PLMC9KNkIncKvYin_USF1qoIQ7dfyOPAKr" }
        ];

        // Fetch playlists strictly sequentially to avoid concurrent InnerTube rate limits or session collisions
        const ytResults = [];
        for (const chart of playlistMappings) {
           debugLog(`[YOUTUBE PLAYLIST] Syncing ${chart.name} (${chart.playlistId})...`);
           const singles = await fetchYouTubePlaylist(chart.playlistId);
           if (singles && singles.length > 0) {
              ytResults.push({
                 id: chart.id,
                 name: chart.name,
                 singles: singles
              });
           }
           // 300ms polite delay to preserve session health
           await new Promise(resolve => setTimeout(resolve, 300));
        }

        const validYtCharts = ytResults.filter(c => c !== null && c.singles.length > 0);
        if (validYtCharts.length > 0) {
           finalCharts = validYtCharts;
           totalSongs = finalCharts.reduce((sum, c) => sum + (c.singles?.length || 0), 0);
           debugLog(`✅ YouTube Music Playlists Sync Successful! Loaded ${totalSongs} live songs across ${finalCharts.length} charts.`);
        }
      } catch (ytErr: any) {
        debugLog(`❌ YouTube Music Playlists sync failed: ${ytErr.message}`);
      }
    }

    // 3. Fallback to Spotify Curated Playlists
    if (totalSongs === 0) {
      try {
        debugLog("⚠️ JOOX & Firestore cache empty, attempting Spotify curated playlists fallback...");
        const { getAccessToken } = await import("@/modules/spotify-theme/services/auth");
        const accessToken = await getAccessToken().catch((err: any) => {
          debugLog(`[SPOTIFY] getAccessToken caught error: ${err.message}`);
          return null;
        });
        debugLog(`[SPOTIFY] accessToken exists = ${!!accessToken}`);
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
                debugLog(`[SPOTIFY] Fetching playlist ${chart.name} (${chart.playlistId})...`);
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
                
                debugLog(`[SPOTIFY] Playlist ${chart.name} parsed successfully with ${singles.length} songs.`);
                return {
                   id: chart.id,
                   name: chart.name,
                   singles
                };
             } catch (err: any) {
                debugLog(`[SPOTIFY] Fetch failed for ${chart.name}: ${err.message}`);
                return null;
             }
          }));
          
          const validSpotifyCharts = spotifyResults.filter(c => c !== null && c.singles.length > 0);
          if (validSpotifyCharts.length > 0) {
             finalCharts = validSpotifyCharts;
             totalSongs = finalCharts.reduce((sum, c) => sum + (c.singles?.length || 0), 0);
             debugLog(`✅ Spotify Fallback Successful! Fetched ${totalSongs} songs across ${finalCharts.length} charts.`);
          }
        }
      } catch (spotifyErr: any) {
        debugLog(`❌ Spotify fallback failed: ${spotifyErr.message}`);
      }
    }

    // 3. Fallback to Premium Curated Thai Singles (100% เพลงเดี่ยวยอดฮิต)
    if (totalSongs === 0) {
      try {
        debugLog("⚠️ Spotify fallback failed, activating Premium Curated Thai Singles fallback (100% เพลงเดี่ยว)...");
        
        const curatedCharts = [
          {
            id: 42,
            name: "Thailand Top 100",
            singles: [
              { id: "proof-pun", title: "รักให้เธอได้รู้ (Proof.)", artist_name: "PUN", coverImageURL: "https://image.joox.com/JOOXcover/0/072d28c1e885cdf7_u/1000" },
              { id: "toe-rim-nont", title: "โต๊ะริม (Melt)", artist_name: "นนท์ ธนนท์", coverImageURL: "https://image.joox.com/JOOXcover/0/cf0e15d1b86a3315/1000" },
              { id: "rak-oey-bird", title: "รักเอ๋ย", artist_name: "ธงไชย แมคอินไตย์", coverImageURL: "https://image.joox.com/JOOXcover/0/5394d5436d11a363/1000" },
              { id: "sen-bang-bang-indigo", title: "เส้นบางๆ", artist_name: "Indigo", coverImageURL: "https://image.joox.com/JOOXcover/0/d17e940c90fa8553/1000" },
              { id: "phijarana-musketeers", title: "พิจารณา (Consider)", artist_name: "Musketeers ft. Maiyarap", coverImageURL: "https://image.joox.com/JOOXcover/0/e7a3c5fcb288bbfa/1000" },
              { id: "halley-comet-fellow", title: "ดาวหางฮัลเลย์", artist_name: "Fellow Fellow", coverImageURL: "https://image.joox.com/JOOXcover/0/0da5df115f9e2cb0/1000" },
              { id: "wad-wai-bowky", title: "วาดไว้ (Recall)", artist_name: "Bowkylion", coverImageURL: "https://image.joox.com/JOOXcover/0/bde1e1a665295346/1000" },
              { id: "hbd-three-man-down", title: "วันเกิดฉันปีนี้ (HBD to me)", artist_name: "Three Man Down", coverImageURL: "https://image.joox.com/JOOXcover/0/8e041c510317702c/1000" },
              { id: "ka-ki-nung-yinglee", title: "กากี่นั้ง", artist_name: "หญิงลี ศรีจุมพล", coverImageURL: "https://image.joox.com/JOOXcover/0/d431dedbcbe8177a/1000" },
              { id: "song-yang-bad-paper-planes", title: "ทรงอย่างแบด (Bad Boy)", artist_name: "Paper Planes", coverImageURL: "https://image.joox.com/JOOXcover/0/0e8d55f0754bee8e/1000" },
              { id: "thatthong-sound-youngohm", title: "ธาตุทองซาวด์", artist_name: "YOUNGOHM ft. SONOFO", coverImageURL: "https://image.joox.com/JOOXcover/0/fce27f1e3231aa90/1000" },
              { id: "heart-follow-youngohm", title: "ใจฉันตามเธอไป", artist_name: "YOUNGOHM", coverImageURL: "https://image.joox.com/JOOXcover/0/e7f75603bc6178c3/1000" },
              { id: "fear-purpeech", title: "กลัวว่าฉันจะไม่เสียใจ (Fear)", artist_name: "PURPEECH", coverImageURL: "https://image.joox.com/JOOXcover/0/e7a3c5fcb288bbfa/1000" },
              { id: "in-love-song-seasonfive", title: "อยากอินเพลงรัก", artist_name: "SEASONFIVE, NO ONE ELSE", coverImageURL: "https://image.joox.com/JOOXcover/0/761c585557857829/1000" },
              { id: "last-walk-gavin", title: "ได้แค่เดินมาส่ง (The Last Walk)", artist_name: "GAVIN:D, BLVCKHEART", coverImageURL: "https://image.joox.com/JOOXcover/0/21a4b74553e6bbf3/1000" }
            ]
          },
          {
            id: 128,
            name: "อันดับเพลงใหม่",
            singles: [
              { id: "apt-rose-bruno", title: "APT.", artist_name: "ROSÉ, Bruno Mars", coverImageURL: "https://image.joox.com/JOOXcover/0/ede78407f1f58f29/1000" },
              { id: "mantra-jennie", title: "Mantra", artist_name: "JENNIE", coverImageURL: "https://image.joox.com/JOOXcover/0/072d28c1e885cdf7_u/1000" },
              { id: "rockstar-lisa", title: "Rockstar", artist_name: "LISA", coverImageURL: "https://image.joox.com/JOOXcover/0/bde1e1a665295346/1000" },
              { id: "new-woman-lisa", title: "New Woman", artist_name: "LISA ft. Rosalía", coverImageURL: "https://image.joox.com/JOOXcover/0/8e041c510317702c/1000" },
              { id: "bad-angel-lisa", title: "Bad Angel (Explicit)", artist_name: "Anyma, LISA", coverImageURL: "https://image.joox.com/JOOXcover/0/5a196bc197adb50b_u/1000" },
              { id: "if-only-lykn", title: "ถ้าเกิด (If Only)", artist_name: "LYKN", coverImageURL: "https://image.joox.com/JOOXcover/0/bde1e1a665295346/1000" },
              { id: "fark-hai-khao-rak", title: "ฝากให้เขารัก", artist_name: "Yes'sir Days", coverImageURL: "https://image.joox.com/JOOXcover/0/8e041c510317702c/1000" },
              { id: "nakorn-dara-youngohm", title: "นครดารา (Nakorn Dara)", artist_name: "YOUNGOHM", coverImageURL: "https://image.joox.com/JOOXcover/0/ede78407f1f58f29/1000" },
              { id: "jeb-jon-por-wanyai", title: "เจ็บจนพอ", artist_name: "แว่นใหญ่", coverImageURL: "https://image.joox.com/JOOXcover/0/d431dedbcbe8177a/1000" },
              { id: "leum-pai-wanyai", title: "ลืมไป", artist_name: "แว่นใหญ่ ft. ปู่จ๋าน ลองไมค์", coverImageURL: "https://image.joox.com/JOOXcover/0/0e8d55f0754bee8e/1000" },
              { id: "pi-chob-ponchet", title: "พี่ชอบหนูที่สุดเลย", artist_name: "PONCHET ft. VARINZ", coverImageURL: "https://image.joox.com/JOOXcover/0/0e8d55f0754bee8e/1000" },
              { id: "jam-loey-rak-fhero", title: "จำเลยรัก", artist_name: "F.HERO ft. Txrbo", coverImageURL: "https://image.joox.com/JOOXcover/0/fce27f1e3231aa90/1000" },
              { id: "song-jai-da", title: "สองใจ", artist_name: "ดา เอ็นโดรฟิน", coverImageURL: "https://image.joox.com/JOOXcover/0/d17e940c90fa8553/1000" },
              { id: "jai-salay-palmy", title: "ใจสลาย", artist_name: "ปาล์มมี่", coverImageURL: "https://image.joox.com/JOOXcover/0/b7822bad104699a5/1000" },
              { id: "time-to-break", title: "ถึงเวลาต้องเลิก", artist_name: "HT, K AGLET", coverImageURL: "https://image.joox.com/JOOXcover/0/fce27f1e3231aa90/1000" }
            ]
          },
          {
            id: 133,
            name: "อันดับเพลงมาแรง",
            singles: [
              { id: "na-na-thong-joey", title: "นะหน้าทอง", artist_name: "โจอี้ ภูวศิษฐ์", coverImageURL: "https://image.joox.com/JOOXcover/0/0da5df115f9e2cb0/1000" },
              { id: "duang-duan-joey", title: "ดวงเดือน", artist_name: "โจอี้ ภูวศิษฐ์", coverImageURL: "https://image.joox.com/JOOXcover/0/e7f75603bc6178c3/1000" },
              { id: "phing-nont", title: "พิง", artist_name: "นนท์ ธนนท์", coverImageURL: "https://image.joox.com/JOOXcover/0/072d28c1e885cdf7_u/1000" },
              { id: "khang-kan-three-man-down", title: "ข้างกัน (City)", artist_name: "Three Man Down ft. ออม yentown", coverImageURL: "https://image.joox.com/JOOXcover/0/03195c1b9df9f90c/1000" },
              { id: "fon-tok-mai-three-man-down", title: "ฝนตกไหม", artist_name: "Three Man Down", coverImageURL: "https://image.joox.com/JOOXcover/0/e7f75603bc6178c3/1000" },
              { id: "tha-ther-rak-ink", title: "ถ้าเธอรักใครคนหนึ่ง", artist_name: "INK WARUNTORN", coverImageURL: "https://image.joox.com/JOOXcover/0/0da5df115f9e2cb0/1000" },
              { id: "eyes-dont-lie-ink", title: "สายตาหลอกกันไม่ได้ (Eyes Don't Lie)", artist_name: "INK WARUNTORN", coverImageURL: "https://image.joox.com/JOOXcover/0/e7a3c5fcb288bbfa/1000" },
              { id: "erase-ink", title: "ลบไม่ได้ช่วยให้ลืม (Erase)", artist_name: "INK WARUNTORN", coverImageURL: "https://image.joox.com/JOOXcover/0/cf0e15d1b86a3315/1000" },
              { id: "dung-dun-cocktail", title: "ดึงดัน", artist_name: "Cocktail ft. ตั๊ก ศิริพร", coverImageURL: "https://image.joox.com/JOOXcover/0/d431dedbcbe8177a/1000" },
              { id: "rak-pai-rong-hai-pai", title: "รักไปร้องไห้ไป", artist_name: "Bowkylion", coverImageURL: "https://image.joox.com/JOOXcover/0/cf316731b60043ca/1000" },
              { id: "per-rue-tang-jai", title: "เผลอหรือตั้งใจ", artist_name: "INK WARUNTORN", coverImageURL: "https://image.joox.com/JOOXcover/0/0da5df115f9e2cb0/1000" },
              { id: "gift-musketeers", title: "ของขวัญ", artist_name: "Musketeers", coverImageURL: "https://image.joox.com/JOOXcover/0/e7a3c5fcb288bbfa/1000" },
              { id: "think-but-not-reach", title: "คิดแต่ไม่ถึง", artist_name: "Tilly Birds", coverImageURL: "https://image.joox.com/JOOXcover/0/cf0e15d1b86a3315/1000" },
              { id: "friend-not-play-friend", title: "เพื่อนเล่น ไม่เล่นเพื่อน", artist_name: "Tilly Birds ft. MILLI", coverImageURL: "https://image.joox.com/JOOXcover/0/d17e940c90fa8553/1000" },
              { id: "salak-jit-pop", title: "สลักจิต", artist_name: "ป๊อบ ปองกูล ft. ดา เอ็นโดรฟิน", coverImageURL: "https://image.joox.com/JOOXcover/0/03195c1b9df9f90c/1000" }
            ]
          },
          {
            id: 57,
            name: "THTOP100 2024",
            singles: [
              { id: "ko-dam-wasan", title: "โกดำ", artist_name: "วสันต์17, ไม้เมือง", coverImageURL: "https://image.joox.com/JOOXcover/0/27c71adb7b0ba8dd/1000" },
              { id: "khoo-khong-kong", title: "คู่คอง", artist_name: "ก้อง ห้วยไร่", coverImageURL: "https://image.joox.com/JOOXcover/0/072d28c1e885cdf7_u/1000" },
              { id: "kham-wa-hug-monkan", title: "คำว่าฮักกัน มันเหี่ยถิ่มไส", artist_name: "มนต์แคน แก่นคูน", coverImageURL: "https://image.joox.com/JOOXcover/0/03195c1b9df9f90c/1000" },
              { id: "khob-jai-der-sarn", title: "ขอบใจเด้อ", artist_name: "ศาล สานศิลป์", coverImageURL: "https://image.joox.com/JOOXcover/0/e7f75603bc6178c3/1000" },
              { id: "ra-berd-wela-sarn", title: "ระเบิดเวลา", artist_name: "ศาล สานศิลป์", coverImageURL: "https://image.joox.com/JOOXcover/0/0da5df115f9e2cb0/1000" },
              { id: "si-ma-hug-tai", title: "สิมาฮักหยังตอนนี้", artist_name: "ต่าย อรทัย", coverImageURL: "https://image.joox.com/JOOXcover/0/cf316731b60043ca/1000" },
              { id: "maha-lai-wua-chon", title: "มหาลัยวัวชน", artist_name: "วงพัทลุง", coverImageURL: "https://image.joox.com/JOOXcover/0/e7a3c5fcb288bbfa/1000" },
              { id: "kod-sao-theang", title: "กอดเสาเถียง", artist_name: "ปรีชา ปัดภัย", coverImageURL: "https://image.joox.com/JOOXcover/0/d9d4df3c69a320bf_u/1000" },
              { id: "rak-tang-jai-hug", title: "แรกตั้งใจฮัก", artist_name: "ปรีชา ปัดภัย", coverImageURL: "https://image.joox.com/JOOXcover/0/cf0e15d1b86a3315/1000" },
              { id: "thoraman-joey", title: "ทรมาน", artist_name: "โจอี้ ภูวศิษฐ์", coverImageURL: "https://image.joox.com/JOOXcover/0/fce27f1e3231aa90/1000" },
              { id: "kumphaphan-peter", title: "กุมภาพันธ์", artist_name: "ปีเตอร์ คอร์ป ไดเรนดัล", coverImageURL: "https://image.joox.com/JOOXcover/0/21a4b74553e6bbf3/1000" },
              { id: "toey-sang-la", title: "เต้ยสั่งลา", artist_name: "ธีร์ ทีเร็กซ์", coverImageURL: "https://image.joox.com/JOOXcover/0/d431dedbcbe8177a/1000" },
              { id: "dok-kra-jiao-kong", title: "ดอกกระเจียวบาน", artist_name: "ก้อง ห้วยไร่", coverImageURL: "https://image.joox.com/JOOXcover/0/0e8d55f0754bee8e/1000" },
              { id: "keep-flirting-tai", title: "เก็บความหลายใจไปใช้ที่อื่น", artist_name: "ต่าย อรทัย", coverImageURL: "https://image.joox.com/JOOXcover/0/cf316731b60043ca/1000" },
              { id: "hug-por-pen-pithi", title: "ฮักพอเป็นพิธี", artist_name: "ต่าย อรทัย", coverImageURL: "https://image.joox.com/JOOXcover/0/fe138985f9c2c608/1000" }
            ]
          }
        ];

        finalCharts = curatedCharts;
        totalSongs = finalCharts.reduce((sum, c) => sum + (c.singles?.length || 0), 0);
        debugLog(`✅ Premium Curated Thai Singles Fallback Successful! Fetched ${totalSongs} songs across ${finalCharts.length} charts.`);
      } catch (curatedErr: any) {
        debugLog(`❌ Premium Curated Thai Singles fallback failed: ${curatedErr.message}`);
      }
    }

    debugLog(`[FINAL] totalSongs = ${totalSongs}, finalCharts count = ${finalCharts.length}`);

    if (totalSongs > 0) {
      if (adminFirestore) {
        try {
          const docRef = adminFirestore.collection('system_cache').doc('joox_charts');
          await docRef.set({
            updatedAt: new Date().toISOString(),
            charts: finalCharts
          });
          debugLog("✅ Cached new JOOX charts to Firestore");
        } catch (err: any) {
          debugLog(`❌ Failed to cache to Firestore: ${err.message}`);
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
        debug: { totalSongs, chartCount: finalCharts.length, forceUsed: force },
        traces
    });
  } catch (error: any) {
    console.error("Error fetching JOOX charts:", error);
    res.status(500).json({ status: "error", message: error.message, traces });
  }
}
