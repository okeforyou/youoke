import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

import { getAccessToken } from "../../../../modules/spotify-theme/services/auth";
import { Artist, ArtistCategory, GetTopArtists } from "../../../../types";

/**
 * Get Top Artists from Spotify Playlist (V1 Restoration)
 */
let cachedData: GetTopArtists | null = null;
let lastFetch: number = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 Minutes

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetTopArtists | { error: string }>
) {
  // Check Cache
  if (cachedData && Date.now() - lastFetch < CACHE_DURATION) {
    console.log('⚡ Serving Top Artists from Cache (Spotify API)');
    return res.status(200).json(cachedData);
  }

  try {
    console.log("🚀 [API] Starting Spotify Top Artists Fetch...");

    let accessToken: string | null = null;
    try {
      accessToken = await getAccessToken();
    } catch (authErr: any) {
      console.warn("⚠️ [API] Spotify Auth failed");
    }

    let artistList: Artist[] = [];
    let artistCategories: ArtistCategory[] = [];

    const thaiNameMap: Record<string, string> = {
      "YOUNGOHM": "ยังโอม",
      "WANYAi": "วันใหม่",
      "Three Man Down": "ทรีแมนดาวน์",
      "Ink Waruntorn": "อิ้งค์ วรันธร",
      "Cocktail": "ค็อกเทล",
      "Potato": "โปเตโต้",
      "Bodyslam": "บอดี้สแลม",
      "The Toys": "เดอะทอยส์",
      "NUM KALA": "หนุ่ม กะลา",
    };

    const mainPlaylistId = "37i9dQZF1DXabc123"; // Re-added or using standard
    const featuredPlaylists = [
      { query: "เพลงไทย ลูกทุ่งยอดฮิต 2025", name: "ลูกทุ่งยอดนิยม" },
      { query: "รวมเพลงไทย GMM Grammy ฮิตตลอดกาล", name: "GMM Grammy ฮิต" },
      { query: "T-Pop Hits 2025 เพลงไทยล่าสุด", name: "T-Pop Hits" },
      { query: "รวมเพลงไทยยุค 2000 ฮิต", name: "ไทยฮิตยุค 2000" },
      { query: "เพลงไทยใหม่ล่าสุด 2025 ยอดนิยม", name: "ไทยใหม่ล่าสุด" },
      { query: "รวมเพลงร็อกไทย ยอดนิยม", name: "ร็อกไทยยอดนิยม" },
      { query: "เพลงเพื่อชีวิต ฮิตตลอดกาล ไทย", name: "เพลงเพื่อชีวิต" },
      { query: "เพลงเก่าที่คิดถึง 80s 90s ไทย", name: "ไทยเก่า 80s-90s" },
      { query: "เพลงอินดี้ไทย มาแรง 2025", name: "อินดี้มาแรง" },
      { query: "เพลงแดนซ์ไทย สายย่อ 2025", name: "แดนซ์สายย่อ" },
      { query: "รวมเพลงเศร้าไทย 2025 ล่าสุด", name: "รวมเพลงไทยเศร้า" }
    ];

    // 1. Try Official YouTube Music Charts (Best Quality)
    try {
      const { scrapeMusicCharts } = await import("../../../../utils/youtubeScraper");
      const charts = await scrapeMusicCharts('TH');
      if (charts.length > 0) {
        artistList = charts.slice(0, 18).map(a => ({
          name: a.name,
          imageUrl: a.imageUrl || "https://ui-avatars.com/api/?name=" + encodeURIComponent(a.name) + "&background=random&size=400"
        }));
      }
    } catch (e) {
      console.warn("⚠️ [API] Charts Scrape failed");
    }

    // 2. If Charts failed, try Spotify as fallback for ranking
    if (artistList.length === 0 && accessToken) {
      try {
        const res = await axios.get(`https://api.spotify.com/v1/playlists/37i9dQZEVXbMnz8KIWsvf9/tracks`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { limit: 50, market: 'TH' }
        });
        const tracks = res.data.items || [];
        const artistMap = new Map();
        for (const item of tracks) {
          if (!item?.track) continue;
          const artist = item.track.artists[0];
          if (!artist) continue;
          if (!artistMap.has(artist.name)) artistMap.set(artist.name, { name: artist.name, imageUrl: item.track.album.images[0]?.url || "" });
        }
        artistList = Array.from(artistMap.values()).slice(0, 18).map(a => ({
          name: thaiNameMap[a.name] || a.name,
          imageUrl: a.imageUrl
        }));
      } catch (e) { }
    }

    // 3. Resolve Categories
    const categoryResponses = await Promise.all(
      featuredPlaylists.map(async cat => {
        try {
          const { scrapeYouTubePlaylistSearch } = await import("../../../../utils/youtubeScraper");
          const results = await scrapeYouTubePlaylistSearch(cat.query);
          const best = results[0];
          if (best) {
            return {
              data: { id: `yt-${best.playlistId}`, name: cat.name, images: [{ url: best.thumbnail }] }
            };
          }
          throw new Error();
        } catch (e) {
          return { data: { id: `q-${encodeURIComponent(cat.query)}`, name: cat.name, images: [{ url: "https://i.ytimg.com/vi/mqdefault.jpg" }] } };
        }
      })
    );

    artistCategories = categoryResponses
      .map(res => (res as any).data)
      .filter(data => data && data.id)
      .map(data => ({
        tag_id: data.id,
        tag_name: data.name,
        imageUrl: data.images[0].url
      }));

    // Final Success Check
    if (artistList.length === 0) {
      artistList = [
        { name: "Three Man Down", imageUrl: "https://i.scdn.co/image/ab6761610000e5ebc40618dc2b22f77839352755" },
        { name: "Jeff Satur", imageUrl: "https://i.scdn.co/image/ab6761610000e5eb46112c9b20d58849b28ba551" },
        { name: "NONT TANONT", imageUrl: "https://i.scdn.co/image/ab6761610000e5eb2e361c4c1a74284b3d39589d" },
        { name: "BOWKYLION", imageUrl: "https://i.scdn.co/image/ab6761610000e5eb1d2b0cb0407c427042a492bd" },
        { name: "Ink Waruntorn", imageUrl: "https://i.scdn.co/image/ab6761610000e5eb435645543c72635467431f4e" }
      ];
    }

    const artistsResp: GetTopArtists = {
      status: "success",
      artist: artistList,
      artistCategories,
    };

    cachedData = artistsResp;
    lastFetch = Date.now();
    res.status(200).json(artistsResp);

  } catch (error: any) {
    console.error("❌ CRITICAL ERROR:", error.message);
    if (cachedData) return res.status(200).json(cachedData);
    res.status(200).json({ status: "success", artist: [], artistCategories: [] });
  }
}
