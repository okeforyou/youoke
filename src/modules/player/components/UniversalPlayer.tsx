import React, { useEffect, useRef, useState } from 'react';
import YouTube from 'react-youtube';
import { getActiveBridgeBaseUrl, useAIVocalStore } from '../../../stores/useAIVocalStore';
import { usePlayerStore } from '../stores/usePlayerStore';
import { MidiCanvasRenderer } from './MidiCanvasRenderer';
import { LyricsOverlay } from './LyricsOverlay';
import { useMidiEngine } from '@/context/MidiEngineContext';
import { playerService } from '../services/playerService';
import { YouTubeAdapter } from '../adapters/YouTubeAdapter';
import { useMixerStore } from '../stores/useMixerStore';
import { useShallow } from 'zustand/react/shallow';

interface UniversalPlayerProps {
    onEnded?: () => void;
    onReady?: (target: any) => void;
    onStateChange?: (event: any) => void;
    className?: string;
    showControls?: boolean;
    forceMute?: boolean;
}

export const UniversalPlayer: React.FC<UniversalPlayerProps> = ({
    onEnded,
    onReady,
    onStateChange,
    className,
    showControls = false,
    forceMute = false
}) => {

    const currentVideo = usePlayerStore(state => state.currentVideo);
    const isPlaying = usePlayerStore(state => state.isPlaying);
    const currentSource = usePlayerStore(state => state.currentSource);
    const { setCurrentTime, setDuration } = usePlayerStore();
    const videoRef = useRef<HTMLVideoElement>(null);

    // Use currentSource as videoId for standard React-YouTube management
    // Default sourceType to 'youtube' if not set (backward compat for old Firestore data)
    const activeVideoId = currentSource && !currentSource.startsWith('search:')
        ? currentSource
        : undefined;

    // React to aiStatus becoming ready while playing
    const aiJobStatus = useAIVocalStore(state => activeVideoId ? state.jobs[activeVideoId]?.status : undefined);
    const aiMode = useAIVocalStore(state => activeVideoId ? state.jobs[activeVideoId]?.mode : 'basic') || 'basic';
    const [audioLoadFailed, setAudioLoadFailed] = useState(false);
    const [bridgeBaseUrl, setBridgeBaseUrl] = useState('http://127.0.0.1:5050');
    const [stemUrls, setStemUrls] = useState<{ [stem: string]: string }>({});

    // Reset error when song changes
    useEffect(() => {
        setAudioLoadFailed(false);
    }, [activeVideoId]);

    // Proactively check if the active song is already cached on the Local Bridge as soon as activeVideoId changes
    useEffect(() => {
        if (!activeVideoId) return;

        let isMounted = true;
        const checkLocalCache = async () => {
            const store = useAIVocalStore.getState();
            if (store.jobs[activeVideoId]?.status === 'ready') return;

            try {
                const baseUrl = await getActiveBridgeBaseUrl();
                if (!baseUrl) return;

                const res = await fetch(`${baseUrl}/files/${activeVideoId}/vocals.m4a`, {
                    method: 'HEAD',
                    signal: AbortSignal.timeout(2500),
                });

                if (res.ok && isMounted) {
                    const contentLength = res.headers.get('content-length');
                    if (contentLength && contentLength === '0') return;

                    let actualMode: 'basic' | 'pro' = 'basic';
                    try {
                        const drumsRes = await fetch(`${baseUrl}/files/${activeVideoId}/drums.m4a`, {
                            method: 'HEAD',
                            signal: AbortSignal.timeout(1500),
                        });
                        if (drumsRes.ok) {
                            const drumsLen = drumsRes.headers.get('content-length');
                            if (!drumsLen || drumsLen !== '0') actualMode = 'pro';
                        }
                    } catch {}

                    if (isMounted) {
                        useAIVocalStore.setState((state) => ({
                            jobs: {
                                ...state.jobs,
                                [activeVideoId]: {
                                    status: 'ready',
                                    message: 'พร้อมเล่น!',
                                    progress: 100,
                                    mode: actualMode
                                }
                            }
                        }));
                    }
                }
            } catch (err) {
                // Bridge offline or file not separated
            }
        };

        checkLocalCache();

        return () => {
            isMounted = false;
        };
    }, [activeVideoId]);

    const areStemsReady = Boolean(
        stemUrls.vocals &&
        (aiMode === 'pro' ? (stemUrls.drums && stemUrls.bass && stemUrls.other) : stemUrls.no_vocals)
    );

    const isAiReady = Boolean(
        activeVideoId &&
        aiJobStatus === 'ready' &&
        currentVideo?.aiVocalRequested !== false &&
        !audioLoadFailed
    );

    // AI Audio Mixer Refs
    const vocalRef = useRef<HTMLAudioElement>(null);
    const instrumentalRef = useRef<HTMLAudioElement>(null);
    const drumsRef = useRef<HTMLAudioElement>(null);
    const bassRef = useRef<HTMLAudioElement>(null);
    const otherRef = useRef<HTMLAudioElement>(null);
    const ytPlayerRef = useRef<any>(null);

    const handleAudioError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
        console.error("[UniversalPlayer] Audio error on stem:", e.currentTarget.src, e.currentTarget.error);
        setAudioLoadFailed(true);
        
        // Immediate fallback to YouTube Audio
        if (ytPlayerRef.current && typeof ytPlayerRef.current.unMute === 'function') {
            const { isMuted } = usePlayerStore.getState();
            const { volumes } = useMixerStore.getState();
            if (!isMuted && !forceMute) {
                try {
                    ytPlayerRef.current.unMute();
                    ytPlayerRef.current.setVolume(volumes?.instrumental ?? 100);
                } catch (err) {}
            }
        }
    };

    const { trackStates, volumes, pitchShift, playbackRate } = useMixerStore(
        useShallow(state => ({
            trackStates: state.trackStates,
            volumes: state.volumes,
            pitchShift: state.pitchShift ?? 0,
            playbackRate: state.playbackRate ?? 1.0
        }))
    );
    const masterVolume = usePlayerStore(state => state.volume ?? 100);
    const isMuted = usePlayerStore(state => state.isMuted);

    // Dynamic Pitch & Speed Sync (Web Audio API & HTML5 Media Element)
    useEffect(() => {
        const activeRefs = [vocalRef, instrumentalRef, drumsRef, bassRef, otherRef];
        const pitchRatio = Math.pow(2, pitchShift / 12);
        const effectiveRate = playbackRate * pitchRatio;

        activeRefs.forEach(ref => {
            if (ref.current) {
                try {
                    if (pitchShift !== 0) {
                        (ref.current as any).preservesPitch = false;
                        (ref.current as any).webkitPreservesPitch = false;
                        (ref.current as any).mozPreservesPitch = false;
                    } else {
                        (ref.current as any).preservesPitch = true;
                        (ref.current as any).webkitPreservesPitch = true;
                        (ref.current as any).mozPreservesPitch = true;
                    }
                    ref.current.playbackRate = effectiveRate;
                } catch (e) {}
            }
        });

        // Sync Speed to YouTube Player if active
        if (ytPlayerRef.current && typeof ytPlayerRef.current.setPlaybackRate === 'function') {
            try {
                ytPlayerRef.current.setPlaybackRate(playbackRate);
            } catch (e) {}
        }
    }, [pitchShift, playbackRate]);

    // MIDI Engine Hooks
    const { playMidi, stop: stopMidi, isReady: isMidiReady, isPlaying: isMidiPlaying, synth } = useMidiEngine();

    // MIDI Auto-Play Logic
    useEffect(() => {
        let active = true;

        const loadMidi = async () => {
            if (currentVideo?.sourceType === 'midi' && isMidiReady && !isMidiPlaying && isPlaying) {
                // Determine source URL (filePath for local/scanned, or videoId if mapped?)
                // Assuming filePath contains the accessible URL
                const sourceUrl = currentVideo.filePath;
                if (!sourceUrl) {
                    console.warn("🎹 UniversalPlayer: No filePath for MIDI source");
                    return;
                }

                console.log("🎹 UniversalPlayer: Fetching MIDI...", sourceUrl);
                try {
                    const response = await fetch(sourceUrl);
                    if (!response.ok) throw new Error("Failed to fetch MIDI");
                    const buffer = await response.arrayBuffer();

                    if (active) {
                        await playMidi(buffer);
                    }
                } catch (e) {
                    console.error("🎹 UniversalPlayer: MIDI Fetch Failed", e);
                }
            }
        };

        loadMidi();

        return () => { active = false; };
    }, [currentVideo, isMidiReady, isPlaying]);

    // Handle Stop
    useEffect(() => {
        if (!isPlaying && isMidiPlaying) {
            stopMidi();
        }
    }, [isPlaying, isMidiPlaying]);

    // MIDI End Detection (via Context event or Polling)
    useEffect(() => {
        if (currentVideo?.sourceType === 'midi' && !isMidiPlaying && isPlaying) {
            // Engine stopped but store thinks we are playing -> Song finished?
            console.log("🏁 UniversalPlayer: MIDI Finished by engine");
            if (onEnded) onEnded();
        }
    }, [isMidiPlaying]);

    // MIDI Time Sync to Store
    const { currentTime: midiTime } = useMidiEngine();
    useEffect(() => {
        if (currentVideo?.sourceType === 'midi' && isMidiPlaying) {
            usePlayerStore.getState().setCurrentTime(midiTime);
        }
    }, [midiTime, currentVideo, isMidiPlaying]);

    // Helper to check if any track is soloed
    const isAnySolo = trackStates?.vocals?.solo || trackStates?.instrumental?.solo || trackStates?.drums?.solo || trackStates?.bass?.solo || trackStates?.other?.solo;

    // Resilient Volume Sync (AI Tracks)
    useEffect(() => {
        const syncTrack = (ref: React.RefObject<HTMLAudioElement>, vol: number, muted: boolean, solo: boolean) => {
            if (ref.current) {
                const isAnySolo = trackStates?.vocals?.solo || trackStates?.instrumental?.solo || trackStates?.drums?.solo || trackStates?.bass?.solo || trackStates?.other?.solo;
                const isEffectivelyMuted = muted || (isAnySolo && !solo) || isMuted || forceMute;
                const effectiveVolume = isEffectivelyMuted ? 0 : (vol / 100) * (masterVolume / 100);

                ref.current.volume = effectiveVolume;
                // Prevent browser from suspending playback of muted elements, which breaks synchronization
                ref.current.muted = false; 
            }
        };
        syncTrack(vocalRef, volumes?.vocals ?? 100, trackStates?.vocals?.muted ?? false, trackStates?.vocals?.solo ?? false);
        syncTrack(instrumentalRef, volumes?.instrumental ?? 100, trackStates?.instrumental?.muted ?? false, trackStates?.instrumental?.solo ?? false);
        syncTrack(drumsRef, volumes?.drums ?? 100, trackStates?.drums?.muted ?? false, trackStates?.drums?.solo ?? false);
        syncTrack(bassRef, volumes?.bass ?? 100, trackStates?.bass?.muted ?? false, trackStates?.bass?.solo ?? false);
        syncTrack(otherRef, volumes?.other ?? 100, trackStates?.other?.muted ?? false, trackStates?.other?.solo ?? false);
    }, [volumes, trackStates, isMuted, masterVolume, forceMute, isAnySolo]);

    // Resilient Volume Sync (YouTube Track)
    useEffect(() => {
        if (!ytPlayerRef.current || typeof ytPlayerRef.current.getIframe !== 'function') return;
        try {
            if (!ytPlayerRef.current.getIframe()) return;
            
            const isInstMuted = trackStates?.instrumental?.muted ?? false;
            // If AI is ready, YouTube must be MUTED so we only hear AI tracks
            // If Master is muted, YouTube must be MUTED
            // If Instrumental is muted on non-AI track, YouTube must be MUTED
            // If forceMute is true (e.g. Casting), YouTube must be MUTED
            const shouldBeMuted = isMuted || isAiReady || isInstMuted || forceMute;
            
            if (shouldBeMuted) {
                ytPlayerRef.current.mute();
            } else {
                ytPlayerRef.current.unMute();
                // Sync YouTube volume with Mixer's instrumental volume & master volume
                const effectiveYtVol = Math.round(volumes.instrumental * (masterVolume / 100));
                ytPlayerRef.current.setVolume(effectiveYtVol);
            }
        } catch (e) {}
    }, [isMuted, isAiReady, trackStates?.instrumental?.muted, volumes.instrumental, masterVolume, forceMute]);

    // Handle Play/Pause commands to YouTube & Audio Elements
    useEffect(() => {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
            try {
                if (isPlaying) ytPlayerRef.current.playVideo();
                else ytPlayerRef.current.pauseVideo();
            } catch (e) {}
        }

        // Only handle pausing here. 
        // Playback & time syncing is managed by the requestAnimationFrame loop (Continuous Sync Loop)
        if (isAiReady && areStemsReady && !isPlaying) {
            vocalRef.current?.pause();
            instrumentalRef.current?.pause();
            drumsRef.current?.pause();
            bassRef.current?.pause();
            otherRef.current?.pause();
        }
    }, [isPlaying, isAiReady, areStemsReady]);

    // Continuous Zero-Stutter Multi-Stem Audio Sync Loop
    // Stems naturally run at the exact same DAC hardware clock rate.
    // Instead of destructive currentTime re-seeking (which flushes the audio decode buffer and causes stutter),
    // we use imperceptible playbackRate micro-adjustments (+-1%) to maintain phase lock,
    // and only hard-seek when a substantial user seek occurs (> 1.5s).
    useEffect(() => {
        let animationFrameId: number;
        
        const syncLoop = () => {
            if (isPlaying && isAiReady && areStemsReady) {
                try {
                    const ytPlayer = ytPlayerRef.current;
                    if (ytPlayer && typeof ytPlayer.getPlayerState === 'function') {
                        const state = ytPlayer.getPlayerState();
                        
                        const activeRefs = aiMode === 'pro' 
                            ? [vocalRef, drumsRef, bassRef, otherRef] 
                            : [vocalRef, instrumentalRef];
                        const activeAudios = activeRefs.map(r => r.current).filter(Boolean) as HTMLAudioElement[];

                        // If YouTube is buffering (3), paused (2), cued (5), or ended (0), pause all AI tracks
                        if (state !== 1) {
                            for (const audio of activeAudios) {
                                if (!audio.paused) {
                                    audio.pause();
                                }
                                if (audio.playbackRate !== 1.0) audio.playbackRate = 1.0;
                            }
                        } else if (activeAudios.length > 0) {
                            const masterAudio = activeAudios[0];
                            const youtubeTime = ytPlayer.getCurrentTime();

                            // 1. If master audio is paused while YouTube is playing, start playback and align once
                            if (masterAudio.paused) {
                                if (typeof youtubeTime === 'number' && youtubeTime >= 0 && Math.abs(masterAudio.currentTime - youtubeTime) > 0.5) {
                                    masterAudio.currentTime = youtubeTime;
                                }
                                masterAudio.play().catch(() => {});
                            } else if (typeof youtubeTime === 'number' && youtubeTime >= 0) {
                                // 2. Hard seek only on large user scrub (> 1.5s)
                                const ytDrift = Math.abs(masterAudio.currentTime - youtubeTime);
                                if (ytDrift > 1.5) {
                                    masterAudio.currentTime = youtubeTime;
                                }
                            }

                            const masterTime = masterAudio.currentTime;

                            // 3. Stems Synchronization via seamless playbackRate nudging (Zero Buffer Flush)
                            for (let i = 1; i < activeAudios.length; i++) {
                                const slave = activeAudios[i];
                                if (masterAudio.paused) {
                                    if (!slave.paused) slave.pause();
                                    if (slave.playbackRate !== 1.0) slave.playbackRate = 1.0;
                                } else {
                                    if (slave.paused) {
                                        if (Math.abs(slave.currentTime - masterTime) > 0.1) {
                                            slave.currentTime = masterTime;
                                        }
                                        slave.play().catch(() => {});
                                    } else {
                                        const diff = masterTime - slave.currentTime;
                                        const absDiff = Math.abs(diff);

                                        if (absDiff > 1.5) {
                                            // Major drift (e.g. initial start desync / hard scrub): snap once
                                            slave.currentTime = masterTime;
                                            slave.playbackRate = 1.0;
                                        } else if (diff > 0.04) {
                                            // Slave is lagging behind slightly (> 40ms): nudge +1% speed
                                            if (slave.playbackRate !== 1.01) slave.playbackRate = 1.01;
                                        } else if (diff < -0.04) {
                                            // Slave is slightly ahead (> 40ms): nudge -1% speed
                                            if (slave.playbackRate !== 0.99) slave.playbackRate = 0.99;
                                        } else if (slave.playbackRate !== 1.0) {
                                            // Back in tight sync (< 40ms): restore normal 1.0x rate
                                            slave.playbackRate = 1.0;
                                        }
                                    }
                                }
                            }
                        }
                    }
                } catch (e) {}
                
                animationFrameId = requestAnimationFrame(syncLoop);
            }
        };

        if (isPlaying && isAiReady && areStemsReady) {
            animationFrameId = requestAnimationFrame(syncLoop);
        }

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [isPlaying, isAiReady, areStemsReady, aiMode]);

    useEffect(() => {
        if (currentVideo?.sourceType === 'vcd' && videoRef.current) {
            if (isPlaying) {
                videoRef.current.play().catch(e => console.warn("VCD Play failed:", e));
            } else {
                videoRef.current.pause();
            }
        }
    }, [isPlaying, currentVideo?.sourceType]);

    // Fetch and create Blob URLs to bypass Chrome HTTPS mixed-content restrictions on Vercel
    useEffect(() => {
        let isMounted = true;
        let createdBlobUrls: string[] = [];
        const abortController = new AbortController();

        // Synchronously reset previous stems when video/mode changes
        setStemUrls({});
        setAudioLoadFailed(false);

        const loadStems = async () => {
            if (!isAiReady || !activeVideoId) {
                return;
            }

            const baseUrl = await getActiveBridgeBaseUrl();
            if (!baseUrl) {
                console.warn("[UniversalPlayer] AI Bridge not reachable, falling back to YouTube audio");
                if (isMounted) setAudioLoadFailed(true);
                return;
            }
            if (isMounted) setBridgeBaseUrl(baseUrl);

            const stems = aiMode === 'pro'
                ? ['vocals', 'drums', 'bass', 'other']
                : ['vocals', 'no_vocals'];

            const newStemUrls: { [stem: string]: string } = {};

            try {
                await Promise.all(stems.map(async (stem) => {
                    const directUrl = `${baseUrl}/files/${activeVideoId}/${stem}.m4a`;
                    try {
                        const res = await fetch(directUrl, { signal: abortController.signal });
                        if (res.ok) {
                            const blob = await res.blob();
                            const blobUrl = URL.createObjectURL(blob);
                            createdBlobUrls.push(blobUrl);
                            newStemUrls[stem] = blobUrl;
                        } else {
                            console.warn(`[UniversalPlayer] Failed to load blob for stem ${stem}:`, res.statusText);
                        }
                    } catch (err: any) {
                        if (err.name !== 'AbortError') {
                            console.warn(`[UniversalPlayer] Failed to load blob for stem ${stem}:`, err);
                        }
                    }
                }));

                if (isMounted && !abortController.signal.aborted) {
                    // Check if all needed stems were successfully fetched as blobs
                    const allStemsLoaded = stems.every(stem => Boolean(newStemUrls[stem]));
                    if (allStemsLoaded) {
                        setStemUrls(newStemUrls);
                    } else {
                        console.warn("[UniversalPlayer] Incomplete stems loaded, falling back to YouTube");
                        setAudioLoadFailed(true);
                    }
                }
            } catch (err: any) {
                if (err.name !== 'AbortError') {
                    console.error("[UniversalPlayer] Stem loading failed:", err);
                    if (isMounted) setAudioLoadFailed(true);
                }
            }
        };

        loadStems();

        return () => {
            isMounted = false;
            abortController.abort();
            createdBlobUrls.forEach(url => {
                try { URL.revokeObjectURL(url); } catch (e) {}
            });
        };
    }, [isAiReady, activeVideoId, aiMode]);

    // --- RENDERERS ---

    // 1. MIDI
    if (currentVideo?.sourceType === 'midi') {
        return (
            <div className={`relative w-full h-full bg-black ${className}`}>
                <MidiCanvasRenderer />
            </div>
        );
    }

    // 2. VCD (HTML5 Video)
    if (currentVideo?.sourceType === 'vcd' && currentVideo.filePath) {
        return (
            <div className={`relative w-full h-full bg-black ${className}`}>
                <div className="absolute inset-0 bg-black flex items-center justify-center">
                    <video
                        ref={videoRef}
                        className="w-full h-full object-contain"
                        src={currentVideo.filePath}
                        autoPlay={isPlaying}
                        controls={showControls}
                        onEnded={onEnded}
                        onTimeUpdate={(e) => {
                            const video = e.currentTarget;
                            setCurrentTime(video.currentTime);
                            setDuration(video.duration);
                        }}
                    />
                </div>
            </div>
        );
    }

    // 3. YouTube (Default)
    const opts = {
        height: '100%',
        width: '100%',
        playerVars: {
            autoplay: isPlaying ? 1 : 0 as 0 | 1,
            controls: showControls ? 1 : 0 as 0 | 1,
            modestbranding: 1 as const,
            rel: 0 as 0,
            showinfo: 0 as 0,
            iv_load_policy: 3 as 3,
            cc_load_policy: 0 as 0 | 1,
            origin: typeof window !== 'undefined' ? window.location.origin : undefined,
            enablejsapi: 1 as 0 | 1,
        },
    };

    const handleYouTubeReady = (event: any) => {
        ytPlayerRef.current = event.target;

        // Force disable native YouTube CC
        try {
            if (typeof event.target.unloadModule === 'function') {
                event.target.unloadModule("captions");
                event.target.unloadModule("cc");
            }
        } catch (e) {
            console.warn("Could not unload captions module:", e);
        }

        if (isAiReady && areStemsReady) {
            try { if (event.target.getIframe()) event.target.mute(); } catch (e) {}
        } else {
            try {
                if (event.target.getIframe() && !isMuted && !forceMute) {
                    event.target.unMute();
                    event.target.setVolume(volumes?.instrumental ?? 100);
                }
            } catch (e) {}
        }

        // Register adapter if needed
        const adapter = playerService.getAdapter();
        if (adapter instanceof YouTubeAdapter) {
            adapter.setPlayer(event.target);
        }
        if (onReady) onReady(event.target);
    };

    const handleYouTubeStateChange = (event: any) => {
        // Force disable native CC when video plays
        if (event.data === 1) { // PLAYING
            try {
                if (typeof event.target.unloadModule === 'function') {
                    event.target.unloadModule("captions");
                    event.target.unloadModule("cc");
                }
                if (typeof event.target.setOption === 'function') {
                    event.target.setOption("captions", "track", {"languageCode": ""}); // Force turn off
                    event.target.setOption("cc", "track", {"languageCode": ""});
                }
            } catch (e) {}
        }

        if (isAiReady && areStemsReady && event.data === 1) {
            try { if (event.target.getIframe()) event.target.mute(); } catch (e) {}
        } else if ((!isAiReady || !areStemsReady) && event.data === 1) {
            try {
                if (event.target.getIframe() && !isMuted && !forceMute) {
                    event.target.unMute();
                    event.target.setVolume(volumes?.instrumental ?? 100);
                }
            } catch (e) {}
        }

        // Handle state changes if needed
        if (onStateChange) onStateChange(event);
    };

    return (
        <div className={`relative w-full h-full ${className} youtube-player-wrapper`}>
            {/* AI Audio Elements - ONLY MOUNT WHEN BLOBS ARE FULLY READY */}
            {isAiReady && areStemsReady && activeVideoId && (
                <div className="hidden" key={`${activeVideoId}-${aiMode}`}>
                    <audio 
                        onError={handleAudioError} 
                        ref={vocalRef} 
                        crossOrigin="anonymous"
                        src={stemUrls.vocals} 
                        preload="auto" 
                        onLoadedData={(e) => { 
                            e.currentTarget.volume = (volumes?.vocals ?? 100) / 100;
                            const ytTime = ytPlayerRef.current?.getCurrentTime?.();
                            if (typeof ytTime === 'number' && ytTime > 0) {
                                e.currentTarget.currentTime = ytTime;
                            }
                        }} 
                    />
                    {aiMode === 'pro' ? (
                        <>
                            <audio 
                                onError={handleAudioError} 
                                ref={drumsRef} 
                                crossOrigin="anonymous" 
                                src={stemUrls.drums} 
                                preload="auto" 
                                onLoadedData={(e) => { 
                                    e.currentTarget.volume = (volumes?.drums ?? 100) / 100;
                                    const ytTime = ytPlayerRef.current?.getCurrentTime?.();
                                    if (typeof ytTime === 'number' && ytTime > 0) {
                                        e.currentTarget.currentTime = ytTime;
                                    }
                                }} 
                            />
                            <audio 
                                onError={handleAudioError} 
                                ref={bassRef} 
                                crossOrigin="anonymous" 
                                src={stemUrls.bass} 
                                preload="auto" 
                                onLoadedData={(e) => { 
                                    e.currentTarget.volume = (volumes?.bass ?? 100) / 100;
                                    const ytTime = ytPlayerRef.current?.getCurrentTime?.();
                                    if (typeof ytTime === 'number' && ytTime > 0) {
                                        e.currentTarget.currentTime = ytTime;
                                    }
                                }} 
                            />
                            <audio 
                                onError={handleAudioError} 
                                ref={otherRef} 
                                crossOrigin="anonymous" 
                                src={stemUrls.other} 
                                preload="auto" 
                                onLoadedData={(e) => { 
                                    e.currentTarget.volume = (volumes?.other ?? 100) / 100;
                                    const ytTime = ytPlayerRef.current?.getCurrentTime?.();
                                    if (typeof ytTime === 'number' && ytTime > 0) {
                                        e.currentTarget.currentTime = ytTime;
                                    }
                                }} 
                            />
                        </>
                    ) : (
                        <audio 
                            onError={handleAudioError} 
                            ref={instrumentalRef} 
                            crossOrigin="anonymous"
                            src={stemUrls.no_vocals} 
                            preload="auto" 
                            onLoadedData={(e) => { 
                                e.currentTarget.volume = (volumes?.instrumental ?? 100) / 100;
                                const ytTime = ytPlayerRef.current?.getCurrentTime?.();
                                if (typeof ytTime === 'number' && ytTime > 0) {
                                    e.currentTarget.currentTime = ytTime;
                                }
                            }} 
                        />
                    )}
                </div>
            )}
            {activeVideoId ? (
                <>
                    <YouTube
                        videoId={activeVideoId}
                        opts={opts as any}
                        className="w-full h-full"
                        iframeClassName="w-full h-full pointer-events-none"
                        onReady={handleYouTubeReady}
                        onStateChange={handleYouTubeStateChange}
                        onEnd={onEnded}
                    />
                    <LyricsOverlay 
                        playerRef={ytPlayerRef} 
                    />
                </>
            ) : (
                <div className="w-full h-full bg-black flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4 opacity-20">
                        <div className="w-12 h-12 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        <p className="text-xs font-black uppercase tracking-widest text-white">รอรับข้อมูลเพลง...</p>
                    </div>
                </div>
            )}
        </div>
    );
};
