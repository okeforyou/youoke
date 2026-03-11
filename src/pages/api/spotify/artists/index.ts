import type { NextApiRequest, NextApiResponse } from "next";
import { adminFirestore } from "../../../../firebase-admin";
import { Artist, ArtistCategory, GetTopArtists } from "../../../../types";

// Simple Memory Cache (in addition to Firestore)
let cachedData: GetTopArtists | null = null;
let lastFetch: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 Minutes in memory

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetTopArtists | { error: string }>
) {
  // Check Memory Cache
  if (cachedData && Date.now() - lastFetch < CACHE_DURATION && !req.query.nocache) {
    return res.status(200).json(cachedData);
  }

  // Stable Sane Fallback so Dashboard never breaks
  const FALLBACK_DATA: GetTopArtists = {
      status: "success", 
      artist: [
          { name: "Bodyslam", imageUrl: "/assets/avatar.jpeg" },
          { name: "Three Man Down", imageUrl: "/assets/avatar.jpeg" },
          { name: "Tilly Birds", imageUrl: "/assets/avatar.jpeg" },
          { name: "Paper Planes", imageUrl: "/assets/avatar.jpeg" },
          { name: "หนุ่ม กะลา", imageUrl: "/assets/avatar.jpeg" }
      ], 
      artistCategories: [
          { tag_id: 'yt-PL3y_Bf6-jFq8pD_7vW9A9Z6E-A_7Z-', tag_name: 'ลูกทุ่งฮิต', imageUrl: 'https://i.ytimg.com/vi/uXfXoD-M3M8/hqdefault.jpg' },
          { tag_id: 'yt-PLhP79Yv685p_F0uV5zK1YvR4pWJ3_p8N-', tag_name: 'เพลงไทยยอดฮิต', imageUrl: 'https://i.ytimg.com/vi/uXfXoD-M3M8/hqdefault.jpg' }
      ] 
  };

  try {
    if (!adminFirestore) {
       console.warn('[API/Artists] Admin Firebase not initialized, sending fallback data.');
       return res.status(200).json(FALLBACK_DATA);
    }

    const docSnapshot = await adminFirestore.collection('music_cache').doc('youtube_home').get();
    
    if (docSnapshot.exists) {
        const data = docSnapshot.data();
        
        // Transform cached data into what SpotifyDashboard expects
        const artistList: Artist[] = data?.topArtists?.map((a: any) => ({
             name: a.name || a.title,
             imageUrl: a.thumbnail || a.imageUrl || "/assets/avatar.jpeg"
        })) || [];

        // Build categories dynamically from the 'genres' object in cache
        const artistCategories: ArtistCategory[] = [];
        if (data?.genres) {
            Object.keys(data.genres).forEach(genreName => {
                const playlists = data.genres[genreName];
                if (playlists && playlists.length > 0) {
                     // Get the first playlist item to represent the category
                     artistCategories.push({
                         tag_id: `yt-${playlists[0].playlistId || playlists[0].id}`,
                         tag_name: genreName,
                         imageUrl: playlists[0].thumbnail || 'https://i.ytimg.com/vi/uXfXoD-M3M8/hqdefault.jpg'
                     });
                }
            });
        }

        // Add additional hardcoded reliable genres that will trigger playlist searches
        const standardGenres = ["ลูกทุ่งยอดนิยม", "T-Pop Hits", "ร็อกไทย", "อินดี้มาแรง", "เพื่อชีวิต"];
        standardGenres.forEach(genre => {
             if (!artistCategories.find(c => c.tag_name === genre)) {
                 artistCategories.push({
                     tag_id: `genre-${genre}`, // Identifier for frontend to know to search
                     tag_name: genre,
                     imageUrl: 'https://i.ytimg.com/vi/uXfXoD-M3M8/hqdefault.jpg'
                 });
             }
        });

        const artistsResp: GetTopArtists & { genres?: Record<string, any[]> } = {
           status: "success",
           artist: artistList.length > 0 ? artistList : FALLBACK_DATA.artist,
           artistCategories: artistCategories.length > 0 ? artistCategories : FALLBACK_DATA.artistCategories,
           genres: data?.genres || {}
        };

        cachedData = artistsResp as any;
        lastFetch = Date.now();
        return res.status(200).json(artistsResp as any);
    } else {
        console.warn("Cache document does not exist, using fallback");
        return res.status(200).json(FALLBACK_DATA);
    }

  } catch (error: any) {
    console.error("❌ API Error:", error.message);
    if (cachedData) return res.status(200).json(cachedData);
    return res.status(200).json(FALLBACK_DATA);
  }
}
