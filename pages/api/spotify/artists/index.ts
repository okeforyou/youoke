import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

import { Artist, ArtistCategory, GetTopArtists } from "../../../../types";

/**
 * Get Top Artists from Hardcoded List
 *
 * Since external APIs (Spotify, JOOX) are unavailable,
 * we use a curated list of popular Thai artists
 * Updated periodically based on trending data
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetTopArtists | { error: string }>
) {
  try {
    // Hardcoded list of popular Thai artists
    // This can be updated periodically or replaced with a database
    const artistList: Artist[] = [
      {
        name: "ลำไย ไหทองคำ",
        imageUrl: "https://i.ytimg.com/vi/9z5qpyxPKbg/maxresdefault.jpg",
      },
      {
        name: "ไผ่ พงศธร",
        imageUrl: "https://i.ytimg.com/vi/vWR7MjZ0a_s/maxresdefault.jpg",
      },
      {
        name: "บอย พีซเมกเกอร์",
        imageUrl: "https://i.ytimg.com/vi/mddFze81y8I/maxresdefault.jpg",
      },
      {
        name: "ก้อง ห้วยไร่",
        imageUrl: "https://i.ytimg.com/vi/XPGUu3ELGqM/maxresdefault.jpg",
      },
      {
        name: "ไอซ์ ศรัณยู",
        imageUrl: "https://i.ytimg.com/vi/VIYcqxHj6f0/maxresdefault.jpg",
      },
      {
        name: "แสตมป์ อภิวัชร์",
        imageUrl: "https://i.ytimg.com/vi/2ZBxV4S5cMo/maxresdefault.jpg",
      },
      {
        name: "จินตหรา พูนลาภ",
        imageUrl: "https://i.ytimg.com/vi/xF0fTME_BvQ/maxresdefault.jpg",
      },
      {
        name: "ไมค์ ภิรมย์พร",
        imageUrl: "https://i.ytimg.com/vi/n3Ec7q8DnsQ/maxresdefault.jpg",
      },
      {
        name: "ดา เอ็นโดรฟิน",
        imageUrl: "https://i.ytimg.com/vi/d3G22wK9Ufw/maxresdefault.jpg",
      },
      {
        name: "เบิร์ด ธงไชย",
        imageUrl: "https://i.ytimg.com/vi/qZ7FT_AcDt8/maxresdefault.jpg",
      },
      {
        name: "แอม ชุติมา",
        imageUrl: "https://i.ytimg.com/vi/IqjGq1E_qH4/maxresdefault.jpg",
      },
      {
        name: "หนุ่ม กะลา",
        imageUrl: "https://i.ytimg.com/vi/VwWA6F1YDz8/maxresdefault.jpg",
      },
    ];

    const artists: GetTopArtists = {
      status: "success",
      artist: artistList,
      artistCategories: [], // Empty for now
    };

    res.status(200).json(artists);
  } catch (error) {
    console.error("Error fetching top artists:", error);
    res.status(500).json({ error: error.message });
  }
}
