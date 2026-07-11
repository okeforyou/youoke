import React, { useEffect, useRef } from 'react';
import YouTube from 'react-youtube';
import { usePlayerStore } from '../stores/usePlayerStore';
import { MidiCanvasRenderer } from './MidiCanvasRenderer';
import { useMidiEngine } from '@/context/MidiEngineContext';
import { playerService } from '../services/playerService';
import { YouTubeAdapter } from '../adapters/YouTubeAdapter';
import { useMixerStore } from '../stores/useMixerStore';

interface UniversalPlayerProps {
    onEnded?: () => void;
    onReady?: (target: any) => void;
    onStateChange?: (event: any) => void;
    className?: string;

    showControls?: boolean;
}

export const UniversalPlayer: React.FC<UniversalPlayerProps> = ({
    onEnded,
    onReady,
    onStateChange,
    className,
    showControls = false
}) => {

    const currentVideo = usePlayerStore(state => state.currentVideo);
    const isPlaying = usePlayerStore(state => state.isPlaying);
    const currentSource = usePlayerStore(state => state.currentSource);
    const { setCurrentTime, setDuration } = usePlayerStore();
    const videoRef = useRef<HTMLVideoElement>(null);

    // AI Audio Mixer Refs
    const vocalRef = useRef<HTMLAudioElement>(null);
    const instrumentalRef = useRef<HTMLAudioElement>(null);
    const ytPlayerRef = useRef<any>(null);

    const getEffectiveVolume = useMixerStore(state => state.getEffectiveVolume);

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

    // --- AI AUDIO SYNC (YouOke AI) ---
    // Resilient Volume Sync
    useEffect(() => {
        if (vocalRef.current) vocalRef.current.volume = getEffectiveVolume('vocals') / 100;
        if (instrumentalRef.current) instrumentalRef.current.volume = getEffectiveVolume('instrumental') / 100;
    }, [getEffectiveVolume]);

    // Ultimate Sync Loop (Slaved to YT)
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (currentVideo?.sourceType === 'youoke_ai' && isPlaying) {
            interval = setInterval(() => {
                if (!ytPlayerRef.current || !instrumentalRef.current || !vocalRef.current) return;
                const state = ytPlayerRef.current.getPlayerState();
                if (state !== 1) return; // Only sync if playing
                
                const ytTime = ytPlayerRef.current.getCurrentTime();
                if (typeof ytTime !== 'number' || ytTime === 0) return;
                
                if (Math.abs(instrumentalRef.current.currentTime - ytTime) > 0.3) {
                    instrumentalRef.current.currentTime = ytTime;
                }
                if (Math.abs(vocalRef.current.currentTime - ytTime) > 0.3) {
                    vocalRef.current.currentTime = ytTime;
                }
                if (instrumentalRef.current.paused) instrumentalRef.current.play().catch(e => console.error(e));
                if (vocalRef.current.paused) vocalRef.current.play().catch(e => console.error(e));
            }, 1000);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [isPlaying, currentVideo?.sourceType]);

    // Handle Play/Pause
    useEffect(() => {
        if (currentVideo?.sourceType === 'youoke_ai' && currentVideo?.aiStatus === 'ready') {
            if (isPlaying) {
                const ytTime = ytPlayerRef.current?.getCurrentTime();
                if (typeof ytTime === 'number' && ytTime > 0) {
                    if (vocalRef.current && Math.abs(vocalRef.current.currentTime - ytTime) > 0.3) vocalRef.current.currentTime = ytTime;
                    if (instrumentalRef.current && Math.abs(instrumentalRef.current.currentTime - ytTime) > 0.3) instrumentalRef.current.currentTime = ytTime;
                }
                vocalRef.current?.play().catch(e => console.error(e));
                instrumentalRef.current?.play().catch(e => console.error(e));
            } else {
                vocalRef.current?.pause();
                instrumentalRef.current?.pause();
            }
        }
    }, [isPlaying, currentVideo?.sourceType, currentVideo?.aiStatus]);

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
            origin: typeof window !== 'undefined' ? window.location.origin : undefined,
            enablejsapi: 1 as 0 | 1,
        },
    };

    const handleYouTubeReady = (event: any) => {
        ytPlayerRef.current = event.target;
        if (currentVideo?.sourceType === 'youoke_ai' && currentVideo?.aiStatus === 'ready') {
            event.target.mute();
        }

        // Register adapter if needed
        const adapter = playerService.getAdapter();
        if (adapter instanceof YouTubeAdapter) {
            adapter.setPlayer(event.target);
        }
        if (onReady) onReady(event.target);
    };

    const handleYouTubeStateChange = (event: any) => {
        if (currentVideo?.sourceType === 'youoke_ai' && currentVideo?.aiStatus === 'ready' && (event.data === 1 || event.data === 3)) {
            event.target.mute(); // Force mute if AI mode
        }
        // Handle state changes if needed
        if (onStateChange) onStateChange(event);
    };

    // Use currentSource as videoId for standard React-YouTube management
    // Default sourceType to 'youtube' if not set (backward compat for old Firestore data)
    const isAiReady = currentVideo?.sourceType === 'youoke_ai' && currentVideo?.aiStatus === 'ready';
    const effectiveSourceType = isAiReady ? 'youoke_ai' : (currentVideo?.sourceType === 'youoke_ai' ? 'youtube' : (currentVideo?.sourceType || 'youtube'));
    
    const activeVideoId = ((effectiveSourceType === 'youtube' || effectiveSourceType === 'youoke_ai') && currentSource && !currentSource.startsWith('search:'))
        ? currentSource
        : undefined;

    // React to aiStatus becoming ready while playing
    useEffect(() => {
        if (isAiReady && ytPlayerRef.current) {
            ytPlayerRef.current.mute();
        }
    }, [isAiReady]);

    return (
        <div className={`relative w-full h-full ${className} youtube-player-wrapper`}>
            {activeVideoId ? (
                <>
                    <YouTube
                        key={activeVideoId}
                        videoId={activeVideoId}
                        opts={opts}
                        className="w-full h-full"
                        iframeClassName="w-full h-full pointer-events-none"
                        onReady={handleYouTubeReady}
                        onStateChange={handleYouTubeStateChange}
                        onEnd={onEnded}
                    />
                    {effectiveSourceType === 'youoke_ai' && (
                        <>
                            <audio
                                ref={vocalRef}
                                src={`http://127.0.0.1:5050/files/${activeVideoId}/vocals.m4a`}
                                preload="auto"
                                onLoadedData={(e) => {
                                    e.currentTarget.volume = getEffectiveVolume('vocals') / 100;
                                    if (isPlaying) e.currentTarget.play().catch(() => {});
                                }}
                            />
                            <audio
                                ref={instrumentalRef}
                                src={`http://127.0.0.1:5050/files/${activeVideoId}/no_vocals.m4a`}
                                preload="auto"
                                onLoadedData={(e) => {
                                    e.currentTarget.volume = getEffectiveVolume('instrumental') / 100;
                                    if (isPlaying) e.currentTarget.play().catch(() => {});
                                }}
                            />
                        </>
                    )}
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
