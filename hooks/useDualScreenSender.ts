import { useEffect, useRef } from 'react';
import { useKaraokeState } from './karaoke';

export const useDualScreenSender = () => {
    const { playlist, curVideoId } = useKaraokeState();
    const channelRef = useRef<BroadcastChannel | null>(null);

    // Initialize Channel
    useEffect(() => {
        channelRef.current = new BroadcastChannel('youoke-dual-sync');
        return () => {
            channelRef.current?.close();
        };
    }, []);

    // Broadcast State Changes
    useEffect(() => {
        if (!channelRef.current) return;

        const isDualActive = localStorage.getItem('youoke-dual-active') === 'true';
        if (!isDualActive) return;

        const payload = {
            type: 'SYNC_STATE',
            payload: {
                videoId: curVideoId || '',
                queue: playlist || [],
                currentIndex: playlist?.findIndex((v) => v.videoId === curVideoId) ?? -1,
                timestamp: Date.now(),
            },
        };

        console.log('📡 [Sender] Broadcasting SYNC_STATE:', payload.payload);
        channelRef.current.postMessage(payload);
    }, [playlist, curVideoId]);

    // Listen for Request State (Initial Config)
    useEffect(() => {
        if (!channelRef.current) return;

        const handler = (event: MessageEvent) => {
            if (event.data?.type === 'REQUEST_STATE') {
                console.log('📡 [Sender] Received REQUEST_STATE, responding...');
                const payload = {
                    type: 'SYNC_STATE',
                    payload: {
                        videoId: curVideoId || '',
                        queue: playlist || [],
                        currentIndex: playlist?.findIndex((v) => v.videoId === curVideoId) ?? -1,
                        timestamp: Date.now(),
                    },
                };
                channelRef.current?.postMessage(payload);
            }
        }

        channelRef.current.addEventListener('message', handler);
        return () => channelRef.current?.removeEventListener('message', handler);
    }, [playlist, curVideoId]);

    return null; // Logic only hook
};
