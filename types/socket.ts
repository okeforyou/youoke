export interface ClientToServerEvents {
  joinRoom: (room: string) => void;
  leaveRoom: (room: string) => void;
  message: (data: { room: string; action: SocketData }) => void;
  reqPlaylist: (room: string) => void;
}

export interface ServerToClientEvents {
  message: (message: SocketData) => void;
  reqPlaylist: () => void;
  roomJoined: (room: string) => void;
  roomLeft: (room: string) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export enum ACTION {
  REMOTE_JOIN,
  SET_SONG,
  SET_PLAYLIST,
  SET_PLAYLIST_FROM_TV,
  PLAY,
  PAUSED,
  NEXT_SONG,
  REPLAY,
  MUTE,
  UNMUTE,
}

export interface SocketData {
  action: ACTION;
  videoId?: string;
  playlist?: any;
}
