import { apiClient } from "../lib/api-client";

import {
  GetArtists,
  GetHitSingles,
  GetTopArtists,
  SearchPlaylists,
} from "../types";
import { SearchResult, VideoResponse } from "../types/invidious";

export const getVideoInfo = async (videoId: string) => {
  // const res = await apiClient.get<VideoResponse>("/api/videos/" + videoId);
  // return res.data;
  return {
    recommendedVideos: [],
  };
};

interface SearchParams {
  q: string;
  page?: number;
  region?: string;
  type?: string;
  fields?: string;
}

export const getSearchResult = async ({
  q,
  page = 0,
  region = "TH",
  type = "video",
  fields = "title,videoId,author,videoThumbnails",
}: SearchParams) => {
  const res = await apiClient.get<SearchResult[]>("/api/search", {
    params: { q, type, page, region, fields },
  });
  return res.data;
};
// export const getSearchResult = async ({
//   q,
//   page = 0,
//   region = "TH",
//   type = "video",
//   fields = "title,videoId,author,videoThumbnails",
// }) => {
//   if (!q) {
//     throw new Error("Missing params `q`!");
//   }
//   const res = await invidious.get<SearchResult[]>("/api/v1/search", {
//     params: { q, type, page, region, fields },
//     headers: {
//       "Access-Control-Allow-Origin": "*",
//     },
//   });
//   return res.data;
// };
export const getSkeletonItems = (length: number) =>
  Array.from({ length }).map((_, i) => i);

export const getExploreData = async (mode: 'default' | 'listening' = 'default') => {
  const res = await apiClient.get<{ data: any[] }>("/api/explore", {
    params: { mode }
  });
  return res.data;
};

export const getTopArtists = async (mode: 'default' | 'listening' = 'default') => {
  const res = await apiClient.get<GetTopArtists>("/api/spotify/artists/", {
    params: { mode }
  });
  return res.data;
};

export const getArtists = async (gender: string = "1") => {
  const res = await apiClient.get<GetArtists>("/api/spotify/artists/" + gender);
  return res.data;
};

export const getHitSingles = async () => {
  const res = await apiClient.get<GetHitSingles>("/api/spotify/hits");
  return res.data;
};

export const searchPlaylists = async (
  query: string,
  page: number = 1,
  type: 'default' | 'listening' = 'default'
): Promise<SearchPlaylists> => {
  // Use the new reliable Spotify-backed endpoint
  const response = await apiClient.get<any[]>(
    "/api/search/playlists",
    {
      params: { q: query, page, type },
    }
  );

  // Map new format to old format expected by ListSingerGrid
  const artistCategories = response.data.map(item => ({
    tag_id: item.playlistId,
    tag_name: item.title,
    imageUrl: item.thumbnail
  }));

  return {
    status: "success",
    artistCategories
  };
};

/**
 * Cleans a search query by removing common YouTube noise and clutter
 * like (Official MV), [Lyric], Unknown Artist, etc.
 */
export const cleanSearchQuery = (query: string): string => {
  if (!query) return "";
  
  let cleaned = query;
  
  // 1. Aggressive Bracket Removal (Multiple passes for nested ones)
  for (let i = 0; i < 3; i++) {
    cleaned = cleaned.replace(/\[.*?\]/g, " ");
    cleaned = cleaned.replace(/\(.*?\)/g, " ");
    cleaned = cleaned.replace(/\{.*?\}/g, " ");
  }
  
  // 2. Remove URLs or things that look like them
  cleaned = cleaned.replace(/https?:\/\/\S+/gi, " ");
  
  // 3. Keep only Thai, English, Numbers and Spaces (Immediate Symbol Stripping)
  // This removes #, [, ], -, |, etc.
  cleaned = cleaned.replace(/[^a-zA-Z0-9\u0E00-\u0E7F\s]/g, " ");
  
  // 4. Split into words and filter noise
  const noiseWords = new Set([
     "official", "music", "video", "audio", "mv", "lyric", "hd", "4k", "full", 
     "remastered", "original", "live", "karaoke", "version", "cover", "by", 
     "unknown", "artist", "ไม่มีโฆษณา", "gdm", "เอางรี้", "อัขระพิเศษ",
     "channel", "subscribe", "sub", "karaoke", "คาราโอเกะ", "ศิลปิน", "เพลง"
  ]);

  const words = cleaned.split(/\s+/).filter(word => {
    const lowerWord = word.toLowerCase();
    
    // Skip if it's in noise list
    if (noiseWords.has(lowerWord)) return false;
    
    // Skip if it's a mix of numbers and letters (often codes/IDs)
    if (/[a-zA-Z]/.test(word) && /[0-9]/.test(word)) return false;
    
    // Skip very short English words (often noise like 'th', 'a', 'to')
    if (/^[a-z]{1,2}$/i.test(word) && !noiseWords.has(lowerWord)) {
        // We keep it if it might be part of a title, but usually 1-2 char english is noise
        // Let's be cautious and keep for now unless it's known noise
    }

    return word.length > 0;
  });

  // 5. Deduplicate words (Case insensitive)
  const seen = new Set<string>();
  const finalWords: string[] = [];
  
  for (const word of words) {
    const lower = word.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      finalWords.push(word);
    }
  }

  // 6. Final Join
  return finalWords.join(" ").trim();
};
