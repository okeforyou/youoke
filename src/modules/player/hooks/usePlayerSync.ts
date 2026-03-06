import { useEffect, useRef } from 'react';
import { usePlayerStore } from '../stores/usePlayerStore';
import { useDjPresence } from '../../../hooks/useDjPresence';
import { playerService } from '../services/playerService';
import { YouTubeAdapter } from '../adapters/YouTubeAdapter';

export const usePlayerSync = (
    isPassive: boolean,
    isDjMode: boolean,
    currentTime: number,
    setCurrentTime: (time: number) => void,
    playerRef: React.MutableRefObject<any>,
    castMode?: string
) => {
    const { play, pause } = usePlayerStore.getState();

    // Check local storage for Dual Mode state
    useEffect(() => {
        if (isPassive) return;

        const checkDualMode = () => {
            const dualActive = localStorage.getItem('youoke-dual-active') === 'true';
            // Also consider active Wireless Casting as Dual Mode BUT only for the Dashboard (not isPassive)
            const isCasting = castMode === 'smarttv' || castMode === 'webmonitor';
            setIsDualActive(!isPassive && (dualActive || isCasting));
        };

        checkDualMode();

        // Listen for storage changes (when dual screen closes/opens)
        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'youoke-dual-active') {
                checkDualMode();
            }
        };

        window.addEventListener('storage', handleStorage);
        // Poll regularly in case storage event misses (e.g. same window)
        const interval = setInterval(checkDualMode, 2000);

        return () => {
            window.removeEventListener('storage', handleStorage);
            clearInterval(interval);
        };
    }, [isPassive, castMode]);

    const [isDualActive, setIsDualActive] = useRefVal(false);

    // DJ Mode Presence
    const { isDjConnected, remoteMode } = useDjPresence(isDjMode);

    // AUTO-MUTE: If Sound is on TV (DJ Mode), mute local player
    // If Sound is on PC (Mirror Mode), unmute local player (or user preference)
    // AUTO-MUTE REMOVED by User Request: allow manual independent control
    // Both screens will play audio by default (unless user mutes them manually)

    const { currentSource, isPlaying, duration } = usePlayerStore(state => ({
        currentSource: state.currentSource,
        isPlaying: state.isPlaying,
        duration: state.duration
    }));

    const isSeekingRef = useRef(false);

    // ⏱️ Sync Time & Enforce Duration Limit
    useEffect(() => {
        if (!playerRef.current || !isPlaying) return;

        const interval = setInterval(() => {
            const target = playerRef.current;
            if (!target) return;

            // Safety check for method existence and iframe status
            if (typeof target.getIframe === 'function' && !target.getIframe()) return;
            if (typeof target.getCurrentTime !== 'function') return;

            // LOCK: If seeking, do not overwrite store time (prevents rubber-banding)
            if (isSeekingRef.current) return;

            const currentTime = target.getCurrentTime();
            const currentDuration = target.getDuration();

            if (isPassive) {
                // Passive mode (Monitor): Use syncRemoteTime to update store WITHOUT broadcasting
                // This allows CastService to read time from store and sync to Firebase
                usePlayerStore.getState().syncRemoteTime(currentTime);
            } else {
                // Active mode: Full broadcast so other tabs/windows stay in sync
                usePlayerStore.getState().setCurrentTime(currentTime);
            }

            // SYNC Duration (always, so Host knows when song ends)
            const storeDuration = usePlayerStore.getState().duration;
            if (currentDuration && currentDuration > 0 && Math.abs(currentDuration - storeDuration) > 1) {
                usePlayerStore.getState().setDuration(currentDuration);
            }

        }, 1000);
        return () => clearInterval(interval);
    }, [isPlaying, currentSource, isPassive]);

    // ⏩ SYNC: If Store's currentTime changes (via Handoff), seek to it
    useEffect(() => {
        const target = playerRef.current;
        // Block Sync if Dual Mode is active (Controller Mode)
        if (!target || isPassive || currentTime < 0 || isDualActive) return;

        try {
            if (typeof target.getIframe === 'function' && !target.getIframe()) return;

            if (typeof target.getCurrentTime === 'function') {
                const playerTime = target.getCurrentTime();
                if (Math.abs(currentTime - playerTime) > 2) {
                    console.log(`⏩ Syncing time: ${playerTime} -> ${currentTime}`);

                    // LOCK Heartbeat
                    isSeekingRef.current = true;
                    target.seekTo(currentTime);

                    // Release Lock
                    setTimeout(() => {
                        isSeekingRef.current = false;
                    }, 2000);
                }
            }
        } catch (e) {
            console.warn("Seek failed:", e);
        }
    }, [currentTime, isPassive, isDualActive]);

    // Sync Play/Pause
    useEffect(() => {
        const target = playerRef.current;
        if (!target || isDualActive) return;

        try {
            if (typeof target.getIframe === 'function' && !target.getIframe()) return;

            if (isPlaying) {
                if (typeof target.playVideo === 'function') target.playVideo();
            } else {
                if (typeof target.pauseVideo === 'function') target.pauseVideo();
            }
        } catch (e) {
            console.warn("Player control error:", e);
        }
    }, [isPlaying, isDualActive]);

    // 🎮 Event Handlers to keep Store in sync with Player
    const onPlayerReady = (event: any) => {
        console.log("✅ Player Ready");
        playerRef.current = event.target;
    };

    const onPlayerStateChange = (event: any) => {
        // 1 = Playing, 2 = Paused
        if (event.data === 1) {
            if (!usePlayerStore.getState().isPlaying) {
                console.log("🟢 Local Sync: Playing detected");
                play();
            }
        } else if (event.data === 2) {
            if (usePlayerStore.getState().isPlaying) {
                console.log("🟠 Local Sync: Pause detected");
                pause();
            }
        }
    };

    return {
        showDjOverlay: isDualActive,
        isDjConnected,
        onPlayerReady,
        onPlayerStateChange
    };
};


function useRefVal<T>(initial: T): [T, (val: T) => void] {
    const [val, setVal] = require('react').useState(initial);
    return [val, setVal];
}
