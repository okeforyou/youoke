import { useEffect } from "react";
// @ts-ignore
import YouTube from "react-youtube";

// Define simplified interface for what we need from player
interface MediaSessionPlayer {
    playVideo: () => Promise<void>;
    pauseVideo: () => Promise<void>;
    getPlayerState: () => Promise<number>;
}

export function useMediaSession(
    isMoniter: boolean,
    isDualMode: boolean,
    isCastMode: boolean,
    handlePlay: () => void,
    handlePause: () => void,
    playerState: number | undefined
) {
    // Setup Action Handlers
    useEffect(() => {
        if (isMoniter || isDualMode) return;
        if (!('mediaSession' in navigator)) return;

        console.log('🎵 Setting up Media Session API handlers', isCastMode ? '(Cast mode)' : '(Local mode)');

        try {
            navigator.mediaSession.setActionHandler('play', () => {
                console.log('🎵 Media Session: Play action');
                handlePlay();
            });

            navigator.mediaSession.setActionHandler('pause', () => {
                console.log('🎵 Media Session: Pause action');
                handlePause();
            });

            // We can add next/prev here if we pass those handlers too
            // navigator.mediaSession.setActionHandler('previoustrack', ...);
            // navigator.mediaSession.setActionHandler('nexttrack', ...);
        } catch (error) {
            console.warn('⚠️ Media Session API error:', error);
        }

        return () => {
            if ('mediaSession' in navigator) {
                navigator.mediaSession.setActionHandler('play', null);
                navigator.mediaSession.setActionHandler('pause', null);
            }
        };
    }, [isMoniter, isDualMode, isCastMode, handlePlay, handlePause]);

    // Update Playback State
    useEffect(() => {
        if (isMoniter || isDualMode) return;
        if (!('mediaSession' in navigator)) return;

        if (playerState === 1 /* PLAYING */ || playerState === 3 /* BUFFERING */) {
            navigator.mediaSession.playbackState = 'playing';
        } else if (playerState === 2 /* PAUSED */) {
            navigator.mediaSession.playbackState = 'paused';
        } else {
            navigator.mediaSession.playbackState = 'none';
        }
    }, [playerState, isMoniter, isDualMode]);
}
