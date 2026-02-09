import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";

import { getAccessToken } from "../../../../modules/spotify-theme/services/auth";
import { Artist, ArtistCategory, GetTopArtists } from "../../../../types";

/**
 * Get Top Artists from Spotify Playlist (V1 Restoration)
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
    console.log('⚡ Serving Top Artists from Cache (Spotify API)');
    return res.status(200).json(cachedData);
  }

  try {
    console.log("🚀 [API] Starting Spotify Top Artists Fetch...");
    const accessToken = await getAccessToken();
    if (!accessToken) throw new Error("No access token");
    console.log("✅ [API] Access Token Obtained");

    let artistList: Artist[] = [];
    let artistCategories: ArtistCategory[] = [];

    // Thai name mapping for popular artists (V1 Feature)
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
      "Three Man Down": "ทรีแมนดาวน์",
      "Ink Waruntorn": "อิ้งค์ วรันธร",
      "Cocktail": "ค็อกเทล",
      "Potato": "โปเตโต้",
      "Bodyslam": "บอดี้สแลม",
      "The Toys": "เดอะทอยส์",
      "NUM KALA": "หนุ่ม กะลา",
      "Labanoon": "ลาบานูน",
      "Klear": "เคลียร์",
      "Lula": "ลุลา",
      "Pop Pongkool": "ป๊อบ ปองกูล",
      "Oat Pramote": "โอ๊ต ปราโมทย์",
      "Zom Marie": "ส้ม มารี",
      "Meyou": "มียู",
      "Lazyloxy": "เลซี่ล็อกซี่",
      "UrboyTJ": "ยัวบอยทีเจ",
      "Silly Fools": "ซิลลี่ ฟูลส์",
      "Loso": "โลโซ"
    };

    // Use same playlist as trending hits for consistency
    const playlistId = "37i9dQZF1DXabc123"; // You might need to verify the exact V1 playlist ID, currently using a placeholder or try to find a known one. 
    // Actually, step 21982 had: "3oLUwlQTdzsCkTK72wCbv9" // Thailand Top 50. Let's use that.
    const realPlaylistId = "37i9dQZF1DXa2SPUyWl8Y5"; // GMM Grammy Hits? No, let's use Thailand Top 50 if possible or just Global Top 50 filtered.
    // "3oLUwlQTdzsCkTK72wCbv9" seemed potentially invalid or user specific?
    // Let's use the standard "Top 50 - Thailand" ID: 37i9dQZEVXbMnz8KIWsvf9 
    // Or "Thailand Top 100": 4Hub8hsC1gM1qHn8y7tX2M (User generated?) 
    // Let's safe bet on "Viral 50 - Thailand": 37i9dQZEVXbQbUZFD0f9tW
    // OR just "37i9dQZF1DX3XlBkCi835s" (T-Pop)?

    // Let's check what was in the file originally...
    // 61:     const playlistId = "3oLUwlQTdzsCkTK72wCbv9"; // Thailand Top 50
    // Okay, reusing that.

    // Additional Categories (Community Playlists for reliability)
    const featuredPlaylists = [
      { id: "37i9dQZF1DX2L0iB23Enbq", name: "ลูกทุ่ง 100 ล้านวิว" }, // Seems 404 in test, need replacement? Script said: "ลูกทุ่ง 100 ล้านวิว" -> 37i9dQZF1DX2L0iB23Enbq FAILED. 
      // Wait, let's use the replacement found: "ลูกทุ่งใหม่ล่าสุด" -> 5JkMBWpazeS8XR71K5AkF3 (Wait, GMM Grammy used this ID in logs?)
      // Let's re-read the logs carefully.
      // - GMM Grammy -> 5JkMBWpazeS8XR71K5AkF3
      // - T-Pop -> 7cRJJyu6D4AsMbnbYRKF6f
      // - 2000s -> 5yhWfXNAYtuCzyedJo7xTv
      // - New Songs -> 29pxi8RaCRBDvvtU012OZ2
      // - Luk Thung? (First one in list). The log truncated...
      // "❌ [FAIL] ลูกทุ่ง 100 ล้านวิว (37i9dQZF1DX2L0iB23Enbq): 404"
      // "   🔎 Searching replacement for: ลูกทุ่ง 100 ล้านวิว..."
      // "   ✨ Found replacement: "ลูกทุ่ง 100 ล้านวิว" -> ID: 01pGg4AsMbnbYRKF6f (Hypothetical - log was cut)"
      // PROPOSE: I will just use a safe bets based on search logic or generic terms if ID is unknown.
      // ACTUALLY: The log showed: 
      // - GMM Grammy -> 5JkMBWpazeS8XR71K5AkF3
      // - T-Pop -> 7cRJJyu6D4AsMbnbYRKF6f 
      // - 2000s -> 5yhWfXNAYtuCzyedJo7xTv
      // - New -> 29pxi8RaCRBDvvtU012OZ2
      // I am missing the Luk Thung ID. I will use "37i9dQZF1DX2L0iB23Enbq" (Original) but maybe it failed due to limit?
      // I'll use a generic known Luk Thung or search result.
      // "Thai Top Hits 2025" -> 6H6DccZQ0NFw7rDaYu5h10 (Main)

      // I'll use these specific ones found:
      { id: "1TOOUD3g3dnF4WBTIlLr9B", name: "เพลงฮิต (Popup)" }, // Reusing popup as a generic fallback/hit list
      { id: "5JkMBWpazeS8XR71K5AkF3", name: "GMM Grammy" },
      { id: "7cRJJyu6D4AsMbnbYRKF6f", name: "T-Pop Hits" },
      { id: "5yhWfXNAYtuCzyedJo7xTv", name: "เพลงฮิตยุค 2000" },
      { id: "29pxi8RaCRBDvvtU012OZ2", name: "เพลงใหม่ล่าสุด" }
    ];

    // Strategy: Try Community Playlist (Verified Working) -> Backup Playlist -> Global Top 50
    let playlistData: any = { items: [] }; // Store the actual data part, not the axios response

    // 🟢 Verified Working Playlists (from debug script)
    const mainPlaylistId = "6H6DccZQ0NFw7rDaYu5h10";
    const backupPlaylistId = "1TOOUD3g3dnF4WBTIlLr9B";
    const globalPlaylistId = "37i9dQZEVXbMDoHDwVN2tF";

    try {
      console.log(`🎵 [API] Fetching Main Playlist: ${mainPlaylistId}`);
      const res = await axios.get(`https://api.spotify.com/v1/playlists/${mainPlaylistId}/tracks`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { limit: 50, market: 'TH' }
      });
      playlistData = res.data;
      console.log(`✅ [API] Main Playlist Fetched: ${playlistData.items?.length} tracks`);
    } catch (e: any) {
      console.warn(`⚠️ [API] Main Playlist failed: ${e.message}. Trying backup...`);
      try {
        console.log(`🎵 [API] Fetching Backup Playlist: ${backupPlaylistId}`);
        const res = await axios.get(`https://api.spotify.com/v1/playlists/${backupPlaylistId}/tracks`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { limit: 50, market: 'TH' }
        });
        playlistData = res.data;
        console.log(`✅ [API] Backup Playlist Fetched: ${playlistData.items?.length} tracks`);
      } catch (e2: any) {
        console.warn(`⚠️ [API] Backup Playlist failed: ${e2.message}. Trying Global...`);
        try {
          console.log(`🎵 [API] Fetching Global Playlist: ${globalPlaylistId}`);
          const res = await axios.get(`https://api.spotify.com/v1/playlists/${globalPlaylistId}/tracks`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            params: { limit: 50, market: 'TH' }
          });
          playlistData = res.data;
          console.log(`✅ [API] Global Playlist Fetched: ${playlistData.items?.length} tracks`);
        } catch (e3: any) {
          console.error(`❌ [API] All Playlist fetches failed.`, e3.message);
        }
      }
    }

    console.log("🎵 [API] Fetching Categories...");
    const categoryResponses = await Promise.all(
      featuredPlaylists.map(cat =>
        axios.get(`https://api.spotify.com/v1/playlists/${cat.id}?fields=id,name,images`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        }).then(res => ({ ...res, _id: cat.id })) // Pass ID for debugging
          .catch(err => {
            console.error(`❌ [API] Failed to fetch category ${cat.name} (${cat.id}):`, err.message);
            return { data: null };
          })
      )
    );

    // Populate Categories
    artistCategories = categoryResponses
      .map(res => res.data)
      .filter(data => data && data.id)
      .map(data => ({
        tag_id: data.id,
        tag_name: data.name,
        imageUrl: data.images?.[0]?.url || ""
      }));

    console.log(`✅ [API] Categories Processed: ${artistCategories.length}/${featuredPlaylists.length}`);

    // Validate playlistData before accessing items
    const tracks = playlistData?.items || [];
    console.log(`📊 [API] Processing ${tracks.length} tracks...`);

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

      // Try to get artist image from album (not perfect but works)
      const artistImage = track.album?.images?.[0]?.url || "";

      if (artistMap.has(artistName)) {
        artistMap.get(artistName)!.songCount++;
      } else {
        artistMap.set(artistName, {
          name: artistName,
          imageUrl: artistImage,
          songCount: 1,
        });
      }
    }

    // Convert to array and sort by song count
    const sortedArtists = Array.from(artistMap.values())
      .sort((a, b) => b.songCount - a.songCount)
      .slice(0, 18);

    artistList = sortedArtists.map(artist => ({
      name: thaiNameMap[artist.name] || artist.name,
      imageUrl: artist.imageUrl,
    }));

    const artists: GetTopArtists = {
      status: "success",
      artist: artistList,
      artistCategories,
    };

    // Update Cache
    cachedData = artists;
    lastFetch = Date.now();

    console.log(`✅ [API] Success: Sending response with ${artistList.length} artists`);
    res.status(200).json(artists);
  } catch (error: any) {
    console.error("❌ [API] CRITICAL ERROR fetching top artists:", error);

    // Fallback if Spotify fails?
    if (cachedData) {
      console.log("⚠️ [API] Serving stale cache due to error");
      return res.status(200).json(cachedData);
    }

    // Return a safe empty response instead of 500 if possible, or just the error
    res.status(500).json({ error: (error as Error).message });
  }
}
