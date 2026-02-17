/**
 * useCastCommands - Send commands to TV receiver via Firebase
 * 
 * This uses the SAME command path that the Mobile Remote uses.
 * TV's useCommandExecutor picks these up and executes them.
 * 
 * Firebase path: rooms/{roomCode}/commands/{commandId}
 */

import { useCallback, useRef } from 'react';
import { ref, set, serverTimestamp } from 'firebase/database';
import { realtimeDb } from '../../../firebase';
import { auth } from '../../../firebase';
import { QueueItem } from '../../../modules/player/types';

export function useCastCommands(roomCode: string | null) {
    const lastSentRef = useRef<string>('');

    const sendCommand = useCallback(async (type: string, payload: any = {}) => {
        if (!roomCode || !realtimeDb) {
            console.warn('📡 Cast: No room code or DB, skipping command', type);
            return;
        }

        // Deduplicate rapid-fire sends (same type within 200ms)
        const dedupeKey = `${type}-${Date.now()}`;
        if (lastSentRef.current === dedupeKey) return;
        lastSentRef.current = dedupeKey;

        const cmdId = `dash_${Date.now()}`;
        const currentUser = auth?.currentUser;

        const command = {
            id: cmdId,
            command: {
                type,
                payload: {
                    ...payload,
                    addedBy: {
                        uid: currentUser?.uid || 'dashboard',
                        name: 'Dashboard',
                        isGuest: false
                    }
                }
            },
            status: 'pending',
            timestamp: serverTimestamp(),
            senderId: currentUser?.uid || 'dashboard',
            from: 'dashboard'
        };

        console.log('📡 Dashboard → TV:', type, payload);

        const cmdRef = ref(realtimeDb, `rooms/${roomCode}/commands/${cmdId}`);
        await set(cmdRef, command).catch(e =>
            console.error('❌ Command send failed:', e)
        );
    }, [roomCode]);

    // Convenience methods matching common player actions
    const play = useCallback(() => sendCommand('PLAY'), [sendCommand]);
    const pause = useCallback(() => sendCommand('PAUSE'), [sendCommand]);
    const next = useCallback(() => sendCommand('NEXT'), [sendCommand]);
    const previous = useCallback(() => sendCommand('PREVIOUS'), [sendCommand]);
    const toggleMute = useCallback(() => sendCommand('TOGGLE_MUTE'), [sendCommand]);

    const addToQueue = useCallback((video: QueueItem) => {
        sendCommand('ADD_TO_QUEUE', {
            video: {
                videoId: video.videoId || video.id,
                title: video.title,
                author: video.author,
                key: Date.now()
            }
        });
    }, [sendCommand]);

    const playNow = useCallback((video: QueueItem) => {
        sendCommand('PLAY_NOW', {
            video: {
                videoId: video.videoId || video.id,
                title: video.title,
                author: video.author,
                key: Date.now()
            }
        });
    }, [sendCommand]);

    const skipTo = useCallback((index: number) => {
        sendCommand('SKIP_TO', { index });
    }, [sendCommand]);

    const removeAt = useCallback((index: number) => {
        sendCommand('REMOVE_AT', { index });
    }, [sendCommand]);

    const reorderQueue = useCallback((queue: QueueItem[]) => {
        sendCommand('REORDER_QUEUE', {
            queue: queue.map(v => ({
                videoId: v.videoId || v.id,
                title: v.title,
                author: v.author,
                key: v.uuid ? parseInt(v.uuid, 36) : Date.now()
            }))
        });
    }, [sendCommand]);

    return {
        sendCommand,
        play, pause, next, previous, toggleMute,
        addToQueue, playNow, skipTo, removeAt, reorderQueue
    };
}
