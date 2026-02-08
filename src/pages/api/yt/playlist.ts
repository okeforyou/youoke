import { NextApiRequest, NextApiResponse } from 'next';
import YTMusic from 'ytmusic-api';
import axios from 'axios';

const ytmusic = new YTMusic();

/**
 * Fallback Scraper for Playlists when API fails
 */
async function scrapePlaylist(playlistId: string) {
    try {
        const url = `https://www.youtube.com/playlist?list=${playlistId}`;
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept-Language': 'th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7'
        };
        const { data: html } = await axios.get(url, { headers });

        // Extract ytInitialData
        const match = html.match(/var ytInitialData = ({.*?});/s);
        if (!match || !match[1]) throw new Error("Could not extract ytInitialData");

        const data = JSON.parse(match[1]);

        // Traverse to find tabs -> tabRenderer -> content -> sectionListRenderer -> ... -> playlistVideoListRenderer
        const contents = data.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer?.contents;

        if (!contents) {
            // Might be alerts ONLY (e.g. Empty playlist)
            const alerts = data.alerts;
            if (alerts && alerts.length > 0) throw new Error("Playlist might be private or empty.");
            throw new Error("Could not find playlist contents in DOM.");
        }

        const items = contents
            .filter((c: any) => c.playlistVideoRenderer)
            .map((c: any) => {
                const v = c.playlistVideoRenderer;
                const thumbs = v.thumbnail?.thumbnails || [];
                return {
                    id: v.videoId,
                    title: v.title?.runs?.[0]?.text || "Unknown Title",
                    subtitle: v.shortBylineText?.runs?.[0]?.text || "Unknown Artist",
                    thumbnail: thumbs[thumbs.length - 1]?.url || thumbs[0]?.url || "",
                    type: 'video',
                    duration: parseInt(v.lengthSeconds || '0')
                };
            });

        const header = data.header?.playlistHeaderRenderer || data.sidebar?.playlistSidebarRenderer?.items?.[0]?.playlistSidebarPrimaryInfoRenderer;

        const title = header?.title?.simpleText || header?.title?.runs?.[0]?.text || "Playlist";
        const meta = header?.ownerText?.runs?.[0]?.text || "";
        const subtitle = meta || "YouTube Playlist";

        return {
            id: playlistId,
            title,
            subtitle,
            items,
            thumbnail: items[0]?.thumbnail || ""
        };

    } catch (e: any) {
        console.error("Scraper failed:", e.message);
        throw e;
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // 1. Initialize with Thailand Locale
    try {
        await ytmusic.initialize({ GL: 'TH', HL: 'th' });
    } catch (e) {
        // console.error("YTMusic Initialize Failed:", e);
    }

    const { id, type } = req.query;

    if (!id || typeof id !== 'string') {
        return res.status(400).json({ status: 'error', message: 'Missing playlist ID' });
    }

    try {
        let results: any;
        let formattedItems = [];
        let title = '';
        let subtitle = '';
        let thumbnail = '';

        if (type === 'album') {
            console.log(`Fetching Album: ${id}`);
            results = await ytmusic.getAlbum(id);
            title = results.name || results.title;
            subtitle = results.artist?.name || 'Unknown Artist';
            thumbnail = results.thumbnails && results.thumbnails.length > 0
                ? results.thumbnails[results.thumbnails.length - 1].url
                : '';

            if (results.songs) {
                formattedItems = results.songs.map((song: any) => ({
                    id: song.videoId,
                    title: song.name,
                    subtitle: song.artist?.name || subtitle,
                    thumbnail: song.thumbnails?.[0]?.url || thumbnail,
                    type: 'video',
                    duration: song.duration
                }));
            }
        } else {
            // PLAYLIST
            console.log(`Fetching Playlist: ${id}`);
            let useScraper = false;

            try {
                results = await ytmusic.getPlaylist(id);
                // Validation: Check if it actually has content
                const items = results.content || results.items;
                if (!items || !Array.isArray(items) || items.length === 0) {
                    console.warn("getPlaylist returned no items. Attempting fallback scraper...");
                    useScraper = true;
                }
            } catch (playlistError: any) {
                console.warn("getPlaylist crashed. Attempting fallback scraper...", playlistError.message);
                useScraper = true;
            }

            if (useScraper) {
                try {
                    const scrapedData = await scrapePlaylist(id);
                    formattedItems = scrapedData.items;
                    title = scrapedData.title;
                    subtitle = scrapedData.subtitle;
                    thumbnail = scrapedData.thumbnail;
                    results = { name: title }; // Just to pass check below
                } catch (scraperError) {
                    console.error("Critical: Scraper also failed.", scraperError);
                    throw new Error("Unable to load playlist. It may be private or restricted.");
                }
            } else {
                // Standard API Path
                title = results.name || results.title;
                subtitle = results.description || 'Playlist';
                thumbnail = results.thumbnails?.[results.thumbnails.length - 1]?.url || '';
                const items = results.content || results.items || [];
                formattedItems = items.map((item: any) => ({
                    id: item.videoId,
                    title: item.name,
                    subtitle: item.author?.name || item.artist?.name || 'Unknown',
                    thumbnail: item.thumbnails?.[1]?.url || item.thumbnails?.[0]?.url || thumbnail,
                    type: 'video',
                    duration: item.duration
                }));
            }
        }

        res.status(200).json({
            status: 'success',
            data: {
                id: id,
                title: title,
                subtitle: subtitle,
                thumbnail: thumbnail,
                items: formattedItems,
                type: type
            }
        });

    } catch (error: any) {
        console.error("YT Playlist Fetch Error:", error);
        res.status(200).json({
            status: 'error',
            message: error.message || 'Failed to fetch content',
            debug_info: error.toString()
        });
    }
}
