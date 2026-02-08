import axios from 'axios';
import { getAccessToken } from './auth';

/**
 * Get Spotify Access Token
 * Now delegates to the centralized service which handles SystemConfig
 */
export async function getSpotifyToken(): Promise<string> {
    const token = await getAccessToken();
    if (!token) throw new Error("Failed to retrieve Spotify access token");
    return token;
}

/**
 * Fetch Featured Playlists (Explore)
 */
export async function getSpotifyFeaturedPlaylists(country: string = 'TH', limit: number = 10) {
    try {
        const token = await getSpotifyToken();
        const res = await axios.get(`https://api.spotify.com/v1/browse/featured-playlists?country=${country}&limit=${limit}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data.playlists.items;
    } catch (e) {
        console.warn("Failed to fetch Spotify Featured:", e);
        return [];
    }
}

/**
 * Fetch New Releases
 */
export async function getSpotifyNewReleases(country: string = 'TH', limit: number = 10) {
    try {
        const token = await getSpotifyToken();
        const res = await axios.get(`https://api.spotify.com/v1/browse/new-releases?country=${country}&limit=${limit}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data.albums.items;
    } catch (e) {
        console.warn("Failed to fetch Spotify New Releases:", e);
        return [];
    }
}

/**
 * Fetch Category Playlists (e.g. Pop, T-Pop)
 */
export async function getSpotifyCategoryPlaylists(categoryId: string, country: string = 'TH', limit: number = 10) {
    const token = await getSpotifyToken();
    try {
        const res = await axios.get(`https://api.spotify.com/v1/browse/categories/${categoryId}/playlists?country=${country}&limit=${limit}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data.playlists.items;
    } catch (e) {
        console.warn(`Category ${categoryId} not found or empty`);
        return [];
    }
}

/**
 * Fetch Tracks from a Playlist
 */
export async function getSpotifyPlaylistTracks(playlistId: string) {
    const token = await getSpotifyToken();
    const res = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return res.data.items.map((item: any) => ({
        title: item.track.name,
        artist: item.track.artists.map((a: any) => a.name).join(", "),
        album: item.track.album.name,
        thumbnail: item.track.album.images?.[0]?.url,
        duration: item.track.duration_ms
    }));
}

/**
 * Fetch Tracks from an Album
 */
export async function getSpotifyAlbumTracks(albumId: string) {
    const token = await getSpotifyToken();
    const res = await axios.get(`https://api.spotify.com/v1/albums/${albumId}/tracks?limit=50`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    // Album tracks don't have album info or images in the track object usually, need to get from album or just ignore
    // But we need the artwork. The album endpoint returns tracks, but artwork is on the album object.
    // However, usually we can pass the album artwork url if we want, but let's see. 
    // Actually, simply fetching the album details again or just using a default is safer for now.
    // Better strategy: The Caller usually has the thumbnail from the Explore feed. 
    // But here we return a list.
    // Let's fetch the album details to get the image.

    const albumRes = await axios.get(`https://api.spotify.com/v1/albums/${albumId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    const artwork = albumRes.data.images?.[0]?.url || "";

    return res.data.items.map((item: any) => ({
        title: item.name,
        artist: item.artists.map((a: any) => a.name).join(", "),
        album: albumRes.data.name,
        thumbnail: artwork,
        duration: item.duration_ms
    }));
}

/**
 * Search Playlists on Spotify
 */
export async function searchSpotifyPlaylists(query: string, limit: number = 20, offset: number = 0) {
    const token = await getSpotifyToken();
    try {
        const res = await axios.get(`https://api.spotify.com/v1/search`, {
            params: { q: query, type: 'playlist', limit: limit, offset: offset },
            headers: { Authorization: `Bearer ${token}` }
        });
        return res.data.playlists.items;
    } catch (e) {
        console.error("Spotify Search Failed", e);
        return [];
    }
}
