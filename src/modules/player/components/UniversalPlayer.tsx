import React, { useEffect, useRef } from 'react';
import YouTube from 'react-youtube';
import { useAIVocalStore } from '../../../stores/useAIVocalStore';
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
    const isAiReady = currentVideo?.aiVocalRequested && activeVideoId && aiJobStatus === 'ready';

    // AI Audio Mixer Refs
    const vocalRef = useRef<HTMLAudioElement>(null);
    const instrumentalRef = useRef<HTMLAudioElement>(null);
    const drumsRef = useRef<HTMLAudioElement>(null);
    const bassRef = useRef<HTMLAudioElement>(null);
    const otherRef = useRef<HTMLAudioElement>(null);
    const ytPlayerRef = useRef<any>(null);

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
    const isAnySolo = trackStates.vocals.solo || trackStates.instrumental.solo || trackStates.drums.solo || trackStates.bass.solo || trackStates.other.solo;

    // Resilient Volume Sync (AI Tracks)
    useEffect(() => {
        const syncTrack = (ref: React.RefObject<HTMLAudioElement>, vol: number, muted: boolean, solo: boolean) => {
            if (ref.current) {
                ref.current.volume = vol / 100;
                ref.current.muted = muted || (isAnySolo && !solo) || isMuted || forceMute;
            }
        };
        syncTrack(vocalRef, volumes.vocals, trackStates.vocals.muted, trackStates.vocals.solo);
        syncTrack(instrumentalRef, volumes.instrumental, trackStates.instrumental.muted, trackStates.instrumental.solo);
        syncTrack(drumsRef, volumes.drums, trackStates.drums.muted, trackStates.drums.solo);
        syncTrack(bassRef, volumes.bass, trackStates.bass.muted, trackStates.bass.solo);
        syncTrack(otherRef, volumes.other, trackStates.other.muted, trackStates.other.solo);
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

    // Ultimate Sync Loop (Slaved to YT)
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isAiReady && isPlaying) {
            interval = setInterval(() => {
                if (!ytPlayerRef.current || typeof ytPlayerRef.current.getIframe !== 'function' || !ytPlayerRef.current.getIframe()) return;
                
                try {
                    const state = ytPlayerRef.current.getPlayerState();
                    if (state !== 1) return; // Only sync if playing
                    
                    const ytTime = ytPlayerRef.current.getCurrentTime();
                    if (typeof ytTime !== 'number' || ytTime === 0) return;
                    
                    const syncRef = (ref: React.RefObject<HTMLAudioElement>) => {
                        if (!ref.current) return;
                        if (Math.abs(ref.current.currentTime - ytTime) > 0.3) {
                            ref.current.currentTime = ytTime;
                        }
                        if (ref.current.paused) ref.current.play().catch(e => console.error(e));
                    };

                    syncRef(vocalRef);
                    if (aiMode === 'pro') {
                        syncRef(drumsRef);
                        syncRef(bassRef);
                        syncRef(otherRef);
                    } else {
                        syncRef(instrumentalRef);
                    }
                } catch (e) {
                    console.warn("YT Sync error:", e);
                }
            }, 1000);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [isPlaying, isAiReady, aiMode]);

    // Handle Play/Pause
    useEffect(() => {
        // Always sync YouTube play state regardless of AI
        if (ytPlayerRef.current && typeof ytPlayerRef.current.playVideo === 'function') {
            try {
                if (isPlaying) ytPlayerRef.current.playVideo();
                else ytPlayerRef.current.pauseVideo();
            } catch (e) {}
        }

        if (isAiReady) {
            if (isPlaying) {
                let ytTime: number | undefined;
                try {
                    if (ytPlayerRef.current && typeof ytPlayerRef.current.getIframe === 'function' && ytPlayerRef.current.getIframe()) {
                        ytTime = ytPlayerRef.current.getCurrentTime();
                    }
                } catch (e) {}

                const syncRefPlay = (ref: React.RefObject<HTMLAudioElement>) => {
                    if (!ref.current) return;
                    if (typeof ytTime === 'number' && ytTime > 0) {
                        if (Math.abs(ref.current.currentTime - ytTime) > 0.3) ref.current.currentTime = ytTime;
                    }
                    ref.current.play().catch(e => {
                        ref.current?.load();
                        ref.current?.play().catch(()=>{});
                    });
                };
                
                syncRefPlay(vocalRef);
                if (aiMode === 'pro') {
                    syncRefPlay(drumsRef);
                    syncRefPlay(bassRef);
                    syncRefPlay(otherRef);
                } else {
                    syncRefPlay(instrumentalRef);
                }
            } else {
                vocalRef.current?.pause();
                instrumentalRef.current?.pause();
                drumsRef.current?.pause();
                bassRef.current?.pause();
                otherRef.current?.pause();
            }
        }
    }, [isPlaying, isAiReady, aiMode]);

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
    useEffect(() => {
        if (currentVideo?.sourceType === 'vcd' && videoRef.current) {
            if (isPlaying) {
                videoRef.current.play().catch(e => console.warn("VCD Play failed:", e));
            } else {
                videoRef.current.pause();
            }
        }
    }, [isPlaying, currentVideo?.sourceType]);

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
        if (currentVideo?.aiVocalRequested && jobId && aiVocal.jobs[jobId]?.status === 'ready') {
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
        if (currentVideo?.aiVocalRequested && jobId && aiVocal.jobs[jobId]?.status === 'ready' && (event.data === 1 || event.data === 3)) {
            try { if (event.target.getIframe()) event.target.mute(); } catch (e) {}
        }
        // Handle state changes if needed
        if (onStateChange) onStateChange(event);
    };

    useEffect(() => {
        if (isAiReady && ytPlayerRef.current) {
            try {
                if (typeof ytPlayerRef.current.getIframe === 'function' && ytPlayerRef.current.getIframe()) {
                    ytPlayerRef.current.mute();
                }
            } catch (e) {}
        }
    }, [isAiReady]);

    return (
        <div className={`relative w-full h-full ${className} youtube-player-wrapper`}>
            {/* AI Audio Elements */}
            {isAiReady && activeVideoId && (
                <div className="hidden">
                    <audio 
                        ref={vocalRef} 
                        src={`http://127.0.0.1:5050/files/${activeVideoId}/vocals.m4a`} 
                        preload="auto" 
                        onLoadedData={(e) => { e.currentTarget.volume = volumes.vocals / 100; if (isPlaying) e.currentTarget.play().catch(()=>{}); }} 
                    />
                    {aiMode === 'pro' ? (
                        <>
                            <audio ref={drumsRef} src={`http://127.0.0.1:5050/files/${activeVideoId}/drums.m4a`} preload="auto" onLoadedData={(e) => { e.currentTarget.volume = volumes.drums / 100; if (isPlaying) e.currentTarget.play().catch(()=>{}); }} />
                            <audio ref={bassRef} src={`http://127.0.0.1:5050/files/${activeVideoId}/bass.m4a`} preload="auto" onLoadedData={(e) => { e.currentTarget.volume = volumes.bass / 100; if (isPlaying) e.currentTarget.play().catch(()=>{}); }} />
                            <audio ref={otherRef} src={`http://127.0.0.1:5050/files/${activeVideoId}/other.m4a`} preload="auto" onLoadedData={(e) => { e.currentTarget.volume = volumes.other / 100; if (isPlaying) e.currentTarget.play().catch(()=>{}); }} />
                        </>
                    ) : (
                        <audio 
                            ref={instrumentalRef} 
                            src={`http://127.0.0.1:5050/files/${activeVideoId}/no_vocals.m4a`} 
                            preload="auto" 
                            onLoadedData={(e) => { e.currentTarget.volume = volumes.instrumental / 100; if (isPlaying) e.currentTarget.play().catch(()=>{}); }} 
                        />
                    )}
                </div>
            )}
            {activeVideoId ? (
                <>
                    <YouTube
                        videoId={activeVideoId}
                        opts={opts}
                        className="w-full h-full"
                        iframeClassName="w-full h-full pointer-events-none"
                        onReady={handleYouTubeReady}
                        onStateChange={handleYouTubeStateChange}
                        onEnd={onEnded}
                    />
                    <LyricsOverlay 
                        playerRef={ytPlayerRef} 
                        activeVideoId={activeVideoId} 
                        videoTitle={currentVideo?.title} 
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
