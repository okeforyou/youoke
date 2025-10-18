import { Server } from 'socket.io'

const SocketHandler = (req, res) => {
  if (res.socket.server.io) {
    console.info("Socket is already running");
  } else {
    console.info("Socket is initializing");
    const io = new Server(res.socket.server);
    res.socket.server.io = io;

    io.on("connection", (socket) => {
      socket.on("joinRoom", (room) => {
        // console.info("joinRoom", room, socket.id);
        socket.join(room);
        socket.emit("roomJoined", room);
        // console.info(`User joined room: ${room}`);
      });

      socket.on("leaveRoom", (room) => {
        // console.info("leaveRoom", room);
        socket.leave(room);
        socket.emit("roomLeft", room);
        // console.info(`User leaveRoom room: ${room}`);
      });

      socket.on("message", (data) => {
        const { room, action } = data;
        // console.info(room, action);
        io.to(room).emit("message", action);
      });

      socket.on("reqPlaylist", (room) => {
        io.to(room).emit("reqPlaylist");
      });

      socket.on("disconnect", () => {
        // console.info("user disconnected " + socket.id);
      });
    });
  }
  res.end();
};

export default SocketHandler;
