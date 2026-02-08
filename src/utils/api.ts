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
