/**
 * Firebase Cast Context - Command Pattern Version
 *
 * Remote (Controller):
 * - Sends commands to Monitor
 * - Reads state (read-only)
 * - Never updates state directly
 *
 * Monitor (Player):
 * - Executes commands
 * - Updates state
 * - Controls YouTube player
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ref, set, onValue, get, off } from 'firebase/database';
import { realtimeDb } from '../firebase';
import { RecommendedVideo, SearchResult } from '../types/invidious';
import { useAuth } from './AuthContext';
import { sendCommand } from '../utils/castCommands';
import { CastState, QueueVideo } from '../types/castCommands';

interface CastContextValue {
  // Connection State
  isConnected: boolean;
  roomCode: string;
  isHost: boolean;

  // State (Read-only for Remote)
  state: CastState;

  // Room Actions
  createRoom: () => Promise<string>;
  joinRoom: (code: string) => Promise<boolean>;
  leaveRoom: () => void;

  // Queue Operations (Send commands)
  setPlaylist: (playlist: QueueVideo[]) => void;
  addToQueue: (video: SearchResult | RecommendedVideo) => void;
  playNow: (video: SearchResult | RecommendedVideo) => void;
  playNext: (video: SearchResult | RecommendedVideo) => void;
  removeAt: (index: number) => void;
  moveUp: (index: number) => void;
  moveDown: (index: number) => void;

  // Player Controls (Send commands)
  play: () => void;
  pause: () => void;
  next: () => void;
  previous: () => void;
  replay: () => void;
  skipTo: (index: number) => void;
  toggleMute: () => void;

  // Shortcuts (for backwards compatibility)
  playlist: QueueVideo[];
  currentIndex: number;
  currentVideo: QueueVideo | null;
  isMuted: boolean;
}

const CastContext = createContext<CastContextValue | undefined>(undefined);

const generateRoomCode = (): string => {
  const randomNum = Math.floor(Math.random() * 10000);
  return randomNum.toString().padStart(4, '0');
};

export function FirebaseCastProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [isHost, setIsHost] = useState(false);

  // State from Firebase (read-only)
  const [state, setState] = useState<CastState>({
    queue: [],
    currentIndex: 0,
    currentVideo: null,
    controls: { isPlaying: false, isMuted: true },
  });

  // Cleanup
  useEffect(() => {
    return () => {
      if (roomCode && realtimeDb) {
        const roomRef = ref(realtimeDb, `rooms/${roomCode}`);
        off(roomRef);
      }
    };
  }, [roomCode]);

  // Listen to state changes
  useEffect(() => {
    if (!roomCode || !realtimeDb) return;

    const stateRef = ref(realtimeDb, `rooms/${roomCode}/state`);
    const unsubscribe = onValue(stateRef, (snapshot) => {
      const newState = snapshot.val() as CastState | null;
      if (newState) {
        console.log('📦 State updated from Firebase:', newState);
        setState(newState);
      }
    });

    return () => {
      off(stateRef);
      unsubscribe();
    };
  }, [roomCode]);

  // Create room
  const createRoom = async (): Promise<string> => {
    if (!realtimeDb || !user) {
      throw new Error('Firebase or user not initialized');
    }

    const newRoomCode = generateRoomCode();
    const roomRef = ref(realtimeDb, `rooms/${newRoomCode}`);

    try {
      await set(roomRef, {
        hostId: user.uid,
        isHost: true,
        state: {
          queue: [],
          currentIndex: 0,
          currentVideo: null,
          controls: { isPlaying: false, isMuted: true },
        },
        // Don't initialize commands - let it be created when first command arrives
        createdAt: Date.now(),
        participants: { [user.uid]: true },
      });

      setRoomCode(newRoomCode);
      setIsHost(true);
      setIsConnected(true);
      console.log('✅ Room created:', newRoomCode);

      return newRoomCode;
    } catch (error) {
      console.error('❌ Failed to create room:', error);
      throw error;
    }
  };

  // Join room
  const joinRoom = async (code: string): Promise<boolean> => {
    if (!realtimeDb || !user) {
      throw new Error('Firebase or user not initialized');
    }

    console.log('🔍 Attempting to join room:', code);
    const roomRef = ref(realtimeDb, `rooms/${code}`);

    try {
      const snapshot = await get(roomRef);
      if (!snapshot.exists()) {
        console.log('❌ Room not found:', code);
        return false;
      }

      const roomData = snapshot.val();
      const isHostUser = roomData.hostId === user.uid;

      // Add user to participants
      const participantRef = ref(realtimeDb, `rooms/${code}/participants/${user.uid}`);
      await set(participantRef, true);

      setRoomCode(code);
      setIsHost(isHostUser);
      setIsConnected(true);
      console.log('✅ Joined room:', code, isHostUser ? 'as host' : 'as guest');

      return true;
    } catch (error) {
      console.error('❌ Failed to join room:', error);
      return false;
    }
  };

  // Leave room
  const leaveRoom = () => {
    setIsConnected(false);
    setRoomCode('');
    setIsHost(false);
    setState({
      queue: [],
      currentIndex: 0,
      currentVideo: null,
      controls: { isPlaying: false, isMuted: true },
    });
    console.log('👋 Left room');
  };

  // Queue Operations - Send Commands
  const setPlaylist = (playlist: QueueVideo[]) => {
    sendCommand(roomCode, {
      type: 'SET_PLAYLIST',
      payload: { playlist },
    });
  };

  const addToQueue = (video: SearchResult | RecommendedVideo) => {
    const queueVideo: QueueVideo = { ...video, key: Date.now() };
    sendCommand(roomCode, {
      type: 'ADD_TO_QUEUE',
      payload: { video: queueVideo },
    });
  };

  const playNow = (video: SearchResult | RecommendedVideo) => {
    const queueVideo: QueueVideo = { ...video, key: Date.now() };
    sendCommand(roomCode, {
      type: 'PLAY_NOW',
      payload: { video: queueVideo },
    });
  };

  const playNext = (video: SearchResult | RecommendedVideo) => {
    const queueVideo: QueueVideo = { ...video, key: Date.now() };
    sendCommand(roomCode, {
      type: 'PLAY_NEXT',
      payload: { video: queueVideo },
    });
  };

  const removeAt = (index: number) => {
    sendCommand(roomCode, {
      type: 'REMOVE_AT',
      payload: { index },
    });
  };

  const moveUp = (index: number) => {
    sendCommand(roomCode, {
      type: 'MOVE_UP',
      payload: { index },
    });
  };

  const moveDown = (index: number) => {
    sendCommand(roomCode, {
      type: 'MOVE_DOWN',
      payload: { index },
    });
  };

  // Player Controls - Send Commands
  const play = () => {
    sendCommand(roomCode, { type: 'PLAY', payload: null });
  };

  const pause = () => {
    sendCommand(roomCode, { type: 'PAUSE', payload: null });
  };

  const next = () => {
    sendCommand(roomCode, { type: 'NEXT', payload: null });
  };

  const previous = () => {
    sendCommand(roomCode, { type: 'PREVIOUS', payload: null });
  };

  const replay = () => {
    sendCommand(roomCode, { type: 'REPLAY', payload: null });
  };

  const skipTo = (index: number) => {
    sendCommand(roomCode, {
      type: 'SKIP_TO',
      payload: { index },
    });
  };

  const toggleMute = () => {
    sendCommand(roomCode, { type: 'TOGGLE_MUTE', payload: null });
  };

  const value: CastContextValue = {
    isConnected,
    roomCode,
    isHost,
    state,
    createRoom,
    joinRoom,
    leaveRoom,
    setPlaylist,
    addToQueue,
    playNow,
    playNext,
    removeAt,
    moveUp,
    moveDown,
    play,
    pause,
    next,
    previous,
    replay,
    skipTo,
    toggleMute,
    // Shortcuts for backwards compatibility
    playlist: state.queue,
    currentIndex: state.currentIndex,
    currentVideo: state.currentVideo,
    isMuted: state.controls.isMuted,
  };

  return <CastContext.Provider value={value}>{children}</CastContext.Provider>;
}

export function useFirebaseCast() {
  const context = useContext(CastContext);
  if (!context) {
    throw new Error('useFirebaseCast must be used within FirebaseCastProvider');
  }
  return context;
}
