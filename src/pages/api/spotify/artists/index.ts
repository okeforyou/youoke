import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

import { getAccessToken } from "../../../../modules/spotify-theme/services/auth";
import { Artist, ArtistCategory, GetTopArtists } from "../../../../types";

/**
 * Get Top Artists Strategy: Curated Thai Favorites + Robust Category Scraper
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
    return res.status(200).json(cachedData);
  }

  try {
    let accessToken: string | null = null;
    try {
      accessToken = await getAccessToken();
    } catch (authErr) { }

    // 1. Curated Thai Artists (User's favorites and famous ones)
    // Reverting to high-quality curated list to ensure "karaoke-friendly" songs
    let artistList: Artist[] = [
      { name: "ทรีแมนดาวน์", imageUrl: "https://i.scdn.co/image/ab6761610000e5ebc40618dc2b22f77839352755" },
      { name: "เจฟ ซาเตอร์", imageUrl: "https://i.scdn.co/image/ab6761610000e5eb46112c9b20d58849b28ba551" },
      { name: "นนท์ ธนนท์", imageUrl: "https://i.scdn.co/image/ab6761610000e5eb2e361c4c1a74284b3d39589d" },
      { name: "โบกี้ไลอ้อน", imageUrl: "https://i.scdn.co/image/ab6761610000e5eb1d2b0cb0407c427042a492bd" },
      { name: "อิ้งค์ วรันธร", imageUrl: "https://i.scdn.co/image/ab6761610000e5eb435645543c72635467431f4e" },
      { name: "ไททศมิตร", imageUrl: "https://i.scdn.co/image/ab6761610000e5ebabcf712869584347712395d8" },
      { name: "บอดี้สแลม", imageUrl: "https://i.scdn.co/image/ab6761610000e5ebf87132172778747ef8d227b6" },
      { name: "โปเตโต้", imageUrl: "https://i.scdn.co/image/ab6761610000e5ebd940c6c1920ae1076b4a2f8d" },
      { name: "ค็อกเทล", imageUrl: "https://i.scdn.co/image/ab6761610000e5ebd76c5b964998822a84a9561b" },
      { name: "ลาบานูน", imageUrl: "https://i.scdn.co/image/ab6761610000e5eb6c4296ca8375a03e670ba51d" },
      { name: "บิ๊กแอส", imageUrl: "https://i.scdn.co/image/ab6761610000e5eb27339719bf25e365e1008675" },
      { name: "เดอะทอยส์", imageUrl: "https://i.scdn.co/image/ab6761610000e5ebd086383637f9e80277df6956" },
      { name: "มียู", imageUrl: "https://i.scdn.co/image/ab6761610000e5eb8095b525892582772584100c" },
      { name: "ส้ม มารี", imageUrl: "https://i.scdn.co/image/ab6761610000e5eb56e9c93b680c6517a94025a1" },
      { name: "เซฟแพลนเน็ต", imageUrl: "https://i.scdn.co/image/ab6761610000e5eb576352ff135e82512e088ba7" }
    ];

    // 2. Featured Playlists (Refined Queries for 100% Thai Content)
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

    // 3. Resolve Category Thumbnails (Robust Scraper)
    const categoryResponses = await Promise.all(
      featuredPlaylists.map(async cat => {
        try {
          const { scrapeYouTubePlaylistSearch } = await import("../../../../utils/youtubeScraper");
          const results = await scrapeYouTubePlaylistSearch(cat.query);
          const best = results[0];

          if (best && best.thumbnail) {
            return {
              data: {
                id: `yt-${best.playlistId}`,
                name: cat.name,
                images: [{ url: best.thumbnail }]
              }
            };
          }
          throw new Error("No cover");
        } catch (e) {
          // Reliable Fallback: Use a vibrant placeholder or a generic YouTube cover
          return {
            data: {
              id: `q-${encodeURIComponent(cat.query)}`,
              name: cat.name,
              images: [{ url: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80" }]
            }
          };
        }
      })
    );

    let artistCategories: ArtistCategory[] = categoryResponses
      .map(res => (res as any).data)
      .filter(data => data && data.id)
      .map(data => ({
        tag_id: data.id,
        tag_name: data.name,
        imageUrl: data.images[0].url
      }));

    const artistsResp: GetTopArtists = {
      status: "success",
      artist: artistList,
      artistCategories,
    };

    cachedData = artistsResp;
    lastFetch = Date.now();
    res.status(200).json(artistsResp);

  } catch (error: any) {
    console.error("❌ API Error:", error.message);
    if (cachedData) return res.status(200).json(cachedData);
    res.status(200).json({ status: "success", artist: [], artistCategories: [] });
  }
}
