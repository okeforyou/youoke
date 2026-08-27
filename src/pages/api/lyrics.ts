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

/**
 * Enhanced Thai & Universal title cleaner
 * Strips away MV tags, Thai lyric tags, bracketed suffixes, and promotional text
 */
function cleanThaiTitle(rawTitle: string): string {
    if (!rawTitle) return '';
    let title = rawTitle;

    // 1. Remove bracketed metadata (parentheses, square brackets, curly braces)
    title = title.replace(/\([^)]*?(official|mv|m\/v|lyrics?|audio|video|visualizer|live|clip|teaser|ost|cover|4k|hd|special|version|ver\.|session|เนื้อเพลง|เพลงเต็ม|เพลงใหม่|มิวสิควิดีโอ|แสดงสด)[^)]*?\)/gi, '');
    title = title.replace(/\[[^\]]*?(official|mv|m\/v|lyrics?|audio|video|visualizer|live|clip|teaser|ost|cover|4k|hd|special|version|ver\.|session|เนื้อเพลง|เพลงเต็ม|เพลงใหม่|มิวสิควิดีโอ|แสดงสด)[^\]]*?\]/gi, '');
    title = title.replace(/\{[^}]*?(official|mv|m\/v|lyrics?|audio|video|visualizer|live|clip|teaser|ost|cover|4k|hd|special|version|ver\.|session|เนื้อเพลง|เพลงเต็ม|เพลงใหม่|มิวสิควิดีโอ|แสดงสด)[^}]*?\}/gi, '');

    // 2. Trailing pipe / slash metadata
    title = title.replace(/\|.*$/g, '');
    title = title.replace(/\/\/.*$/g, '');

    // 3. Remove loose tags & cleanup empty brackets
    title = title.replace(/\b(OFFICIAL\s*(MV|VIDEO|AUDIO|LYRIC|VISUALIZER))\b/gi, '');
    title = title.replace(/\[\s*\]|\(\s*\)|\{\s*\}/g, '');
    title = title.replace(/\s+/g, ' ').trim();

    return title;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { videoId, title, forceSource, duration } = req.query;

    if (!videoId || typeof videoId !== 'string') {
        return res.status(400).json({ error: 'Missing videoId' });
    }

    // Set HTTP Cache Headers (1 day shared edge cache, 12 hours stale-while-revalidate)
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=43200');

    const targetDuration = duration && !isNaN(Number(duration)) ? Number(duration) : null;

    let lyrics: any[] = [];
    let source: 'lrclib' | 'youtube' | null = null;
    let lyricsType: 'synced' | 'plain' | null = null;

    // 1. Try LRCLIB first if title is provided and we aren't forcing youtube
    if (title && typeof title === 'string' && forceSource !== 'youtube') {
        try {
            // Clean title with enhanced cleaner
            const cleanTitle = cleanThaiTitle(title);
            
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
                const fetchRes = await fetch(url, {
                    headers: { 'User-Agent': 'YouOke/1.0 (https://play.okeforyou.com)' }
                });
                if (fetchRes.ok) {
                    const data = await fetchRes.json();
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

            // Strategy 2: Fallback to generic search with the clean title
            if (!lrclibResult && cleanTitle) {
                const searchParams = new URLSearchParams({ q: cleanTitle });
                lrclibResult = await fetchLrcLib(`https://lrclib.net/api/search?${searchParams.toString()}`);
            }

            // Strategy 3: Fallback to generic search with just the track name
            if (!lrclibResult && track && track !== cleanTitle) {
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
                source = 'youtube';
                lyricsType = 'synced';
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
