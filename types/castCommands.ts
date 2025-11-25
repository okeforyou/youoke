/**
 * Firebase Cast Command System
 *
 * Command Pattern for Remote → Monitor communication
 * - Remote sends commands (write-only to /commands)
 * - Monitor executes commands (read /commands, write /state)
 * - Remote reads state (read-only from /state)
 */

export interface QueueVideo {
  videoId: string;
  title: string;
  author?: string;
  key: number;
  addedBy?: {
    uid: string;           // User ID or guest ID
    displayName: string;   // User's name or guest name
    isGuest: boolean;      // true if not logged in
  };
}

// Command Types
export type CastCommand =
  | { type: 'CONNECT'; payload: null }
  | { type: 'PLAY_NOW'; payload: { video: QueueVideo } }
  | { type: 'ADD_TO_QUEUE'; payload: { video: QueueVideo } }
  | { type: 'PLAY_NEXT'; payload: { video: QueueVideo } }
  | { type: 'PLAY'; payload: null }
  | { type: 'PAUSE'; payload: null }
  | { type: 'NEXT'; payload: null }
  | { type: 'PREVIOUS'; payload: null }
  | { type: 'SKIP_TO'; payload: { index: number } }
  | { type: 'MUTE'; payload: null }
  | { type: 'UNMUTE'; payload: null }
  | { type: 'TOGGLE_MUTE'; payload: null }
  | { type: 'REMOVE_AT'; payload: { index: number } }
  | { type: 'MOVE_UP'; payload: { index: number } }
  | { type: 'MOVE_DOWN'; payload: { index: number } }
  | { type: 'CLEAR_QUEUE'; payload: null }
  | { type: 'SET_PLAYLIST'; payload: { playlist: QueueVideo[] } };

export type CommandStatus = 'pending' | 'executing' | 'completed' | 'failed';

export interface CastCommandEnvelope {
  id: string;
  command: CastCommand;
  status: CommandStatus;
  timestamp: number;
  from: 'remote' | 'monitor';
  error?: string;
}

// State (read-only for Remote, write-only for Monitor)
export interface CastState {
  queue: QueueVideo[];
  currentIndex: number;
  currentVideo: QueueVideo | null;
  controls: {
    isPlaying: boolean;
    isMuted: boolean;
    volume?: number;
    currentTime?: number;
    duration?: number;
  };
  participants?: { [uid: string]: boolean };
  lastConnected?: number; // Timestamp when Remote last connected
}

// Room Data Structure
export interface CastRoom {
  hostId: string;
  isHost: boolean;
  state: CastState;
  commands?: { [commandId: string]: CastCommandEnvelope };
  createdAt: number;
  updatedAt?: number;
}
