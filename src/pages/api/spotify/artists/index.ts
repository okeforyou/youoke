import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

import { getAccessToken } from "../../../../modules/spotify-theme/services/auth";
import { Artist, ArtistCategory, GetTopArtists } from "../../../../types";

/**
 * Get Top Artists Strategy: Working V1 Restoration Links
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

    // 1. Working V1 Artist List (Thai Names)
    let artistList: Artist[] = [
      { name: "ทรีแมนดาวน์", imageUrl: "https://i.scdn.co/image/ab67616d0000b27360f2f73480eace853c802085" },
      { name: "วันใหม่", imageUrl: "https://i.scdn.co/image/ab67616d0000b2732fb0ac23f67ccba1df959003" },
      { name: "ส้ม มารี", imageUrl: "https://i.scdn.co/image/ab67616d0000b273da11e035d075181deae50cd2" },
      { name: "Tilly Birds", imageUrl: "https://i.scdn.co/image/ab67616d0000b273f461ea0b333bce3f8bea6ab0" },
      { name: "อิ้งค์ วรันธร", imageUrl: "https://i.scdn.co/image/ab67616d0000b27369e4ac87e71b153db343f4be" },
      { name: "Room 39", imageUrl: "https://i.scdn.co/image/ab67616d0000b2738a4f6f32c40f65dd225ca781" },
      { name: "ป๊อบ ปองกูล", imageUrl: "https://i.scdn.co/image/ab67616d0000b2738364201303fbee03253bfe56" },
      { name: "ว่าน ธนกฤต", imageUrl: "https://i.scdn.co/image/ab67616d0000b27339cd513b6a902f1d02750a7c" },
      { name: "Mon Monik", imageUrl: "https://i.scdn.co/image/ab67616d0000b2736281d0860b60021d8856912f" },
      { name: "Marc Tatchapon", imageUrl: "https://i.scdn.co/image/ab67616d0000b2738d81c345529c9a00eb464f51" },
      { name: "โปเตโต้", imageUrl: "https://i.scdn.co/image/ab67616d0000b273cda90a6e82931e7e7b506d7d" },
      { name: "Lomosonic", imageUrl: "https://i.scdn.co/image/ab67616d0000b273230f5f4ddaf12eef0a3232d2" },
      { name: "แสตมป์ อภิวัชร์", imageUrl: "https://i.scdn.co/image/ab67616d0000b273001e3efb91be417cad578b6d" },
      { name: "ETC.", imageUrl: "https://i.scdn.co/image/ab67616d0000b27321fcbce2d60d79422af93ed9" },
      { name: "The Kastle", imageUrl: "https://i.scdn.co/image/ab67616d0000b273865cd94b26a166bd4b72b7c4" }
    ];

    // 2. Featured Playlists (Refined Queries for 100% Thai Content)
    const featuredPlaylists = [
      { query: "เพลงลูกทุ่งยอดฮิต 2025", name: "ลูกทุ่งยอดนิยม" },
      { query: "รวมเพลง GMM Grammy ฮิตตลอดกาล", name: "GMM Grammy ฮิต" },
      { query: "T-Pop Hits 2025 ล่าสุด", name: "T-Pop Hits" },
      { query: "รวมเพลงเก่า ยุค 2000 ฮิต", name: "เก่าฮิตยุค 2000" },
      { query: "เพลงใหม่ล่าสุด 2025 ไทย", name: "ไทยใหม่ล่าสุด" },
      { query: "รวมเพลงร็อกไทย ยอดนิยม", name: "ร็อกไทยยอดนิยม" },
      { query: "เพลงเพื่อชีวิต ฮิตตลอดกาล", name: "เพลงเพื่อชีวิต" },
      { query: "เพลงเก่าที่คิดถึง 80s 90s", name: "ไทยเก่า 80s-90s" },
      { query: "เพลงอินดี้ไทย มาแรง 2025", name: "อินดี้มาแรง" },
      { query: "เพลงแดนซ์ไทย สายย่อ 2025", name: "แดนซ์สายย่อ" }
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
          // Fallback: Try to get a video thumbnail that matches the query
          try {
            const { scrapeYouTubeSearch } = await import("../../../../utils/youtubeScraper");
            const videoResults = await scrapeYouTubeSearch(cat.query);
            if (videoResults[0]?.videoId) {
              return {
                data: {
                  id: `q-${encodeURIComponent(cat.query)}`,
                  name: cat.name,
                  images: [{ url: `https://i.ytimg.com/vi/${videoResults[0].videoId}/hqdefault.jpg` }]
                }
              };
            }
          } catch { } // ignore

          // Final fallback: YouTube icon placeholder
          return {
            data: {
              id: `q-${encodeURIComponent(cat.query)}`,
              name: cat.name,
              images: [{ url: "/icon-cover.png" }]
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
