import type { NextApiRequest, NextApiResponse } from "next";
import { scrapeMusicCharts, scrapeYouTubePlaylistSearch } from "../../../../utils/youtubeScraper";
import { Artist, ArtistCategory, GetTopArtists } from "../../../../types";

let cachedData: GetTopArtists | null = null;
let lastFetch: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 Hour

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetTopArtists | { error: string }>
) {
  // Check Cache
  if (cachedData && Date.now() - lastFetch < CACHE_DURATION && !req.query.nocache) {
    return res.status(200).json(cachedData);
  }

  try {
    console.log('[API/Artists] Fetching Dynamic Data...');

    // 1. Fetch Top Artists from YouTube Music Charts
    let artistList: Artist[] = [];
    try {
      const charts = await scrapeMusicCharts('TH');
      if (charts.length > 0) {
        artistList = charts.slice(0, 20).map(a => ({
          name: a.name,
          imageUrl: a.imageUrl
        }));
      }
    } catch (e) {
      console.warn('[API/Artists] Charts failed, using fallback');
    }

    // 2. High-Quality Thai Categories (Now Dynamic-ish)
    const genres = [
      { name: "ลูกทุ่งยอดนิยม", query: "ลูกทุ่งฮิต 2024" },
      { name: "T-Pop Hits", query: "T-Pop ใหม่" },
      { name: "ร็อกไทยยอดนิยม", query: "ร็อกไทยฮิต" },
      { name: "อินดี้มาแรง", query: "เพลงอินดี้ใหม่" },
      { name: "เพื่อชีวิต", query: "เพลงเพื่อชีวิต" }
    ];

    const artistCategories: ArtistCategory[] = [];

    // For categories, we fetch the first playlist for each genre
    for (const genre of genres.slice(0, 5)) {
      try {
        const results = await scrapeYouTubePlaylistSearch(genre.query);
        if (results.length > 0) {
          artistCategories.push({
            tag_id: `yt-${results[0].playlistId}`,
            tag_name: genre.name,
            imageUrl: results[0].thumbnail
          });
        }
      } catch (err) { }
    }

    const artistsResp: GetTopArtists = {
      status: "success",
      artist: artistList,
      artistCategories: artistCategories.length > 0 ? artistCategories : [
        // Safety fallback if scraping fails entirely
        { tag_id: "yt-PLhP79Yv685p_F0uV5zK1YvR4pWJ3_p8N-", tag_name: "เพลงไทยยอดฮิต", imageUrl: "https://i.ytimg.com/vi/uXfXoD-M3M8/hqdefault.jpg" }
      ],
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
