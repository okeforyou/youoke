import type { NextApiRequest, NextApiResponse } from 'next';
import { YoutubeTranscript } from 'youtube-transcript';
import getArtistTitle from 'get-artist-title';

function parseLRC(lrc: string) {
    const lines = lrc.split('\n');
    const lyrics = [];
    const timeRegex = /\[(\d{2,}):(\d{2}(?:\.\d{2,3})?)\]/g;

    for (const line of lines) {
        let match;
        const times = [];
        // Extract all time tags
        while ((match = timeRegex.exec(line)) !== null) {
            const min = parseInt(match[1], 10);
            const sec = parseFloat(match[2]);
            times.push(min * 60 + sec);
        }
        
        // Remove time tags to get text
        const text = line.replace(/\[\d{2,}:\d{2}(?:\.\d{2,3})?\]/g, '').trim();
        
        if (text) {
            for (const time of times) {
                lyrics.push({ time, text });
            }
        }
    }
    
    // Sort by time (required when multiple time tags are expanded)
    lyrics.sort((a, b) => a.time - b.time);
    return lyrics;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { videoId, title, forceSource, duration } = req.query;

    if (!videoId || typeof videoId !== 'string') {
        return res.status(400).json({ error: 'Missing videoId' });
    }

    const targetDuration = duration && !isNaN(Number(duration)) ? Number(duration) : null;

    let lyrics: any[] = [];
    let source: 'lrclib' | 'youtube' | null = null;
    let lyricsType: 'synced' | 'plain' | null = null;

    // 1. Try LRCLIB first if title is provided and we aren't forcing youtube
    if (title && typeof title === 'string' && forceSource !== 'youtube') {
        try {
            // Clean title (e.g. remove "Official MV", "Lyrics", etc.)
            let cleanTitle = title
                .replace(/(\(|\[).*?(official|mv|lyrics|lyric|audio|video|live).*?(\)|\])/gi, '')
                .trim();
            
            // Try to parse Artist and Track
            let artist = '';
            let track = cleanTitle;
            const parsed = getArtistTitle(cleanTitle);
            
            if (parsed) {
                artist = parsed[0];
                track = parsed[1];
            } else if (cleanTitle.includes('-')) {
                const parts = cleanTitle.split('-');
                artist = parts[0].trim();
                track = parts.slice(1).join('-').trim();
            }

            // Function to fetch and process LRCLIB search
            const fetchLrcLib = async (url: string) => {
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data) && data.length > 0) {
                        const syncedItems = data.filter((d: any) => d.syncedLyrics);
                        if (syncedItems.length > 0) {
                            if (targetDuration) {
                                // Find closest duration within 5 seconds
                                let bestItem = null;
                                let minDiff = 5; // Max 5 seconds difference
                                for (const item of syncedItems) {
                                    if (item.duration) {
                                        const diff = Math.abs(item.duration - targetDuration);
                                        if (diff <= minDiff) {
                                            minDiff = diff;
                                            bestItem = item;
                                        }
                                    }
                                }
                                if (bestItem) return { type: 'synced', content: bestItem.syncedLyrics };
                            }
                            return { type: 'synced', content: syncedItems[0].syncedLyrics };
                        }
                        
                        const plainItems = data.filter((d: any) => d.plainLyrics);
                        if (plainItems.length > 0) {
                            if (targetDuration) {
                                let bestItem = null;
                                let minDiff = 5;
                                for (const item of plainItems) {
                                    if (item.duration) {
                                        const diff = Math.abs(item.duration - targetDuration);
                                        if (diff <= minDiff) {
                                            minDiff = diff;
                                            bestItem = item;
                                        }
                                    }
                                }
                                if (bestItem) return { type: 'plain', content: bestItem.plainLyrics };
                            }
                            return { type: 'plain', content: plainItems[0].plainLyrics };
                        }
                    }
                }
                return null;
            };

            let lrclibResult = null;

            // Strategy 1: Search with specific track_name and artist_name (Highly accurate)
            if (artist && track) {
                const searchParams = new URLSearchParams({ track_name: track, artist_name: artist });
                lrclibResult = await fetchLrcLib(`https://lrclib.net/api/search?${searchParams.toString()}`);
                
                // Strategy 1b: Try swapping track and artist (in case title is formatted "Track - Artist")
                if (!lrclibResult) {
                    const searchParamsSwapped = new URLSearchParams({ track_name: artist, artist_name: track });
                    lrclibResult = await fetchLrcLib(`https://lrclib.net/api/search?${searchParamsSwapped.toString()}`);
                }
            }

            // Strategy 2: Fallback to generic search with the whole clean title (robust for mixed formats)
            if (!lrclibResult) {
                const searchParams = new URLSearchParams({ q: cleanTitle });
                lrclibResult = await fetchLrcLib(`https://lrclib.net/api/search?${searchParams.toString()}`);
            }

            // Strategy 3: Fallback to generic search with just the track name
            if (!lrclibResult && track) {
                const searchParams = new URLSearchParams({ q: track });
                lrclibResult = await fetchLrcLib(`https://lrclib.net/api/search?${searchParams.toString()}`);
            }

            if (lrclibResult) {
                if (lrclibResult.type === 'synced') {
                    lyrics = parseLRC(lrclibResult.content);
                    lyricsType = 'synced';
                } else if (lrclibResult.type === 'plain') {
                    lyrics = lrclibResult.content.split('\n').map((line: string) => ({
                        time: -1,
                        text: line.trim()
                    })).filter((l: any) => l.text.length > 0);
                    lyricsType = 'plain';
                }
                source = 'lrclib';
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
                lyricsType = 'synced'; // YouTube is synced
            }
        } catch (error) {
            console.error('YouTube Transcript fetch error:', error);
        }
    }

    if (lyrics.length > 0) {
        res.status(200).json({ lyrics, source, type: lyricsType });
    } else {
        res.status(404).json({ error: 'No lyrics found' });
    }
}
