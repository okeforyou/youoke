/**
 * Command Executor Hook for Monitor
 *
 * Listens to pending commands from Firebase and executes them
 * Only Monitor should use this hook
 */

import { useEffect, useCallback } from 'react';
import { ref, onChildAdded, update, off } from 'firebase/database';
import { realtimeDb } from '../firebase';
import { CastCommand, CastCommandEnvelope, CastState, QueueVideo } from '../types/castCommands';
import { YouTubePlayer } from 'react-youtube';

interface CommandExecutorProps {
  roomCode: string;
  playerRef: YouTubePlayer | null;
  currentState: CastState;
  onStateChange: (newState: Partial<CastState>) => void;
}

export function useCommandExecutor({
  roomCode,
  playerRef,
  currentState,
  onStateChange,
}: CommandExecutorProps) {
  const executeCommand = useCallback(
    async (envelope: CastCommandEnvelope) => {
      const { id, command } = envelope;
      if (!realtimeDb) return;
      const roomRef = ref(realtimeDb, `rooms/${roomCode}`);
      const commandRef = ref(realtimeDb, `rooms/${roomCode}/commands/${id}`);

      try {
        console.log('🎯 Executing command:', command.type, command.payload);

        // Mark as executing
        await update(commandRef, { status: 'executing' });

        let newState: Partial<CastState> = {};

        switch (command.type) {
          case 'PLAY_NOW': {
            const { video } = command.payload;
            const queue = currentState.queue || [];
            const existingIndex = queue.findIndex(
              (v) => v.videoId === video.videoId
            );

            if (existingIndex !== -1) {
              // Jump to existing
              newState = {
                currentIndex: existingIndex,
                currentVideo: queue[existingIndex],
                controls: { ...currentState.controls, isPlaying: true },
              };
            } else {
              // Add to front
              const newQueue = [video, ...queue];
              newState = {
                queue: newQueue,
                currentIndex: 0,
                currentVideo: video,
                controls: { ...currentState.controls, isPlaying: true },
              };
            }
            break;
          }

          case 'ADD_TO_QUEUE': {
            const { video, addedBy } = command.payload;
            const queue = currentState.queue || [];
            
            // v5.3.97: Generate UUID + attach addedBy
            const videoWithMetadata = { 
              ...video, 
              uuid: video.uuid || crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              addedBy: addedBy || video.addedBy || null 
            };
            
            const newQueue = [...queue, videoWithMetadata];
            
            // If queue was empty, auto-play the first song
            if (queue.length === 0) {
              newState = {
                queue: newQueue,
                currentIndex: 0,
                currentVideo: videoWithMetadata,
                controls: { ...currentState.controls, isPlaying: true },
                notification: { type: 'added', video: videoWithMetadata, timestamp: Date.now() }
              };
            } else {
              newState = {
                queue: newQueue,
                currentVideo: currentState.currentVideo,
                notification: { type: 'added', video: videoWithMetadata, timestamp: Date.now() }
              };
            }
            break;
          }

          case 'PLAY_NEXT': {
            const { video } = command.payload;
            const queue = currentState.queue || [];
            const insertIndex = currentState.currentIndex + 1;
            const newQueue = [
              ...queue.slice(0, insertIndex),
              video,
              ...queue.slice(insertIndex),
            ];
            newState = { queue: newQueue };
            break;
          }

          case 'REORDER_QUEUE': {
            const { queue } = command.payload;
            // Update queue with new order
            // Note: currentIndex stays the same, but currentVideo might shift position
            const currentVideoId = currentState.currentVideo?.videoId;
            const newCurrentIndex = queue.findIndex((v: any) => v.videoId === currentVideoId);

            newState = {
              queue: queue,
              currentIndex: newCurrentIndex !== -1 ? newCurrentIndex : currentState.currentIndex,
            };
            break;
          }

          case 'PLAY':
            if (playerRef) {
              await playerRef.playVideo();
            }
            newState = {
              controls: { ...currentState.controls, isPlaying: true },
            };
            break;

          case 'PAUSE':
            if (playerRef) {
              await playerRef.pauseVideo();
            }
            newState = {
              controls: { ...currentState.controls, isPlaying: false },
            };
            break;

          case 'NEXT': {
            const nextIndex = currentState.currentIndex + 1;
            if (nextIndex < currentState.queue.length) {
              newState = {
                currentIndex: nextIndex,
                currentVideo: currentState.queue[nextIndex],
                controls: { ...currentState.controls, isPlaying: true },
              };
            }
            break;
          }

          case 'PREVIOUS': {
            const prevIndex = currentState.currentIndex - 1;
            if (prevIndex >= 0) {
              newState = {
                currentIndex: prevIndex,
                currentVideo: currentState.queue[prevIndex],
                controls: { ...currentState.controls, isPlaying: true },
              };
            }
            break;
          }

          case 'SKIP_TO': {
            const { index } = command.payload;
            if (index >= 0 && index < currentState.queue.length) {
              newState = {
                currentIndex: index,
                currentVideo: currentState.queue[index],
                controls: { ...currentState.controls, isPlaying: true },
              };
            }
            break;
          }

          case 'MUTE':
            if (playerRef) {
              await playerRef.mute();
            }
            newState = {
              controls: { ...currentState.controls, isMuted: true },
            };
            break;

          case 'UNMUTE':
            if (playerRef) {
              await playerRef.unMute();
            }
            newState = {
              controls: { ...currentState.controls, isMuted: false },
            };
            break;

          case 'TOGGLE_MUTE': {
            const newMuted = !currentState.controls.isMuted;
            if (playerRef) {
              if (newMuted) {
                await playerRef.mute();
              } else {
                await playerRef.unMute();
              }
            }
            newState = {
              controls: { ...currentState.controls, isMuted: newMuted },
            };
            break;
          }

          case 'REMOVE_AT': {
            const { index, uuid } = command.payload;
            let newQueue = [...currentState.queue];
            
            // v5.3.97: Universal Remove — try uuid, then videoId, then index
            let actualIndex = index;
            if (uuid) {
              let foundIndex = newQueue.findIndex(v => v.uuid === uuid);
              if (foundIndex === -1) {
                // Fallback: remote may send videoId as "uuid" when real uuid is missing
                foundIndex = newQueue.findIndex(v => (v.videoId || v.id) === uuid);
              }
              if (foundIndex !== -1) actualIndex = foundIndex;
            }

            if (typeof actualIndex !== 'number' || actualIndex < 0 || actualIndex >= newQueue.length) {
              console.error('❌ REMOVE_AT: Invalid index or uuid not found', { actualIndex, uuid });
              break;
            }

            newQueue = newQueue.filter((_, i) => i !== actualIndex);
            let newIndex = currentState.currentIndex;
            let newCurrentVideo = currentState.currentVideo;

            if (actualIndex < currentState.currentIndex) {
              newIndex--;
            } else if (actualIndex === currentState.currentIndex) {
              newCurrentVideo = newQueue[newIndex] || null;
            }

            newState = {
              queue: newQueue,
              currentIndex: Math.max(0, newIndex),
              currentVideo: newCurrentVideo,
            };
            break;
          }

          case 'MOVE_UP': {
            const { index } = command.payload;
            if (index > 0) {
              const newQueue = [...currentState.queue];
              [newQueue[index - 1], newQueue[index]] = [newQueue[index], newQueue[index - 1]];
              newState = { queue: newQueue };
            }
            break;
          }

          case 'MOVE_DOWN': {
            const { index } = command.payload;
            if (index < currentState.queue.length - 1) {
              const newQueue = [...currentState.queue];
              [newQueue[index], newQueue[index + 1]] = [newQueue[index + 1], newQueue[index]];
              newState = { queue: newQueue };
            }
            break;
          }

          case 'CLEAR_QUEUE':
            newState = {
              queue: [],
              currentIndex: 0,
              currentVideo: null,
              controls: { ...currentState.controls, isPlaying: false },
            };
            break;

          case 'SET_PLAYLIST': {
            const { playlist } = command.payload;
            // Keep current video if it exists in new playlist
            let newIndex = 0;
            let newCurrentVideo = playlist[0] || null;

            if (currentState.currentVideo) {
              const existingIndex = playlist.findIndex(
                (v) => v.videoId === currentState.currentVideo?.videoId
              );
              if (existingIndex !== -1) {
                newIndex = existingIndex;
                newCurrentVideo = currentState.currentVideo;
              }
            }

            newState = {
              queue: playlist,
              currentIndex: newIndex,
              currentVideo: newCurrentVideo,
            };
            break;
          }
          case 'TOGGLE_QUEUE_OVERLAY':
            newState = {
              isQueueVisible: !currentState.isQueueVisible,
            };
            break;
          case 'TOGGLE_FULLSCREEN': {
            const isFs = !!document.fullscreenElement || !!(document as any).webkitFullscreenElement;
            if (!isFs) {
              const elem = document.getElementById('karaoke-video-container') || document.documentElement;
              if (elem.requestFullscreen) {
                elem.requestFullscreen().catch(err => console.error("Fullscreen failed:", err));
              } else if ((elem as any).webkitRequestFullscreen) {
                (elem as any).webkitRequestFullscreen();
              }
            } else {
              if (document.exitFullscreen) {
                document.exitFullscreen().catch(err => console.error("Exit fullscreen failed:", err));
              } else if ((document as any).webkitExitFullscreen) {
                (document as any).webkitExitFullscreen();
              }
            }
            newState = {
              layoutMode: isFs ? 'split' : 'fullscreen'
            } as any;
            break;
          }
        }

        // Update state in Firebase
        if (Object.keys(newState).length > 0) {
          await update(roomRef, { state: { ...currentState, ...newState } });
          onStateChange(newState);
          console.log('✅ Command executed:', command.type);
        }

        // Mark as completed
        await update(commandRef, { status: 'completed' });
      } catch (error) {
        console.error('❌ Command execution failed:', error);
        await update(commandRef, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
    [roomCode, playerRef, currentState, onStateChange]
  );

  // Listen to new commands
  useEffect(() => {
    if (!roomCode || !realtimeDb) return;

    const commandsRef = ref(realtimeDb, `rooms/${roomCode}/commands`);

    // Listen to new commands being added
    const unsubscribe = onChildAdded(commandsRef, (snapshot) => {
      const envelope = snapshot.val() as CastCommandEnvelope;
      // Only execute pending commands
      if (envelope && envelope.status === 'pending') {
        executeCommand(envelope);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [roomCode, executeCommand]);
}
