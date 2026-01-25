import { useEffect, useRef, useCallback } from 'react';
import { useKaraokeState } from './karaoke';

export const useDualScreenSender = () => {
    const { playlist, curVideoId } = useKaraokeState();
    const channelRef = useRef<BroadcastChannel | null>(null);

    // Use refs to always access latest state in callbacks
    const playlistRef = useRef(playlist);
    const curVideoIdRef = useRef(curVideoId);

    // Keep refs in sync
    useEffect(() => {
        playlistRef.current = playlist;
        curVideoIdRef.current = curVideoId;
    }, [playlist, curVideoId]);

    // Helper to build payload
    const buildPayload = useCallback(() => {
        const currentPlaylist = playlistRef.current || [];
        const currentVideoId = curVideoIdRef.current || '';
        return {
            type: 'SYNC_STATE',
            payload: {
                videoId: currentVideoId,
                queue: currentPlaylist,
                currentIndex: currentPlaylist.findIndex((v) => v.videoId === currentVideoId),
                isPlaying: true, // Always assume playing for SYNC updates (or can be passed via args if needed)
                timestamp: Date.now(),
            },
        };
    }, []);

    // Initialize Channel & Listener (Single Effect)
    useEffect(() => {
        const channel = new BroadcastChannel('youoke-dual-sync');
        channelRef.current = channel;
        console.log('📡 [Sender] Channel opened');

        // Listen for REQUEST_STATE
        const handler = (event: MessageEvent) => {
            if (event.data?.type === 'REQUEST_STATE') {
                console.log('📡 [Sender] Received REQUEST_STATE, responding...');
                const payload = buildPayload();
                channel.postMessage(payload);
                console.log('📡 [Sender] Sent SYNC_STATE:', payload.payload);
            }
        };

        channel.addEventListener('message', handler);

        return () => {
            channel.removeEventListener('message', handler);
            channel.close();
            channelRef.current = null;
            console.log('📡 [Sender] Channel closed');
        };
    }, [buildPayload]);

    // Broadcast on State Change
    useEffect(() => {
        if (!channelRef.current) return;

        const isDualActive = localStorage.getItem('youoke-dual-active') === 'true';
        if (!isDualActive) {
            console.log('📡 [Sender] Dual Mode NOT active, skipping broadcast');
            return;
        }

        const payload = buildPayload();
        console.log('📡 [Sender] Broadcasting SYNC_STATE:', payload.payload);
        channelRef.current.postMessage(payload);
    }, [playlist, curVideoId, buildPayload]);

    return null;
};
