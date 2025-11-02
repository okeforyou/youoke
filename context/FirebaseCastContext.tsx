import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ref, set, onValue, update, remove, get, off } from 'firebase/database';
import { realtimeDb } from '../firebase';
import { RecommendedVideo, SearchResult } from '../types/invidious';
import { useAuth } from './AuthContext';

// Extended Video type with queue key
type QueueVideo = (SearchResult | RecommendedVideo) & { key: number };

interface CastContextValue {
  // Connection State
  isConnected: boolean;
  roomCode: string;
  isHost: boolean;

  // Queue State
  playlist: QueueVideo[];
  currentIndex: number;
  currentVideo: QueueVideo | null;

  // Room Actions
  createRoom: () => Promise<string>;
  joinRoom: (code: string) => Promise<boolean>;
  leaveRoom: () => void;

  // Queue Operations
  setPlaylist: (playlist: QueueVideo[]) => void;
  addToQueue: (video: SearchResult | RecommendedVideo) => void;
  playNow: (video: SearchResult | RecommendedVideo) => void;
  playNext: (video: SearchResult | RecommendedVideo) => void;
  removeAt: (index: number) => void;
  moveUp: (index: number) => void;
  moveDown: (index: number) => void;

  // Player Controls
  play: () => void;
  pause: () => void;
  next: () => void;
  previous: () => void;
  skipTo: (index: number) => void;
  toggleMute: () => void;
  isMuted: boolean;
}

const CastContext = createContext<CastContextValue | undefined>(undefined);

// Generate random room code (4 digits: 0000-9999)
const generateRoomCode = (): string => {
  const randomNum = Math.floor(Math.random() * 10000);
  return randomNum.toString().padStart(4, '0');
};

