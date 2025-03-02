import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Message from "./models/message.js";
import Conversation from "./models/conversation.js";

const JWT_SECRET = process.env.JWT_SECRET;

export default function configureSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Store online users
  const onlineUsers = new Map();

  // Authenticate socket connections using JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication error"));
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (error) {
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;
    console.log(`User connected: ${userId}`);

    // Add user to online users
    onlineUsers.set(userId, socket.id);

    // Broadcast user online status
    io.emit("userStatus", { userId, status: "online" });

    // Join user to their conversation rooms
    socket.join(userId);

    // Handle sending messages
    socket.on("sendMessage", async ({ conversationId, content }) => {
      try {
        // Save message to database
        const message = await Message.create({
          conversationId,
          sender: userId,
          content,
        });

        // Update conversation last message
        await Conversation.updateLastMessage(conversationId, {
          id: message._id,
          content: message.content,
          sender: message.sender,
          createdAt: message.createdAt,
        });

        // Get conversation to find recipients
        const conversation = await Conversation.findById(conversationId);

        // Emit message to all participants in the conversation
        conversation.participants.forEach((participantId) => {
          const participantStrId = participantId.toString();
          socket.to(participantStrId).emit("newMessage", {
            ...message,
            conversationId,
          });
        });

        // Send back confirmation to sender
        socket.emit("messageSent", { message });
      } catch (error) {
        socket.emit("messageError", { error: error.message });
      }
    });

    // Handle typing status
    socket.on("typing", ({ conversationId, isTyping }) => {
      // Get conversation to find recipients
      socket.to(conversationId).emit("userTyping", {
        userId,
        conversationId,
        isTyping,
      });
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${userId}`);

      // Remove user from online users
      onlineUsers.delete(userId);

      // Broadcast user offline status
      io.emit("userStatus", { userId, status: "offline" });
    });
  });

  return io;
}
