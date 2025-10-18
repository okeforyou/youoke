import { RecommendedVideo, SearchResult } from "./invidious";

export type PlaylistItem = (SearchResult | RecommendedVideo) & {
  key: number;
};

export interface Artist {
  name: string;
  imageUrl: string;
}

export interface ArtistCategory {
  tag_id: string;
  tag_name: string;
  imageUrl: string;
}

export interface GetArtists {
  status: string;
  artist: Artist[];

  clientIp: string;
  time: number;
}

export interface GetTopArtists {
  status: string;
  artist: Artist[];
  artistCategories: ArtistCategory[];
}

export interface Single {
  title: string;
  artist_name: string;
  coverImageURL: string;
}

export interface GetHitSingles {
  status: string;
  singles: Single[];
  clientIp: string;
  time: number;
}

export interface SearchPlaylists {
  status: string;
  artistCategories: ArtistCategory[];
}
