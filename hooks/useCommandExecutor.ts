/**
 * Command Executor Hook for Monitor/TV
 *
 * Listens to pending commands from Firebase and executes them.
 * Uses REST API Polling instead of SDK Listeners for stability on Smart TVs.
 */

import { useEffect, useRef, useCallback } from 'react';
import { realtimeDb, auth } from '../firebase';
import { CastCommand, CastCommandEnvelope, CastState } from '../types/castCommands';
import { YouTubePlayer } from 'react-youtube';

interface CommandExecutorProps {
  roomCode: string;
  playerRef: YouTubePlayer | null;
  currentState: CastState;
  onStateChange: (newState: Partial<CastState>) => void;
  onStopSession?: () => void;
}

export function useCommandExecutor({
  roomCode,
  playerRef,
  currentState,
  onStateChange,
  onStopSession,
}: CommandExecutorProps) {

  // Use Ref to access latest state without triggering re-renders/re-subscriptions
  const currentStateRef = useRef(currentState);
  const onStateChangeRef = useRef(onStateChange);
  const onStopSessionRef = useRef(onStopSession);
  const playerRefRef = useRef(playerRef);

  // Helper to force audio on command
  const ensureAudio = async () => {
    const player = playerRefRef.current;
    if (player && typeof player.unMute === 'function') {
      try {
        await player.unMute();
        // Also force volume up just in case
        await player.setVolume(100);
      } catch (e) { /* ignore */ }
    }
  };

  useEffect(() => {
    currentStateRef.current = currentState;
  }, [currentState]);

  useEffect(() => {
    onStateChangeRef.current = onStateChange;
  }, [onStateChange]);

  useEffect(() => {
    playerRefRef.current = playerRef;
  }, [playerRef]);

  useEffect(() => {
    onStopSessionRef.current = onStopSession;
  }, [onStopSession]);


  const executeCommand = useCallback(
    async (envelope: CastCommandEnvelope) => {
      const { id, command } = envelope;
      const dbURL = realtimeDb.app.options.databaseURL;

      const state = currentStateRef.current;
      const callback = onStateChangeRef.current;
      const player = playerRefRef.current;

      try {
        console.log('🎯 Executing command (REST):', command.type, command.payload);

        // Get Auth Token
        const user = auth.currentUser;
        const token = user ? await user.getIdToken() : null;
        const authParam = token ? `?auth=${token}` : '';

        // Mark as executing
        await fetch(`${dbURL}/rooms/${roomCode}/commands/${id}.json${authParam}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'executing' })
        });

        let newState: Partial<CastState> = {};

        switch (command.type) {
          case 'PLAY_NOW': {
            ensureAudio();
            const { video } = command.payload;
            const existingIndex = state.queue.findIndex(
              (v) => v.videoId === video.videoId
            );

            if (existingIndex !== -1) {
              newState = {
                currentIndex: existingIndex,
                currentVideo: state.queue[existingIndex],
                controls: { ...state.controls, isPlaying: true },
              };
            } else {
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
            ensureAudio();
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
            ensureAudio();
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

          case 'SET_VOLUME': {
            const { volume } = command.payload;
            if (player) {
              await player.setVolume(volume);
              if (volume > 0) {
                await player.unMute();
              }
            }
            newState = {
              controls: {
                ...state.controls,
                volume,
                isMuted: volume > 0 ? false : state.controls.isMuted
              },
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
            let newIndex = 0;
            let newCurrentVideo = playlist[0] || null;

            if (state.currentVideo) {
              const existingIndex = playlist.findIndex(
                (v: any) => v.videoId === state.currentVideo?.videoId
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

          case 'STOP_SESSION': {
            if (onStopSessionRef.current) {
              onStopSessionRef.current();
            }
            newState = {
              queue: [],
              currentIndex: 0,
              currentVideo: null,
              controls: { isPlaying: false, isMuted: true }
            };
            break;
          }
        }

        // Update state in Firebase via REST
        if (Object.keys(newState).length > 0) {
          const mergedState = { ...state, ...newState };
          await fetch(`${dbURL}/rooms/${roomCode}/state.json${authParam}`, {
            method: 'PUT',
            body: JSON.stringify(mergedState)
          });

          callback(newState);
          console.log('✅ Command executed:', command.type);
        }

        // Mark as completed via REST
        await fetch(`${dbURL}/rooms/${roomCode}/commands/${id}.json${authParam}`, {
          method: 'PATCH',
          body: JSON.stringify({ status: 'completed' })
        });

      } catch (error) {
        console.error('❌ Command execution failed:', error);
        // Mark as failed via REST
        const user = auth.currentUser;
        const token = user ? await user.getIdToken() : null;
        const authParam = token ? `?auth=${token}` : '';

        await fetch(`${dbURL}/rooms/${roomCode}/commands/${id}.json${authParam}`, {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        });
      }
    },
    [roomCode] // Only depend on roomCode (and refs, which are stable)
  );

  // Listen to new commands using REST Polling
  useEffect(() => {
    if (!roomCode || !realtimeDb) return;

    const dbURL = realtimeDb.app.options.databaseURL;
    const processedCommandIds = new Set<string>();

    console.log('👂 Starting REST Command Polling for room:', roomCode);

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${dbURL}/rooms/${roomCode}/commands.json`);
        if (!response.ok) return;

        const commands = await response.json() as Record<string, CastCommandEnvelope> | null;
        if (!commands) return;

        // Process pending commands
        for (const [commandId, envelope] of Object.entries(commands)) {
          // Skip if already processed or not pending
          if (processedCommandIds.has(commandId) || envelope.status !== 'pending') {
            continue;
          }

          console.log('✨ New Pending Command found:', envelope.command.type, commandId);
          processedCommandIds.add(commandId);
          executeCommand(envelope);
        }
      } catch (error) {
        console.error('Command polling error:', error);
      }
    }, 1000); // Poll every 1 second

    return () => {
      console.log('🛑 Stopping Command Polling');
      clearInterval(pollInterval);
    };
  }, [roomCode, executeCommand]);
}
