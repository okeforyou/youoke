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

export const getTopArtists = async () => {
  const res = await apiClient.get<GetTopArtists>("/api/spotify/artists/");
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
  page: number = 1
): Promise<SearchPlaylists> => {
  // Use the new reliable Spotify-backed endpoint
  const response = await apiClient.get<any[]>(
    "/api/search/playlists",
    {
      params: { q: query, page },
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
  
  // 1. Remove common noise tags in brackets or parentheses
  // Added 'by' to handle [by Artist Name] or (by Artist Name)
  cleaned = cleaned.replace(/\((Official|Lyric|MV|Audio|Music|Video|HD|Cover|Full|Remastered|Original|Live|Karaoke|Version|by).*?\)/gi, "");
  cleaned = cleaned.replace(/\[(Official|Lyric|MV|Audio|Music|Video|HD|Cover|Full|Remastered|Original|Live|Karaoke|Version|by).*?\]/gi, "");
  
  // 2. Remove "Unknown Artist" and other common standalone noise
  cleaned = cleaned.replace(/Unknown Artist/gi, "");
  cleaned = cleaned.replace(/Official (Music Video|Audio|MV|Video|Lyric|Video)/gi, "");
  
  // 3. Remove hashtags (e.g., #karaoke #คาราโอเกะ)
  cleaned = cleaned.replace(/#\w+/g, "");

  // 4. Remove common separators that often appear at the end or around noise
  cleaned = cleaned.replace(/\s*[\-\|:;,\._]+\s*/g, " ");

  // 5. Deduplicate words (if Artist is in Title and also appended)
  const words = cleaned.split(/\s+/);
  const uniqueWords = words.filter((word, index) => {
    return words.indexOf(word) === index;
  });
  cleaned = uniqueWords.join(" ");
  
  // 6. Final cleanup
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  
  return cleaned;
};
