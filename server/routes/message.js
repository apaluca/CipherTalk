import express from "express";
import { authenticate } from "../middleware/auth.js";
import Message from "../models/message.js";
import Conversation from "../models/conversation.js";

const router = express.Router();

// Send a message
router.post("/", authenticate, async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    const userId = req.user._id.toString();

    // Verify that the user is part of the conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    const isParticipant = conversation.participants.some(
      (participant) => participant.toString() === userId
    );

    if (!isParticipant) {
      return res
        .status(403)
        .json({
          message: "Not authorized to send messages to this conversation",
        });
    }

    // Create message
    const message = await Message.create({
      conversationId,
      sender: userId,
      content,
    });

    // Update conversation with last message
    await Conversation.updateLastMessage(conversationId, {
      id: message._id,
      content: message.content,
      sender: message.sender,
      createdAt: message.createdAt,
    });

    res.status(201).json(message);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error sending message", error: error.message });
  }
});

// Mark message as read
router.patch("/:id/read", authenticate, async (req, res) => {
  try {
    const messageId = req.params.id;

    await Message.markAsRead(messageId);

    res.json({ message: "Message marked as read" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error marking message as read", error: error.message });
  }
});

export default router;
