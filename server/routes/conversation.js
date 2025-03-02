import express from "express";
import { ObjectId } from "mongodb";
import { authenticate } from "../middleware/auth.js";
import Conversation from "../models/conversation.js";
import Message from "../models/message.js";
import User from "../models/user.js";

const router = express.Router();

// Get all conversations for a user
router.get("/", authenticate, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const conversations = await Conversation.listByUserId(userId);

    // Populate conversations with participant details and last message
    const populatedConversations = await Promise.all(
      conversations.map(async (conv) => {
        // Get other participants (excluding current user)
        const participantIds = conv.participants
          .filter((id) => id.toString() !== userId)
          .map((id) => id.toString());

        const participantsDetails = await Promise.all(
          participantIds.map(async (id) => {
            const user = await User.findById(id);
            return {
              id: user._id,
              username: user.username,
              avatar: user.avatar,
            };
          })
        );

        return {
          id: conv._id,
          participants: participantsDetails,
          lastMessage: conv.lastMessage,
          updatedAt: conv.updatedAt,
        };
      })
    );

    res.json(populatedConversations);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching conversations", error: error.message });
  }
});

// Create a new conversation
router.post("/", authenticate, async (req, res) => {
  try {
    const { participantId } = req.body;
    const userId = req.user._id.toString();

    if (participantId === userId) {
      return res
        .status(400)
        .json({ message: "Cannot create conversation with yourself" });
    }

    // Check if participant exists
    const participant = await User.findById(participantId);
    if (!participant) {
      return res.status(404).json({ message: "Participant not found" });
    }

    // Check if conversation already exists
    const existingConversation = await Conversation.findByParticipants([
      userId,
      participantId,
    ]);
    if (existingConversation) {
      return res.json({
        id: existingConversation._id,
        participant: {
          id: participant._id,
          username: participant.username,
          avatar: participant.avatar,
        },
      });
    }

    // Create new conversation
    const newConversation = await Conversation.create([userId, participantId]);

    res.status(201).json({
      id: newConversation._id,
      participant: {
        id: participant._id,
        username: participant.username,
        avatar: participant.avatar,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating conversation", error: error.message });
  }
});

// Get messages for a conversation
router.get("/:id/messages", authenticate, async (req, res) => {
  try {
    const conversationId = req.params.id;
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
        .json({ message: "Not authorized to access this conversation" });
    }

    // Mark all messages as read
    await Message.markConversationAsRead(conversationId, userId);

    // Get messages
    const messages = await Message.listByConversationId(conversationId);

    // Reverse messages to show newest at the bottom
    const reversedMessages = messages.reverse();

    res.json(reversedMessages);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching messages", error: error.message });
  }
});

export default router;
