import { io, Socket } from 'socket.io-client'

import { ClientToServerEvents, ServerToClientEvents } from '../types/socket'

const isBrowser = typeof window !== "undefined";

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> | null =
  isBrowser ? io() : null;

export const joinRoom = (
  room: string,
  callback?: (message: string) => void
) => {
  if (!room) return;

  if (!socket.connected) {
    console.log(`Attempt to reconnect if disconnected`);
    socket.connect();
  }
  if (socket) {
    socket.emit("joinRoom", room);
    socket.once("roomJoined", (joinedRoom: string) => {
      console.log(`Joined room: ${joinedRoom}`);
      callback && callback(`room: ${joinedRoom}`);
    });
  } else {
  }
};

export const leaveRoom = (
  room: string,
  callback?: (message: string) => void
) => {
  if (socket) {
    socket.emit("leaveRoom", room);
    socket.once("roomLeft", (leftRoom: string) => {
      console.log(`Left room: ${leftRoom}`);
      callback && callback(`Left room: ${leftRoom}`);
    });
  } else {
    console.error("Socket is not initialized.");
  }
};
