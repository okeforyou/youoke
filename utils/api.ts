import axios from "axios";

import {
  GetArtists,
  GetHitSingles,
  GetTopArtists,
  SearchPlaylists,
} from "../types";
import { SearchResult, VideoResponse } from "../types/invidious";

export const getVideoInfo = async (videoId: string) => {
  // const res = await axios.get<VideoResponse>("/api/videos/" + videoId);
  // return res.data;
  return {
    recommendedVideos: [],
  };
};

export const getSearchResult = async ({
  q,
  page = 0,
  region = "TH",
  type = "video",
  fields = "title,videoId,author,videoThumbnails",
}) => {
  const res = await axios.get<SearchResult[]>("/api/search", {
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
  const res = await axios.get<GetTopArtists>("/api/spotify/artists/");
  return res.data;
};

export const getArtists = async (gender: string = "1") => {
  const res = await axios.get<GetArtists>("/api/spotify/artists/" + gender);
  return res.data;
};

export const getHitSingles = async () => {
  const res = await axios.get<GetHitSingles>("/api/spotify/hits");
  return res.data;
};

export const searchPlaylists = async (
  query: string
): Promise<SearchPlaylists> => {
  const response = await axios.get<SearchPlaylists>(
    "/api/spotify/search-playlist",
    {
      params: { query },
    }
  );
  return response.data;
};
