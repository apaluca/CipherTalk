import { ObjectId } from "mongodb";
import dbConnection from "../db/connection.js";

const getCollection = () => {
  const db = dbConnection.getDb();
  if (!db) {
    throw new Error("Database connection not established");
  }
  return db.collection("messages");
};

export default {
  async create(messageData) {
    const messagesCollection = getCollection();
    const newMessage = {
      conversationId: new ObjectId(messageData.conversationId),
      sender: new ObjectId(messageData.sender),
      content: messageData.content,
      createdAt: new Date(),
      read: false,
    };

    const result = await messagesCollection.insertOne(newMessage);
    return { ...newMessage, _id: result.insertedId };
  },

  async findById(id) {
    const messagesCollection = getCollection();
    return await messagesCollection.findOne({ _id: new ObjectId(id) });
  },

  async listByConversationId(conversationId, limit = 50, offset = 0) {
    const messagesCollection = getCollection();
    return await messagesCollection
      .find({
        conversationId: new ObjectId(conversationId),
      })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();
  },

  async markAsRead(messageId) {
    const messagesCollection = getCollection();
    await messagesCollection.updateOne(
      { _id: new ObjectId(messageId) },
      { $set: { read: true } }
    );
  },

  async markConversationAsRead(conversationId, userId) {
    const messagesCollection = getCollection();
    await messagesCollection.updateMany(
      {
        conversationId: new ObjectId(conversationId),
        sender: { $ne: new ObjectId(userId) },
        read: false,
      },
      { $set: { read: true } }
    );
  },
};
