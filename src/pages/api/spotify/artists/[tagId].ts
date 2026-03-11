// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import axios from "axios";

import { getAccessToken } from "../../../../modules/spotify-theme/services/auth";

import type { NextApiRequest, NextApiResponse } from "next";
//https://www.joox.com/th/artists

// Simple Cache Map
const playlistCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_DURATION = 10 * 60 * 1000; // 10 Minutes

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    let { tagId } = req.query;
    if (Array.isArray(tagId)) tagId = tagId[0];

    const accessToken = await getAccessToken();

    let playlistId = tagId;
    // Strip sp- prefix if present (added by search/playlists.ts)
    if (playlistId && playlistId.startsWith('sp-')) {
      playlistId = playlistId.replace('sp-', '');
    }

    if (!playlistId || playlistId === 'undefined') {
      console.warn("Invalid TagID:", tagId);
      return res.status(200).json({ status: "success", artist: [] });
    }
    // Check Cache
    const cached = playlistCache.get(playlistId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`⚡ Serving Playlist ${playlistId} from Cache`);
      return res.status(200).json(cached.data);
    }

    // Check for YouTube Playlist (Hybrid Mode or Raw YT ID)
    const isYoutube = playlistId.startsWith('yt-') || 
                      playlistId.startsWith('PL') || 
                      playlistId.startsWith('VL') || 
                      playlistId.startsWith('RD') ||
                      playlistId.length > 25; // YouTube IDs are usually longer than Spotify IDs

    if (isYoutube) {
      console.log(`[API] Fetching YouTube Playlist (InnerTube): ${playlistId}`);
      const ytId = playlistId.replace('yt-', '');

      const { Innertube } = require('youtubei.js');
      const youtube = await Innertube.create();
      
      const playlist = await youtube.music.getPlaylist(ytId);
      
      const artists = {
        status: "success",
        playlist: {
          id: playlistId,
          name: playlist.header?.title?.toString() || "YouTube Playlist",
          description: playlist.header?.description?.toString() || "Tracks from YouTube",
          imageUrl: playlist.header?.thumbnails?.[0]?.url || "",
          owner: playlist.header?.author?.name || "YouTube Music"
        },
        artist: playlist.contents?.map((v: any) => ({
          id: v.id,
          title: v.title?.toString() || "Unknown",
          artist_name: v.author?.name || "Unknown Artist",
          coverImageURL: v.thumbnails?.[0]?.url || "",
          imageUrl: v.thumbnails?.[0]?.url || "",
        })) || []
      };

      // Cache
      playlistCache.set(playlistId, { data: artists, timestamp: Date.now() });
      return res.status(200).json(artists);
    }

    // Fetching the specific playlist by ID (Spotify)
    const playlistResponse = await axios.get(
      `https://api.spotify.com/v1/playlists/${playlistId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const playlistData = playlistResponse.data;
    const tracks = playlistData.tracks?.items || [];

    const artists = {
      status: "success",
      // Add Metadata for Self-Healing
      playlist: {
        id: playlistData.id,
        name: playlistData.name,
        description: playlistData.description,
        imageUrl: playlistData.images?.[0]?.url || "",
        owner: playlistData.owner?.display_name
      },
      artist: tracks
        .filter((a: any) => !!a.track)
        .map((a: any) => ({
          id: a.track.id,
          title: a.track.name || "Unknown Track",
          artist_name: a.track.artists?.map((artist: any) => artist.name).join(', ') || "Unknown Artist",
          coverImageURL: a.track.album?.images?.[0]?.url || "",
          imageUrl: a.track.album?.images?.[0]?.url || "",
        })),
    };

    // Save to Cache
    playlistCache.set(playlistId, { data: artists, timestamp: Date.now() });

    res.status(200).json(artists);
  } catch (error: any) {
    console.error(`❌ Error fetching playlist ${req.query.tagId}:`, error.response?.data || error.message);
    res.status(500).json({ error: error.message, details: error.response?.data });
  }
}
