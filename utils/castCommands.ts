/**
 * Cast Command Utilities
 * 
 * STATE-DRIVEN ARCHITECTURE:
 * For TV/DJ Mode, we write directly to /state (real-time sync).
 * The TV page subscribes to /state via Firebase SDK onValue.
 * 
 * Commands are still sent to /commands for Monitor compatibility,
 * but we also immediately update /state for TV.
 */

import { realtimeDb, auth } from '../firebase';
import { CastCommand, CastCommandEnvelope, CastState, QueueVideo } from '../types/castCommands';

/**
 * Generate a unique command ID
 */
function generateCommandId(): string {
  return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get current state from Firebase
 */
async function getCurrentState(roomCode: string): Promise<CastState | null> {
  const dbURL = realtimeDb.app.options.databaseURL;
  try {
    const response = await fetch(`${dbURL}/rooms/${roomCode}/state.json`);
    return response.ok ? await response.json() : null;
  } catch (e) {
    console.error('Failed to get current state:', e);
    return null;
  }
}

/**
 * Write state directly to Firebase
 */
async function writeState(roomCode: string, state: CastState): Promise<void> {
  const dbURL = realtimeDb.app.options.databaseURL;
  try {
    const user = auth?.currentUser;
    const token = (user && typeof user.getIdToken === 'function') ? await user.getIdToken() : null;
    const url = token
      ? `${dbURL}/rooms/${roomCode}/state.json?auth=${token}`
      : `${dbURL}/rooms/${roomCode}/state.json`;

    await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state),
    });
  } catch (e) {
    console.error('Failed to write state:', e);
  }
}

/**
 * Apply command to state and return new state
 */
function applyCommandToState(state: CastState, command: CastCommand): CastState {
  switch (command.type) {
    case 'PLAY':
      return { ...state, controls: { ...state.controls, isPlaying: true } };

    case 'PAUSE':
      return { ...state, controls: { ...state.controls, isPlaying: false } };

    case 'MUTE':
      return { ...state, controls: { ...state.controls, isMuted: true } };

    case 'UNMUTE':
      return { ...state, controls: { ...state.controls, isMuted: false } };

    case 'TOGGLE_MUTE':
      return { ...state, controls: { ...state.controls, isMuted: !state.controls.isMuted } };

    case 'SET_VOLUME':
      return { ...state, controls: { ...state.controls, volume: command.payload.volume } };

    case 'NEXT': {
      const nextIndex = state.currentIndex + 1;
      if (nextIndex < state.queue.length) {
        return {
          ...state,
          currentIndex: nextIndex,
          currentVideo: state.queue[nextIndex],
          controls: { ...state.controls, isPlaying: true }
        };
      }
      return state;
    }

    case 'PREVIOUS': {
      const prevIndex = state.currentIndex - 1;
      if (prevIndex >= 0) {
        return {
          ...state,
          currentIndex: prevIndex,
          currentVideo: state.queue[prevIndex],
          controls: { ...state.controls, isPlaying: true }
        };
      }
      return state;
    }

    case 'SKIP_TO': {
      const { index } = command.payload;
      if (index >= 0 && index < state.queue.length) {
        return {
          ...state,
          currentIndex: index,
          currentVideo: state.queue[index],
          controls: { ...state.controls, isPlaying: true }
        };
      }
      return state;
    }

    case 'SET_PLAYLIST': {
      const { playlist } = command.payload;
      return {
        ...state,
        queue: playlist,
        currentIndex: 0,
        currentVideo: playlist[0] || null,
        controls: { ...state.controls, isPlaying: playlist.length > 0 }
      };
    }

    case 'ADD_TO_QUEUE': {
      const { video } = command.payload;
      const newQueue = [...state.queue, video];
      return {
        ...state,
        queue: newQueue,
        currentVideo: state.queue.length === 0 ? video : state.currentVideo
      };
    }

    case 'PLAY_NOW': {
      const { video } = command.payload;
      const existingIndex = state.queue.findIndex(v => v.videoId === video.videoId);
      if (existingIndex !== -1) {
        return {
          ...state,
          currentIndex: existingIndex,
          currentVideo: state.queue[existingIndex],
          controls: { ...state.controls, isPlaying: true }
        };
      } else {
        const newQueue = [video, ...state.queue];
        return {
          ...state,
          queue: newQueue,
          currentIndex: 0,
          currentVideo: video,
          controls: { ...state.controls, isPlaying: true }
        };
      }
    }

    case 'PLAY_NEXT': {
      const { video } = command.payload;
      const insertIndex = state.currentIndex + 1;
      const newQueue = [
        ...state.queue.slice(0, insertIndex),
        video,
        ...state.queue.slice(insertIndex)
      ];
      return { ...state, queue: newQueue };
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

      return {
        ...state,
        queue: newQueue,
        currentIndex: Math.max(0, newIndex),
        currentVideo: newCurrentVideo
      };
    }

    case 'MOVE_UP': {
      const { index } = command.payload;
      if (index > 0) {
        const newQueue = [...state.queue];
        [newQueue[index - 1], newQueue[index]] = [newQueue[index], newQueue[index - 1]];
        return { ...state, queue: newQueue };
      }
      return state;
    }

    case 'MOVE_DOWN': {
      const { index } = command.payload;
      if (index < state.queue.length - 1) {
        const newQueue = [...state.queue];
        [newQueue[index], newQueue[index + 1]] = [newQueue[index + 1], newQueue[index]];
        return { ...state, queue: newQueue };
      }
      return state;
    }

    case 'CLEAR_QUEUE':
      return {
        ...state,
        queue: [],
        currentIndex: 0,
        currentVideo: null,
        controls: { ...state.controls, isPlaying: false }
      };

    case 'STOP_SESSION':
      return {
        queue: [],
        currentIndex: 0,
        currentVideo: null,
        controls: { isPlaying: false, isMuted: false }
      };

    default:
      return state;
  }
}

