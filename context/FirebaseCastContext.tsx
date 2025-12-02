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

  // User Info (for guest mode support)
  userInfo: {
    uid: string;
    displayName: string;
    isGuest: boolean;
  } | null;

  // State (Read-only for Remote)
  state: CastState;

  // Room Actions
  createRoom: () => Promise<string>;
  joinRoom: (code: string, options?: { guestName?: string }) => Promise<boolean>;
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

  // User info (supports both logged-in and guest users)
  const [userInfo, setUserInfo] = useState<{
    uid: string;
    displayName: string;
    isGuest: boolean;
  } | null>(null);

  // State from Firebase (read-only)
  const [state, setState] = useState<CastState>({
    queue: [],
    currentIndex: 0,
    currentVideo: null,
    controls: { isPlaying: false, isMuted: true },
  });

  // Listen to state changes using REST API polling
  useEffect(() => {
    if (!roomCode || !realtimeDb) return;

    const dbURL = realtimeDb.app.options.databaseURL;
    let lastStateRef: any = null;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${dbURL}/rooms/${roomCode}/state.json`);
        const newState = await response.json() as CastState | null;

        if (newState) {
          // Only update if state changed (reduce re-renders)
          if (JSON.stringify(newState) !== JSON.stringify(lastStateRef)) {
            console.log('📦 State updated from Firebase (polling):', newState);
            setState(newState);
            lastStateRef = newState;
          }
        }
      } catch (error) {
        console.error('❌ State polling error:', error);
      }
    }, 500); // Poll every 500ms for faster response than Monitor

    return () => {
      clearInterval(pollInterval);
    };
  }, [roomCode]);

  // Create room
  const createRoom = async (): Promise<string> => {
    if (!realtimeDb || !user) {
      throw new Error('Firebase or user not initialized');
    }

    const newRoomCode = generateRoomCode();
    const dbURL = realtimeDb.app.options.databaseURL;

    try {
      const roomData = {
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
      };

      // Use REST API instead of set() to bypass stack overflow
      const token = await user.getIdToken();
      const response = await fetch(`${dbURL}/rooms/${newRoomCode}.json?auth=${token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create room: ${response.status}`);
      }

      // Set user info for host
      setUserInfo({
        uid: user.uid,
        displayName: user.displayName || user.email || 'Host',
        isGuest: false,
      });

      setRoomCode(newRoomCode);
      setIsHost(true);
      setIsConnected(true);
      console.log('✅ Room created via REST API:', newRoomCode);

      return newRoomCode;
    } catch (error) {
      console.error('❌ Failed to create room:', error);
      throw error;
    }
  };

  // Join room
  const joinRoom = async (code: string, options?: { guestName?: string }): Promise<boolean> => {
    if (!realtimeDb) {
      throw new Error('Firebase not initialized');
    }

    console.log('🔍 Attempting to join room:', code, options);

    try {
      // Use REST API instead of get() to bypass stack overflow
      const dbURL = realtimeDb.app.options.databaseURL;
      console.log('📡 Calling REST API to check room...');

      const response = await fetch(`${dbURL}/rooms/${code}.json`);
      const roomData = await response.json();

      if (!roomData) {
        console.log('❌ Room not found:', code);
        return false;
      }

      // Determine user info (logged-in user or guest)
      let currentUserInfo: { uid: string; displayName: string; isGuest: boolean };

      if (user && (user.displayName || user.email)) {
        // Logged-in user with name/email
        currentUserInfo = {
          uid: user.uid,
          displayName: user.displayName || user.email || 'User',
          isGuest: false,
        };
      } else if (options?.guestName) {
        // Guest user with custom name (includes anonymous auth users)
        currentUserInfo = {
          uid: user?.uid || `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          displayName: options.guestName,
          isGuest: true,
        };
      } else if (user) {
        // Anonymous user without guest name (fallback)
        currentUserInfo = {
          uid: user.uid,
          displayName: 'Anonymous',
          isGuest: true,
        };
      } else {
        console.error('❌ Either user must be logged in or guestName must be provided');
        return false;
      }

      const isHostUser = roomData.hostId === currentUserInfo.uid;

      // Add user to participants using REST API
      try {
        const participantURL = `${dbURL}/rooms/${code}/participants/${currentUserInfo.uid}.json`;

        if (user) {
          // Use auth token for logged-in users
          const token = await user.getIdToken();
          await fetch(`${participantURL}?auth=${token}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(true),
          });
        } else {
          // No auth for guests (requires open Firebase rules for guests)
          await fetch(participantURL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(true),
          });
        }
        console.log('✅ Participant added to room');
      } catch (authError) {
        console.warn('⚠️ Could not add participant (auth issue), continuing anyway...', authError);
        // Continue - room join is more important than participant tracking
      }

      setUserInfo(currentUserInfo);
      setRoomCode(code);
      setIsHost(isHostUser);
      setIsConnected(true);
      console.log('✅ Joined room via REST API:', code, isHostUser ? 'as host' : 'as guest', currentUserInfo);

      // Send CONNECT command to notify Monitor
      sendCommand(code, { type: 'CONNECT', payload: null });
      console.log('📡 Sent CONNECT command');

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
    setUserInfo(null);
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
    const queueVideo: QueueVideo = {
      ...video,
      key: Date.now(),
      addedBy: userInfo || undefined, // Add who added this song
    };
    sendCommand(roomCode, {
      type: 'ADD_TO_QUEUE',
      payload: { video: queueVideo },
    });
  };

  const playNow = (video: SearchResult | RecommendedVideo) => {
    const queueVideo: QueueVideo = {
      ...video,
      key: Date.now(),
      addedBy: userInfo || undefined, // Add who added this song
    };
    sendCommand(roomCode, {
      type: 'PLAY_NOW',
      payload: { video: queueVideo },
    });
  };

  const playNext = (video: SearchResult | RecommendedVideo) => {
    const queueVideo: QueueVideo = {
      ...video,
      key: Date.now(),
      addedBy: userInfo || undefined, // Add who added this song
    };
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
    userInfo,
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
