import express from "express";
import cors from "cors";
import { createServer } from "http";
import dotenv from "dotenv";
import userRoutes from "./routes/user.js";
import conversationRoutes from "./routes/conversation.js";
import messageRoutes from "./routes/message.js";
import configureSocket from "./socket.js";
import dbConnection from "./db/connection.js";

// Load environment variables
dotenv.config({ path: "../config.env" });

const PORT = process.env.PORT || 5050;
const app = express();
const httpServer = createServer(app);

// Configure socket.io
const io = configureSocket(httpServer);

app.use(cors());
app.use(express.json());

// Routes
app.use("/api/users", userRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);

// Start the Express server
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});