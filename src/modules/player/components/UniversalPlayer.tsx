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
    const isAiReady = Boolean(activeVideoId && aiJobStatus === 'ready');

    // AI Audio Mixer Refs
    const vocalRef = useRef<HTMLAudioElement>(null);
    const instrumentalRef = useRef<HTMLAudioElement>(null);
    const drumsRef = useRef<HTMLAudioElement>(null);
    const bassRef = useRef<HTMLAudioElement>(null);
    const otherRef = useRef<HTMLAudioElement>(null);
    const ytPlayerRef = useRef<any>(null);
    const handleAudioError = (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
        if (!isAiReady) return;
        console.error("Audio error:", e.currentTarget.src, e.currentTarget.error);
        
        // Fallback to YouTube Audio
        if (ytPlayerRef.current && typeof ytPlayerRef.current.unMute === 'function') {
            const { isMuted } = useMixerStore.getState();
            if (!isMuted) {
                ytPlayerRef.current.unMute();
                ytPlayerRef.current.setVolume(100);
            }
        }
    };

    const [bridgeBaseUrl, setBridgeBaseUrl] = useState('http://127.0.0.1:5050');

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

    // Continuous Sync Loop for AI Audio to prevent drift
    useEffect(() => {
        let animationFrameId: number;
        
        const syncLoop = () => {
            if (isPlaying && isAiReady) {
                try {
                    const ytPlayer = ytPlayerRef.current;
                    if (ytPlayer && typeof ytPlayer.getPlayerState === 'function') {
                        const state = ytPlayer.getPlayerState();
                        // 1 = PLAYING. If YouTube is buffering (3) or paused (2), pause AI tracks to prevent desync
                        if (state !== 1) {
                            vocalRef.current?.pause();
                            instrumentalRef.current?.pause();
                            drumsRef.current?.pause();
                            bassRef.current?.pause();
                            otherRef.current?.pause();
                        } else {
                            const youtube_time = ytPlayer.getCurrentTime();
                            if (typeof youtube_time === 'number' && youtube_time > 0) {
                                const enforceSync = (ref: React.RefObject<HTMLAudioElement>) => {
                                    if (!ref.current) return;
                                    const audio_time = ref.current.currentTime;
                                    const time_offset = Math.abs(youtube_time - audio_time);
                                    
                                    // หากเวลาต่างกันเกิน 0.3 วินาที (300ms) ให้บังคับ Seek
                                    if (time_offset > 0.3) {
                                        console.log(`⏱️ Auto-Sync triggered: YT=${youtube_time.toFixed(2)}s, Audio=${audio_time.toFixed(2)}s, Offset=${time_offset.toFixed(2)}s`);
                                        ref.current.currentTime = youtube_time;
                                    }
                                    
                                    if (ref.current.paused) {
                                        ref.current.play().catch(()=>{});
                                    }
                                };

                                enforceSync(vocalRef);
                                if (aiMode === 'pro') {
                                    enforceSync(drumsRef);
                                    enforceSync(bassRef);
                                    enforceSync(otherRef);
                                } else {
                                    enforceSync(instrumentalRef);
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

    useEffect(() => {
        if (isAiReady && ytPlayerRef.current) {
            try {
                if (typeof ytPlayerRef.current.getIframe === 'function' && ytPlayerRef.current.getIframe()) {
                    ytPlayerRef.current.mute();
                }
            } catch (e) {}
        }
    }, [isAiReady]);

    useEffect(() => {
        let isMounted = true;

        const syncBridgeUrl = async () => {
            const activeBaseUrl = await getActiveBridgeBaseUrl();
            if (isMounted && activeBaseUrl) {
                setBridgeBaseUrl(activeBaseUrl);
            }
        };

        if (isAiReady) {
            syncBridgeUrl();
        }

        return () => {
            isMounted = false;
        };
    }, [isAiReady, activeVideoId]);

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

        const aiVocal = useAIVocalStore.getState();
        const jobId = currentVideo?.videoId || currentVideo?.id;
        if (jobId && aiVocal.jobs[jobId]?.status === 'ready') {
            try { if (event.target.getIframe()) event.target.mute(); } catch (e) {}
        }

        // Register adapter if needed
        const adapter = playerService.getAdapter();
        if (adapter instanceof YouTubeAdapter) {
            adapter.setPlayer(event.target);
        }
        if (onReady) onReady(event.target);
    };

    const handleYouTubeStateChange = (event: any) => {
        const aiVocal = useAIVocalStore.getState();
        const jobId = currentVideo?.videoId || currentVideo?.id;
        const isReady = jobId && aiVocal.jobs[jobId]?.status === 'ready';

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

        if (isReady && (event.data === 1 || event.data === 3 || event.data === 2)) {
            // Only ensure YouTube is muted. 
            // Audio play/pause and time sync is fully handled by the requestAnimationFrame loop.
            try { if (event.target.getIframe()) event.target.mute(); } catch (e) {}
        }

        // Handle state changes if needed
        if (onStateChange) onStateChange(event);
    };

    return (
        <div className={`relative w-full h-full ${className} youtube-player-wrapper`}>
            {/* AI Audio Elements */}
            {isAiReady && activeVideoId && (
                <div className="hidden" key={`${activeVideoId}-${aiMode}`}>
                    <audio onError={handleAudioError} 
                        ref={vocalRef} 
                        src={`${bridgeBaseUrl}/files/${activeVideoId}/vocals.m4a`} 
                        preload="auto" 
                        onLoadedData={(e) => { e.currentTarget.volume = (volumes?.vocals ?? 100) / 100; if (isPlaying) e.currentTarget.play().catch(()=>{}); }} 
                    />
                    {aiMode === 'pro' ? (
                        <>
                            <audio onError={handleAudioError} ref={drumsRef} src={`${bridgeBaseUrl}/files/${activeVideoId}/drums.m4a`} preload="auto" onLoadedData={(e) => { e.currentTarget.volume = (volumes?.drums ?? 100) / 100; if (isPlaying) e.currentTarget.play().catch(()=>{}); }} />
                            <audio onError={handleAudioError} ref={bassRef} src={`${bridgeBaseUrl}/files/${activeVideoId}/bass.m4a`} preload="auto" onLoadedData={(e) => { e.currentTarget.volume = (volumes?.bass ?? 100) / 100; if (isPlaying) e.currentTarget.play().catch(()=>{}); }} />
                            <audio onError={handleAudioError} ref={otherRef} src={`${bridgeBaseUrl}/files/${activeVideoId}/other.m4a`} preload="auto" onLoadedData={(e) => { e.currentTarget.volume = (volumes?.other ?? 100) / 100; if (isPlaying) e.currentTarget.play().catch(()=>{}); }} />
                        </>
                    ) : (
                        <audio onError={handleAudioError} 
                            ref={instrumentalRef} 
                            src={`${bridgeBaseUrl}/files/${activeVideoId}/no_vocals.m4a`} 
                            preload="auto" 
                            onLoadedData={(e) => { e.currentTarget.volume = (volumes?.instrumental ?? 100) / 100; if (isPlaying) e.currentTarget.play().catch(()=>{}); }} 
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
