import type { NextApiRequest, NextApiResponse } from "next";
import { scrapeYouTubePlaylistVideos, scrapeYouTubeSearch } from "../../../utils/youtubeScraper";
import { getSpotifyPlaylistTracks, getSpotifyAlbumTracks } from "../../../services/spotifyApi";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: "Playlist ID is required" });
  }

  try {
    // =================================================================================
    // STRATEGY 1: SPOTIFY RESOLVER (SPOTITUBE)
    // =================================================================================
    if (id.startsWith('sp-')) {
      console.log(`[API] Resolving Spotify Playlist: ${id}`);
      let spotifyTracks: any[] = [];
      const isAlbum = id.startsWith('sp-album-');
      const realId = id.replace(isAlbum ? 'sp-album-' : 'sp-', '');

      try {
        if (isAlbum) {
          spotifyTracks = await getSpotifyAlbumTracks(realId);
        } else {
          spotifyTracks = await getSpotifyPlaylistTracks(realId);
        }
      } catch (e: any) {
        console.error("Spotify Fetch Failed", e.message);
        return res.status(404).json({ error: "Spotify playlist not found" });
      }

      // Limit to Top 20 tracks to prevent timeout and rate-limiting
      const tracksToResolve = spotifyTracks.slice(0, 20);
      console.log(`[Spotitube] Resolving ${tracksToResolve.length} tracks...`);

      // Resolve in parallel (Concurrency: 5)
      // Optimized: Process in batches to balance speed and rate limits
      const BATCH_SIZE = 5;
      const resolvedVideos = [];

      for (let i = 0; i < tracksToResolve.length; i += BATCH_SIZE) {
        const batch = tracksToResolve.slice(i, i + BATCH_SIZE);
        console.log(`[Spotitube] Processing batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} tracks)...`);

        const batchResults = await Promise.all(
          batch.map(async (track) => {
            // Search Query: Artist - Title Audio
            const query = `${track.artist} - ${track.title} Audio`;
            try {
              // Return just the first result
              const searchResults = await scrapeYouTubeSearch(query, 6000); // 6s timeout per search
              if (searchResults.length > 0) {
                const bestMatch = searchResults[0];
                return {
                  videoId: bestMatch.videoId,
                  title: track.title, // Use Clean Spotify Title
                  author: track.artist, // Use Clean Spotify Artist
                  // Use Spotify Thumbnail if available, fallback to YouTube
                  videoThumbnails: track.thumbnail ? [{ url: track.thumbnail, quality: 'high', width: 640, height: 640 }] : bestMatch.videoThumbnails
                };
              }
            } catch (e) {
              console.warn(`[Spotitube] Failed to resolve: ${query}`);
              return null;
            }
            return null;
          })
        );

        // Add successful resolutions
        resolvedVideos.push(...batchResults.filter((v): v is any => v !== null));

        // Small delay between batches to be nice to YouTube
        if (i + BATCH_SIZE < tracksToResolve.length) {
          await new Promise(r => setTimeout(r, 500));
        }
      }

      console.log(`[Spotitube] Resolved ${resolvedVideos.length}/${tracksToResolve.length} videos`);
      return res.status(200).json({ videos: resolvedVideos });
    }

    // =================================================================================
    // STRATEGY 2: YOUTUBE DIRECT SCRAPER (FALLBACK/LEGACY)
    // =================================================================================
    console.log(`[API] Fetching YouTube playlist: ${id}`);
    const videos = await scrapeYouTubePlaylistVideos(id);

    if (videos.length === 0) {
      return res.status(404).json({ error: "No videos found in playlist" });
    }

    return res.status(200).json({ videos });

  } catch (error: any) {
    console.error(`[API] Playlist fetch failed: ${error.message}`);
    return res.status(500).json({ error: "Failed to fetch playlist items", details: error.message });
  }
}
