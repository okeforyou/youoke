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
            const existingIndex = currentState.queue.findIndex(
              (v) => v.videoId === video.videoId
            );

            if (existingIndex !== -1) {
              // Jump to existing
              newState = {
                currentIndex: existingIndex,
                currentVideo: currentState.queue[existingIndex],
                controls: { ...currentState.controls, isPlaying: true },
              };
            } else {
              // Add to front
              const newQueue = [video, ...currentState.queue];
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
            const { video } = command.payload;
            const newQueue = [...currentState.queue, video];
            newState = {
              queue: newQueue,
              currentVideo: currentState.queue.length === 0 ? video : currentState.currentVideo,
            };
            break;
          }

          case 'PLAY_NEXT': {
            const { video } = command.payload;
            const insertIndex = currentState.currentIndex + 1;
            const newQueue = [
              ...currentState.queue.slice(0, insertIndex),
              video,
              ...currentState.queue.slice(insertIndex),
            ];
            newState = { queue: newQueue };
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
            const { index } = command.payload;
            const newQueue = currentState.queue.filter((_, i) => i !== index);
            let newIndex = currentState.currentIndex;
            let newCurrentVideo = currentState.currentVideo;

            if (index < currentState.currentIndex) {
              newIndex--;
            } else if (index === currentState.currentIndex) {
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
