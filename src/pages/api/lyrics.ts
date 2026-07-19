import type { NextApiRequest, NextApiResponse } from 'next';
import { YoutubeTranscript } from 'youtube-transcript';
import getArtistTitle from 'get-artist-title';

function parseLRC(lrc: string) {
    const lines = lrc.split('\n');
    const lyrics = [];
    for (const line of lines) {
        // Match [mm:ss.xx] or [mm:ss.xxx]
        const match = line.match(/\[(\d{2,}):(\d{2}(?:\.\d{2,3})?)\](.*)/);
        if (match) {
            const min = parseInt(match[1], 10);
            const sec = parseFloat(match[2]);
            const text = match[3].trim();
            if (text) {
                lyrics.push({ time: min * 60 + sec, text });
            }
        }
    }
    return lyrics;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { videoId, title, forceSource } = req.query;

    if (!videoId || typeof videoId !== 'string') {
        return res.status(400).json({ error: 'Missing videoId' });
    }

    let lyrics: any[] = [];
    let source: 'lrclib' | 'youtube' | null = null;

    // 1. Try LRCLIB first if title is provided and we aren't forcing youtube
    if (title && typeof title === 'string' && forceSource !== 'youtube') {
        try {
            // Clean title (e.g. remove "Official MV", "Lyrics", etc.)
            const cleanTitle = title
                .replace(/(\(|\[).*?(official|mv|lyrics|lyric|audio|video|live).*?(\)|\])/gi, '')
                .trim();
            
            // Use generic search which works much better for varied Thai title formats
            const searchParams = new URLSearchParams({
                q: cleanTitle
            });

            const lrclibRes = await fetch(`https://lrclib.net/api/search?${searchParams.toString()}`);
            if (lrclibRes.ok) {
                const data = await lrclibRes.json();
                if (Array.isArray(data) && data.length > 0) {
                    // Find the first one with synced lyrics
                    const bestMatch = data.find((d: any) => d.syncedLyrics);
                    if (bestMatch && bestMatch.syncedLyrics) {
                        lyrics = parseLRC(bestMatch.syncedLyrics);
                        source = 'lrclib';
                    }
                }
            }
        } catch (error) {
            console.error('LRCLIB fetch error:', error);
        }
    }

    // 2. Fallback to YouTube Transcript if LRCLIB failed
    if (lyrics.length === 0) {
        try {
            const transcript = await YoutubeTranscript.fetchTranscript(videoId);
            if (transcript && transcript.length > 0) {
                lyrics = transcript.map(t => ({
                    time: t.offset / 1000,
                    text: t.text.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
                }));
                // Filter out empty lines or generic noises like [Music] if desired, 
                // but usually fine to keep for timing.
                source = 'youtube';
            }
        } catch (error) {
            console.error('YouTube Transcript fetch error:', error);
        }
    }

    if (lyrics.length > 0) {
        res.status(200).json({ lyrics, source });
    } else {
        res.status(404).json({ error: 'No lyrics found' });
    }
}