export function FirebaseCastProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [isHost, setIsHost] = useState(false);

  const [playlist, setPlaylistState] = useState<QueueVideo[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentVideo, setCurrentVideo] = useState<QueueVideo | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Start muted

  // Cleanup listeners on unmount or room change
  useEffect(() => {
    return () => {
      if (roomCode && realtimeDb) {
        const roomRef = ref(realtimeDb, `rooms/${roomCode}`);
        off(roomRef);
      }
    };
  }, [roomCode]);

  // Listen to room changes
  useEffect(() => {
    if (!roomCode || !realtimeDb) return;

    const roomRef = ref(realtimeDb, `rooms/${roomCode}`);

    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();

      if (!data) {
        // Room doesn't exist or was deleted
        console.log('Room not found or deleted');
        leaveRoom();
        return;
      }

      // Update local state from Firebase
      if (data.queue) {
        setPlaylistState(data.queue);
      }

      if (data.currentIndex !== undefined) {
        setCurrentIndex(data.currentIndex);
      }

      if (data.currentVideo) {
        setCurrentVideo(data.currentVideo);
      }

      // Sync controls state
      if (data.controls) {
        if (data.controls.isPlaying !== undefined) {
          setIsPlaying(data.controls.isPlaying);
        }
        if (data.controls.isMuted !== undefined) {
          setIsMuted(data.controls.isMuted);
        }
      }

      console.log('Room data updated:', data);
    });

    return () => unsubscribe();
  }, [roomCode]);

  // Create a new room
  const createRoom = async (): Promise<string> => {
    if (!realtimeDb || !user?.uid) {
      console.error('Firebase or user not available');
      return '';
    }

    const code = generateRoomCode();
    const roomRef = ref(realtimeDb, `rooms/${code}`);

    try {
      // Check if room already exists
      const snapshot = await get(roomRef);
      if (snapshot.exists()) {
        // Room code collision, try again
        return createRoom();
      }

      // Create new room
      await set(roomRef, {
        hostId: user.uid,
        createdAt: Date.now(),
        status: 'active',
        queue: [],
        currentIndex: 0,
        currentVideo: null,
        controls: {
          isPlaying: false,
          volume: 100,
        },
        participants: {
          [user.uid]: {
            displayName: user.displayName || 'Host',
            joinedAt: Date.now(),
            deviceType: 'mobile',
          },
        },
      });

      setRoomCode(code);
      setIsHost(true);
      setIsConnected(true);

      console.log('Room created:', code);
      return code;
    } catch (error) {
      console.error('Error creating room:', error);
      return '';
    }
  };

  // Join an existing room
  const joinRoom = async (code: string): Promise<boolean> => {
    console.log('🔍 FirebaseCastContext.joinRoom called with code:', code);
    console.log('🔍 realtimeDb exists:', !!realtimeDb);
    console.log('🔍 user.uid:', user?.uid);

    if (!realtimeDb || !user?.uid) {
      console.error('❌ Firebase or user not available');
      return false;
    }

    const roomRef = ref(realtimeDb, `rooms/${code}`);
    console.log('🔍 Room ref created:', `rooms/${code}`);

    try {
      // Check if room exists
      console.log('🔍 Checking if room exists...');
      const snapshot = await get(roomRef);
      console.log('🔍 Snapshot exists:', snapshot.exists());

      if (!snapshot.exists()) {
        console.error('❌ Room not found');
        return false;
      }

      const roomData = snapshot.val();
      console.log('🔍 Room data:', roomData);

      // Check if user is host
      const isHostUser = roomData.hostId === user.uid;
      console.log('🔍 Is host user:', isHostUser);

      // Add user to participants
      console.log('🔍 Adding user to participants...');
      await update(ref(realtimeDb, `rooms/${code}/participants/${user.uid}`), {
        displayName: user.displayName || 'Guest',
        joinedAt: Date.now(),
        deviceType: 'mobile',
      });

      setRoomCode(code);
      setIsHost(isHostUser);
      setIsConnected(true);

      console.log('✅ Joined room:', code, 'as', isHostUser ? 'host' : 'guest');
      return true;
    } catch (error) {
      console.error('❌ Error joining room:', error);
      return false;
    }
  };

  // Leave the current room
  const leaveRoom = () => {
    if (!realtimeDb || !roomCode || !user?.uid) return;

    try {
      // Remove user from participants
      const participantRef = ref(realtimeDb, `rooms/${roomCode}/participants/${user.uid}`);
      remove(participantRef);

      // If host is leaving, delete the room
      if (isHost) {
        const roomRef = ref(realtimeDb, `rooms/${roomCode}`);
        remove(roomRef);
      }

      setRoomCode('');
      setIsHost(false);
      setIsConnected(false);
      setPlaylistState([]);
      setCurrentIndex(0);
      setCurrentVideo(null);

      console.log('Left room');
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  };

  // Update room data in Firebase
  const updateRoom = async (updates: any) => {
    if (!realtimeDb || !roomCode || !isConnected) {
      console.warn('Cannot update room: not connected');
      return;
    }

    try {
      const roomRef = ref(realtimeDb, `rooms/${roomCode}`);
      await update(roomRef, updates);
      console.log('✅ Room updated:', updates);
    } catch (error) {
      console.error('❌ Error updating room:', error);
    }
  };

  // Set entire playlist
  const setPlaylist = (newPlaylist: QueueVideo[]) => {
    setPlaylistState(newPlaylist);

    // If currentVideo exists in newPlaylist, keep it. Otherwise use first song.
    let newIndex = 0;
    let newCurrentVideo = newPlaylist[0] || null;

    if (currentVideo) {
      const existingIndex = newPlaylist.findIndex(v => v.videoId === currentVideo.videoId);
      if (existingIndex !== -1) {
        // Current video exists in new playlist - keep playing it
        newIndex = existingIndex;
        newCurrentVideo = currentVideo;
        console.log('🔄 Keeping current video in sync:', currentVideo.title);
      }
    }

    updateRoom({
      queue: newPlaylist,
      currentIndex: newIndex,
      currentVideo: newCurrentVideo,
    });
  };

  // Add video to end of queue
  const addToQueue = (video: SearchResult | RecommendedVideo) => {
    const newVideo = { ...video, key: Date.now() };
    const newPlaylist = [...playlist, newVideo];

    setPlaylistState(newPlaylist);
    updateRoom({
      queue: newPlaylist,
      currentVideo: playlist.length === 0 ? newVideo : currentVideo,
    });
  };

  // Play video immediately (add to front or jump to existing)
  const playNow = (video: SearchResult | RecommendedVideo) => {
    // If same video as current, just restart it
    if (currentVideo?.videoId === video.videoId) {
      console.log('▶️ Restarting current video');
      setIsPlaying(true);
      updateRoom({
        currentVideo: { ...video, key: Date.now() },
        controls: { isPlaying: true, isMuted },
      });
      return;
    }

    // Check if video already exists in queue
    const existingIndex = playlist.findIndex(v => v.videoId === video.videoId);

    if (existingIndex !== -1) {
      // Video exists in queue - jump to it
      console.log('▶️ Jumping to existing song in queue at index', existingIndex);
      setCurrentIndex(existingIndex);
      setCurrentVideo(playlist[existingIndex]);
      setIsPlaying(true);

      updateRoom({
        currentIndex: existingIndex,
        currentVideo: playlist[existingIndex],
        controls: { isPlaying: true, isMuted },
      });
    } else {
      // Video not in queue - add to front and play
      console.log('▶️ Adding new song to front and playing');
      const newVideo = { ...video, key: Date.now() };
      const newPlaylist = [newVideo, ...playlist];

      setPlaylistState(newPlaylist);
      setCurrentIndex(0);
      setCurrentVideo(newVideo);
      setIsPlaying(true);

      updateRoom({
        queue: newPlaylist,
        currentIndex: 0,
        currentVideo: newVideo,
        controls: { isPlaying: true, isMuted },
      });
    }
  };

  // Play video next (insert after current)
  const playNext = (video: SearchResult | RecommendedVideo) => {
    const newVideo = { ...video, key: Date.now() };
    const newPlaylist = [
      ...playlist.slice(0, currentIndex + 1),
      newVideo,
      ...playlist.slice(currentIndex + 1),
    ];

    setPlaylistState(newPlaylist);
    updateRoom({ queue: newPlaylist });
  };

  // Remove video at index
  const removeAt = (index: number) => {
    const newPlaylist = playlist.filter((_, i) => i !== index);

    // Adjust current index if needed
    let newCurrentIndex = currentIndex;
    if (index < currentIndex) {
      newCurrentIndex = currentIndex - 1;
    } else if (index === currentIndex) {
      newCurrentIndex = Math.min(currentIndex, newPlaylist.length - 1);
    }

    setPlaylistState(newPlaylist);
    setCurrentIndex(newCurrentIndex);

    updateRoom({
      queue: newPlaylist,
      currentIndex: newCurrentIndex,
      currentVideo: newPlaylist[newCurrentIndex] || null,
    });
  };

  // Move video up in queue
  const moveUp = (index: number) => {
    if (index <= 0) return;

    const newPlaylist = [...playlist];
    [newPlaylist[index - 1], newPlaylist[index]] = [newPlaylist[index], newPlaylist[index - 1]];

    setPlaylistState(newPlaylist);
    updateRoom({ queue: newPlaylist });
  };

  // Move video down in queue
  const moveDown = (index: number) => {
    if (index >= playlist.length - 1) return;

    const newPlaylist = [...playlist];
    [newPlaylist[index], newPlaylist[index + 1]] = [newPlaylist[index + 1], newPlaylist[index]];

    setPlaylistState(newPlaylist);
    updateRoom({ queue: newPlaylist });
  };

  // Player controls
  const play = () => {
    setIsPlaying(true);
    updateRoom({
      controls: { isPlaying: true, isMuted },
    });
  };

  const pause = () => {
    setIsPlaying(false);
    updateRoom({
      controls: { isPlaying: false, isMuted },
    });
  };

  const next = () => {
    if (currentIndex < playlist.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setCurrentVideo(playlist[newIndex]);
      setIsPlaying(true);

      updateRoom({
        currentIndex: newIndex,
        currentVideo: playlist[newIndex],
        controls: { isPlaying: true, isMuted },
      });
    }
  };

  const previous = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setCurrentVideo(playlist[newIndex]);
      setIsPlaying(true);

      updateRoom({
        currentIndex: newIndex,
        currentVideo: playlist[newIndex],
        controls: { isPlaying: true, isMuted },
      });
    }
  };

  const skipTo = (index: number) => {
    if (index >= 0 && index < playlist.length) {
      setCurrentIndex(index);
      setCurrentVideo(playlist[index]);
      setIsPlaying(true);

      updateRoom({
        currentIndex: index,
        currentVideo: playlist[index],
        controls: { isPlaying: true, isMuted },
      });
    }
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    console.log(newMutedState ? '🔇 Muting from Remote' : '🔊 Unmuting from Remote');

    updateRoom({
      controls: { isPlaying, isMuted: newMutedState },
    });
  };

  const value: CastContextValue = {
    isConnected,
    roomCode,
    isHost,
    playlist,
    currentIndex,
    currentVideo,
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
    isMuted,
  };

  return <CastContext.Provider value={value}>{children}</CastContext.Provider>;
}

export function useFirebaseCast() {
  const context = useContext(CastContext);
  if (context === undefined) {
    throw new Error('useFirebaseCast must be used within a FirebaseCastProvider');
  }
  return context;
}
