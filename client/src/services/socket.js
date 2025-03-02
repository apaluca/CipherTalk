import { io } from "socket.io-client";

let socket;

export const initSocket = (token) => {
  if (socket) {
    socket.disconnect();
  }

  socket = io("http://localhost:5050", {
    auth: {
      token,
    },
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    throw new Error("Socket not initialized. Call initSocket first.");
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default {
  initSocket,
  getSocket,
  disconnectSocket,
};
