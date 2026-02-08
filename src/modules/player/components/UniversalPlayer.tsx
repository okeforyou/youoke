import React, { useEffect, useRef } from 'react';
import YouTube from 'react-youtube';
import { usePlayerStore } from '../stores/usePlayerStore';
import { MidiCanvasRenderer } from './MidiCanvasRenderer';
import { useMidiEngine } from '../../../context/MidiEngineContext';
import { playerService } from '../services/playerService';
import { YouTubeAdapter } from '../adapters/YouTubeAdapter';

interface UniversalPlayerProps {
    onEnded?: () => void;
    onReady?: (target: any) => void;
    className?: string;
    showControls?: boolean;
}

export const UniversalPlayer: React.FC<UniversalPlayerProps> = ({
    onEnded,
    onReady,
    className,
    showControls = false
}) => {
    const currentVideo = usePlayerStore(state => state.currentVideo);
    const isPlaying = usePlayerStore(state => state.isPlaying);
    const currentSource = usePlayerStore(state => state.currentSource);

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
    if (currentVideo?.sourceType === 'vcd') {
        return (
            <div className={`relative w-full h-full bg-black ${className}`}>
                <video
                    src={currentVideo.filePath}
                    className="w-full h-full object-contain"
                    autoPlay={isPlaying}
                    controls={showControls}
                    onEnded={onEnded}
                />
            </div>
        );
    }

    // 3. YouTube (Default)
    const opts = {
        height: '100%',
        width: '100%',
        playerVars: {
            autoplay: 1 as 0 | 1,
            controls: showControls ? 1 : 0 as 0 | 1,
            modestbranding: 1 as const,
        },
    };

    const handleYouTubeReady = (event: any) => {
        // Register adapter if needed
        const adapter = playerService.getAdapter();
        if (adapter instanceof YouTubeAdapter) {
            adapter.setPlayer(event.target);
        }
        if (onReady) onReady(event.target);
    };

    const handleYouTubeStateChange = (event: any) => {
        // 0 = Ended
        if (event.data === 0 && onEnded) {
            onEnded();
        }
    };

    return (
        <div className={`relative w-full h-full ${className} youtube-player-wrapper`}>
            <YouTube
                // CRITICAL: Keep videoId undefined to prevent React-YouTube from managing the source.
                // SidebarPlayer handles loading imperatively via loadVideoById() for smoother transitions.
                videoId={undefined}
                opts={opts}
                className="w-full h-full"
                iframeClassName="w-full h-full"
                onReady={handleYouTubeReady}
                onStateChange={handleYouTubeStateChange}
            />
        </div>
    );
};