/**
 * Send a command to the room
 * STATE-DRIVEN: We read current state, apply command, then write new state.
 * This ensures TV (which reads /state) gets immediate updates.
 */
export async function sendCommand(roomCode: string, command: CastCommand, from: 'remote' | 'monitor' = 'remote'): Promise<string> {
  if (!realtimeDb) {
    throw new Error('Firebase not initialized');
  }

  const commandId = generateCommandId();

  try {
    // 1. Get current state
    const currentState = await getCurrentState(roomCode);
    if (!currentState) {
      console.error('❌ No state found for room:', roomCode);
      throw new Error('Room state not found');
    }

    // 2. Apply command to get new state
    const newState = applyCommandToState(currentState, command);

    // 3. Write new state directly (THE KEY CHANGE!)
    await writeState(roomCode, newState);

    console.log('📤 State updated via REST:', command.type, from);
    return commandId;
  } catch (error) {
    console.error('❌ Failed to send command:', error);
    throw error;
  }
}

/**
 * Clean up old completed/failed commands
 * (Kept for backwards compatibility but less needed now)
 */
export async function cleanupCommands(roomCode: string, olderThanMinutes: number = 5): Promise<void> {
  if (!realtimeDb) return;

  const dbURL = realtimeDb.app.options.databaseURL;

  try {
    const response = await fetch(`${dbURL}/rooms/${roomCode}/commands.json`);
    const commands = await response.json();

    if (!commands) return;

    const now = Date.now();
    const cutoff = now - olderThanMinutes * 60 * 1000;

    const user = auth?.currentUser;
    const token = (user && typeof user.getIdToken === 'function') ? await user.getIdToken() : null;

    for (const [id, envelope] of Object.entries(commands) as [string, any][]) {
      if (
        (envelope.status === 'completed' || envelope.status === 'failed') &&
        envelope.timestamp < cutoff
      ) {
        const deleteURL = token
          ? `${dbURL}/rooms/${roomCode}/commands/${id}.json?auth=${token}`
          : `${dbURL}/rooms/${roomCode}/commands/${id}.json`;

        await fetch(deleteURL, { method: 'DELETE' });
        console.log('🗑️ Deleted old command:', id);
      }
    }
  } catch (error) {
    console.error('❌ Failed to cleanup commands:', error);
  }
}
