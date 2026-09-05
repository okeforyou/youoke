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

    const { trackStates, volumes } = useMixerStore(
        useShallow(state => ({
            trackStates: state.trackStates,
            volumes: state.volumes
        }))
    );
    const isMuted = usePlayerStore(state => state.isMuted);

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
    // The Context should ideally call a callback or we listen to changes
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
                const effectiveVolume = isEffectivelyMuted ? 0 : vol / 100;

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
    }, [volumes, trackStates, isMuted, forceMute, isAnySolo]);

    // Resilient Volume Sync (YouTube Track)
    useEffect(() => {
        if (!ytPlayerRef.current || typeof ytPlayerRef.current.getIframe !== 'function') return;
        try {
            if (!ytPlayerRef.current.getIframe()) return;
            
            // If AI is ready, YouTube must be MUTED so we only hear AI tracks
            // If Master is muted, YouTube must be MUTED
            // If forceMute is true (e.g. Casting), YouTube must be MUTED
            const shouldBeMuted = isMuted || isAiReady || forceMute;
            
            if (shouldBeMuted) {
                ytPlayerRef.current.mute();
            } else {
                ytPlayerRef.current.unMute();
                // Sync YouTube volume with Mixer's instrumental volume (for normal videos)
                ytPlayerRef.current.setVolume(volumes.instrumental);
            }
        } catch (e) {}
    }, [isMuted, isAiReady, volumes.instrumental, forceMute]);

    // Handle Play/Pause commands to YouTube
    useEffect(() => {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
            try {
                if (isPlaying) ytPlayerRef.current.playVideo();
                else ytPlayerRef.current.pauseVideo();
            } catch (e) {}
        }

        // Only handle pausing here. 
        // Playback & time syncing is managed by the requestAnimationFrame loop (Continuous Sync Loop)
        if (isAiReady && !isPlaying) {
            vocalRef.current?.pause();
            instrumentalRef.current?.pause();
            drumsRef.current?.pause();
            bassRef.current?.pause();
            otherRef.current?.pause();
        }
    }, [isPlaying, isAiReady]);

    // Continuous Sync Loop for AI Audio to guarantee zero phasing/drift
    useEffect(() => {
        let animationFrameId: number;
        
        const syncLoop = () => {
            if (isPlaying && isAiReady) {
                try {
                    const ytPlayer = ytPlayerRef.current;
                    if (ytPlayer && typeof ytPlayer.getPlayerState === 'function') {
                        const state = ytPlayer.getPlayerState();
                        
                        const activeRefs = aiMode === 'pro' 
                            ? [vocalRef, drumsRef, bassRef, otherRef] 
                            : [vocalRef, instrumentalRef];
                        const activeAudios = activeRefs.map(r => r.current).filter(Boolean) as HTMLAudioElement[];

                        // 1 = PLAYING. If YouTube is buffering (3) or paused (2), pause AI tracks to prevent desync
                        if (state !== 1) {
                            for (const audio of activeAudios) {
                                if (!audio.paused) {
                                    audio.pause();
                                }
                            }
                        } else {
                            const youtubeTime = ytPlayer.getCurrentTime();
                            if (typeof youtubeTime === 'number' && youtubeTime >= 0) {
                                for (const audio of activeAudios) {
                                    if (Math.abs(audio.currentTime - youtubeTime) > 0.10) {
                                        audio.currentTime = youtubeTime;
                                    }
                                    if (audio.paused) {
                                        audio.play().catch(() => {});
                                    }
                                }
                            }
                        }
                    }
                } catch (e) {}
                
                animationFrameId = requestAnimationFrame(syncLoop);
            }
        };

        if (isPlaying && isAiReady) {
            animationFrameId = requestAnimationFrame(syncLoop);
        }

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [isPlaying, isAiReady, aiMode]);

    useEffect(() => {
        if (currentVideo?.sourceType === 'vcd' && videoRef.current) {
            if (isPlaying) {
                videoRef.current.play().catch(e => console.warn("VCD Play failed:", e));
            } else {
                videoRef.current.pause();
            }
        }
    }, [isPlaying, currentVideo?.sourceType]);

    // Resilient YouTube audio mute/unmute control
    useEffect(() => {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.getIframe === 'function' && ytPlayerRef.current.getIframe()) {
            try {
                if (isAiReady) {
                    ytPlayerRef.current.mute();
                } else if (!isMuted && !forceMute) {
                    ytPlayerRef.current.unMute();
                    ytPlayerRef.current.setVolume(volumes?.instrumental ?? 100);
                }
            } catch (e) {}
        }
    }, [isAiReady, isMuted, forceMute, volumes?.instrumental]);

    // Fetch and create Blob URLs to bypass Chrome HTTPS mixed-content restrictions on Vercel
    useEffect(() => {
        let isMounted = true;
        let createdBlobUrls: string[] = [];

        const loadStems = async () => {
            if (!isAiReady || !activeVideoId) {
                if (isMounted) setStemUrls({});
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
                        const res = await fetch(directUrl);
                        if (res.ok) {
                            const blob = await res.blob();
                            const blobUrl = URL.createObjectURL(blob);
                            createdBlobUrls.push(blobUrl);
                            newStemUrls[stem] = blobUrl;
                        } else {
                            newStemUrls[stem] = directUrl;
                        }
                    } catch (err) {
                        newStemUrls[stem] = directUrl;
                    }
                }));

                if (isMounted) {
                    setStemUrls(newStemUrls);
                }
            } catch (err) {
                console.error("[UniversalPlayer] Stem loading failed:", err);
                if (isMounted) setAudioLoadFailed(true);
            }
        };

        loadStems();

        return () => {
            isMounted = false;
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
                {/* Hidden MIDI Controller if needed */}
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

        if (isAiReady) {
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

        if (isAiReady && (event.data === 1 || event.data === 3 || event.data === 2)) {
            // Only ensure YouTube is muted when AI is actively ready.
            try { if (event.target.getIframe()) event.target.mute(); } catch (e) {}
        } else if (!isAiReady && event.data === 1) {
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
            {/* AI Audio Elements */}
            {isAiReady && activeVideoId && (
                <div className="hidden" key={`${activeVideoId}-${aiMode}`}>
                    <audio 
                        onError={handleAudioError} 
                        ref={vocalRef} 
                        crossOrigin="anonymous"
                        src={stemUrls.vocals || `${bridgeBaseUrl}/files/${activeVideoId}/vocals.m4a`} 
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
                                src={stemUrls.drums || `${bridgeBaseUrl}/files/${activeVideoId}/drums.m4a`} 
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
                                src={stemUrls.bass || `${bridgeBaseUrl}/files/${activeVideoId}/bass.m4a`} 
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
                                src={stemUrls.other || `${bridgeBaseUrl}/files/${activeVideoId}/other.m4a`} 
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
                            src={stemUrls.no_vocals || `${bridgeBaseUrl}/files/${activeVideoId}/no_vocals.m4a`} 
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
