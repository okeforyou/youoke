import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

import { getAccessToken } from "../../../../modules/spotify-theme/services/auth";
import { Artist, ArtistCategory, GetTopArtists } from "../../../../types";

/**
 * Get Top Artists from Spotify Playlist
 *
 * Uses Thailand Top 50 playlist to find artists with most trending songs
 * Updates automatically when playlist is updated
 */
// Simple In-Memory Cache
let cachedData: GetTopArtists | null = null;
let lastFetch: number = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 Minutes

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GetTopArtists | { error: string }>
) {
  // Check Cache
  if (cachedData && Date.now() - lastFetch < CACHE_DURATION) {
    console.log('⚡ Serving Top Artists from Cache');
    return res.status(200).json(cachedData);
  }

  try {
    const accessToken = await getAccessToken();
    if (!accessToken) throw new Error("No access token");
    console.log("✅ Got access token:", accessToken.substring(0, 20) + "...");
    let artistList: Artist[] = [];
    let artistCategories: ArtistCategory[] = [];

    // Thai name mapping for popular artists
    // Use Thai name for better search results in Thailand
    const thaiNameMap: Record<string, string> = {
      "YOUNGOHM": "ยังโอม",
      "WANYAi": "วันใหม่",
      "PURPEECH": "เพอร์พีช",
      "BLVCKHEART": "แบล็คฮาร์ท",
      "BOWKYLION": "โบวี่ไลอ้อน",
      "SEA.": "ซี",
      "Yes'sir Days": "เยสเซอร์เดย์ส",
      "BETAYOURBITCH": "เบต้า",
      "Jeff Satur": "เจฟ สาทอร์",
      "guncharlie": "กัน ชาลี",
      "PUN": "ปัน",
      "Violette Wautier": "ไวโอเลต วอเทียร์",
      "NONT TANONT": "นนท์ ธนนท์",
      "Palmy": "ปาล์มมี่",
      "Billkin": "บิวกิ้น",
      "Sprite": "สไปร์ท",
      "F.HERO": "เอฟฮีโร่",
      "Carabao": "คาราบาว",
      "Maxzy": "แม็กซี่",
      "TaitosmitH": "ไท โตสมิธ",
    };

    // Use same playlist as trending hits for consistency
    const playlistId = "3oLUwlQTdzsCkTK72wCbv9"; // Thailand Top 50

    // Additional Categories (Mock Genres using Playlists)
    const featuredPlaylists = [
      { id: "37i9dQZF1DX2L0iB23Enbq", name: "ลูกทุ่ง 100 ล้านวิว" },
      { id: "37i9dQZF1DXa2SPUyWl8Y5", name: "GMM Grammy" },
      { id: "37i9dQZF1DX3XlBkCi835s", name: "T-Pop" },
      { id: "37i9dQZF1DWZtZ8vUCzXqi", name: "เพลงฮิตยุค 2000" },
      { id: "37i9dQZF1DX0t34Gq8hZba", name: "เพลงใหม่ล่าสุด" }
    ];

    console.log(`🎵 Fetching playlist: ${playlistId} and categories`);

    // Fetch Main Playlist and Featured Categories in Parallel
    const [playlistResponse, ...categoryResponses] = await Promise.all([
      axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, { headers: { Authorization: `Bearer ${accessToken}` } }),
      ...featuredPlaylists.map(cat =>
        axios.get(`https://api.spotify.com/v1/playlists/${cat.id}?fields=id,name,images`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        }).catch(err => {
          console.error(`Failed to fetch category ${cat.id}:`, err.message);
          return { data: null };
        })
      )
    ]);

    // Populate Categories
    artistCategories = categoryResponses
      .map(res => res.data)
      .filter(data => data && data.id)
      .map(data => ({
        tag_id: data.id,
        tag_name: data.name,
        imageUrl: data.images?.[0]?.url || ""
      }));

    const tracks = playlistResponse.data.items;
    console.log(`📊 Got ${tracks.length} tracks from Thailand Top 50 playlist`);

    // Helper function to check if text contains Thai characters
    const hasThaiCharacters = (text: string) => {
      return /[\u0E00-\u0E7F]/.test(text);
    };

    // Count songs per artist and collect artist info
    const artistMap = new Map<string, {
      name: string;
      imageUrl: string;
      songCount: number;
    }>();

    for (const item of tracks) {
      if (!item?.track) continue;

      const track = item.track;
      const artistName = track.artists[0]?.name || "";
      const trackName = track.name || "";

      // Filter: Only include artists with Thai characters in name OR song title
      // RELAXED: Allow all artists from Top 50, but maybe prioritize Thai?
      // For now, let's just allow everyone to ensure the list isn't empty.
      /*
      if (!hasThaiCharacters(artistName) && !hasThaiCharacters(trackName)) {
        console.log(`⏭️  Skipping non-Thai artist: ${artistName}`);
        continue;
      }
      */

      const artistImage = track.album?.images?.[0]?.url || "";

      if (artistMap.has(artistName)) {
        // Increment song count for existing artist
        const artist = artistMap.get(artistName)!;
        artist.songCount++;
      } else {
        // Add new artist
        artistMap.set(artistName, {
          name: artistName,
          imageUrl: artistImage,
          songCount: 1,
        });
      }
    }

    // Convert to array and sort by song count (most songs first)
    const sortedArtists = Array.from(artistMap.values())
      .sort((a, b) => b.songCount - a.songCount)
      .slice(0, 12); // Top 12 artists

    artistList = sortedArtists.map(artist => ({
      name: thaiNameMap[artist.name] || artist.name, // Use Thai name if available
      imageUrl: artist.imageUrl,
    }));

    console.log(`✅ Final artist list: ${artistList.length} artists`);
    console.log(`Top artists:`, sortedArtists.map(a => `${a.name} (${a.songCount} songs)`));

    const artists: GetTopArtists = {
      status: "success",
      artist: artistList,
      artistCategories,
    };

    // Update Cache
    cachedData = artists;
    lastFetch = Date.now();

    res.status(200).json(artists);
  } catch (error) {
    console.error("Error fetching top artists:", error);
    res.status(500).json({ error: (error as Error).message });
  }
}
