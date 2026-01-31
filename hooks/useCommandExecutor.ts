/**
 * Command Executor Hook for Monitor
 *
 * Listens to pending commands from Firebase and executes them
 * Only Monitor should use this hook
 */

import { useEffect, useRef, useCallback } from 'react';
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

  // Use Ref to access latest state without triggering re-renders/re-subscriptions
  const currentStateRef = useRef(currentState);
  const onStateChangeRef = useRef(onStateChange);
  const playerRefRef = useRef(playerRef);

  useEffect(() => {
    currentStateRef.current = currentState;
  }, [currentState]);

  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  useEffect(() => {
    playerRefRef.current = playerRef;
  }, [playerRef]);


  const executeCommand = useCallback(
    async (envelope: CastCommandEnvelope) => {
      const { id, command } = envelope;
      const roomRef = ref(realtimeDb, `rooms/${roomCode}`);
      const commandRef = ref(realtimeDb, `rooms/${roomCode}/commands/${id}`);

      const state = currentStateRef.current;
      const callback = onStateChangeRef.current;
      const player = playerRefRef.current;

      try {
        console.log('🎯 Executing command:', command.type, command.payload);

        // Mark as executing
        await update(commandRef, { status: 'executing' });

        let newState: Partial<CastState> = {};

        switch (command.type) {
          case 'PLAY_NOW': {
            const { video } = command.payload;
            const existingIndex = state.queue.findIndex(
              (v) => v.videoId === video.videoId
            );

            if (existingIndex !== -1) {
              // Jump to existing
              newState = {
                currentIndex: existingIndex,
                currentVideo: state.queue[existingIndex],
                controls: { ...state.controls, isPlaying: true },
              };
            } else {
              // Add to front
              const newQueue = [video, ...state.queue];
              newState = {
                queue: newQueue,
                currentIndex: 0,
                currentVideo: video,
                controls: { ...state.controls, isPlaying: true },
              };
            }
            break;
          }

          case 'ADD_TO_QUEUE': {
            const { video } = command.payload;
            const newQueue = [...state.queue, video];
            newState = {
              queue: newQueue,
              currentVideo: state.queue.length === 0 ? video : state.currentVideo,
            };
            break;
          }

          case 'PLAY_NEXT': {
            const { video } = command.payload;
            const insertIndex = state.currentIndex + 1;
            const newQueue = [
              ...state.queue.slice(0, insertIndex),
              video,
              ...state.queue.slice(insertIndex),
            ];
            newState = { queue: newQueue };
            break;
          }

          case 'PLAY':
            if (player) {
              await player.playVideo();
            }
            newState = {
              controls: { ...state.controls, isPlaying: true },
            };
            break;

          case 'PAUSE':
            if (player) {
              await player.pauseVideo();
            }
            newState = {
              controls: { ...state.controls, isPlaying: false },
            };
            break;

          case 'NEXT': {
            const nextIndex = state.currentIndex + 1;
            if (nextIndex < state.queue.length) {
              newState = {
                currentIndex: nextIndex,
                currentVideo: state.queue[nextIndex],
                controls: { ...state.controls, isPlaying: true },
              };
            }
            break;
          }

          case 'PREVIOUS': {
            const prevIndex = state.currentIndex - 1;
            if (prevIndex >= 0) {
              newState = {
                currentIndex: prevIndex,
                currentVideo: state.queue[prevIndex],
                controls: { ...state.controls, isPlaying: true },
              };
            }
            break;
          }

          case 'SKIP_TO': {
            const { index } = command.payload;
            if (index >= 0 && index < state.queue.length) {
              newState = {
                currentIndex: index,
                currentVideo: state.queue[index],
                controls: { ...state.controls, isPlaying: true },
              };
            }
            break;
          }

          case 'MUTE':
            if (player) {
              await player.mute();
            }
            newState = {
              controls: { ...state.controls, isMuted: true },
            };
            break;

          case 'UNMUTE':
            if (player) {
              await player.unMute();
            }
            newState = {
              controls: { ...state.controls, isMuted: false },
            };
            break;

          case 'TOGGLE_MUTE': {
            const newMuted = !state.controls.isMuted;
            if (player) {
              if (newMuted) {
                await player.mute();
              } else {
                await player.unMute();
              }
            }
            newState = {
              controls: { ...state.controls, isMuted: newMuted },
            };
            break;
          }

          case 'REMOVE_AT': {
            const { index } = command.payload;
            const newQueue = state.queue.filter((_, i) => i !== index);
            let newIndex = state.currentIndex;
            let newCurrentVideo = state.currentVideo;

            if (index < state.currentIndex) {
              newIndex--;
            } else if (index === state.currentIndex) {
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
              const newQueue = [...state.queue];
              [newQueue[index - 1], newQueue[index]] = [newQueue[index], newQueue[index - 1]];
              newState = { queue: newQueue };
            }
            break;
          }

          case 'MOVE_DOWN': {
            const { index } = command.payload;
            if (index < state.queue.length - 1) {
              const newQueue = [...state.queue];
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
              controls: { ...state.controls, isPlaying: false },
            };
            break;

          case 'SET_PLAYLIST': {
            const { playlist } = command.payload;
            // Keep current video if it exists in new playlist
            let newIndex = 0;
            let newCurrentVideo = playlist[0] || null;

            if (state.currentVideo) {
              const existingIndex = playlist.findIndex(
                (v) => v.videoId === state.currentVideo?.videoId
              );
              if (existingIndex !== -1) {
                newIndex = existingIndex;
                newCurrentVideo = state.currentVideo;
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
          await update(roomRef, { state: { ...state, ...newState } });
          callback(newState);
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
    [roomCode] // Only depend on roomCode (and refs, which are stable)
  );

  // Listen to new commands
  useEffect(() => {
    if (!roomCode || !realtimeDb) return;

    const commandsRef = ref(realtimeDb, `rooms/${roomCode}/commands`);

    console.log('👂 Starting Command Listener for room:', roomCode);

    // Listen to new commands being added
    const unsubscribe = onChildAdded(commandsRef, (snapshot) => {
      const envelope = snapshot.val() as CastCommandEnvelope;
      // Only execute pending commands
      if (envelope && envelope.status === 'pending') {
        executeCommand(envelope);
      }
    });

    return () => {
      console.log('🛑 Stopping Command Listener');
      unsubscribe();
    };
  }, [roomCode, executeCommand]);
}
