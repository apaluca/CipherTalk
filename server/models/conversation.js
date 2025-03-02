import { ObjectId } from "mongodb";
import db from "../db/connection.js";

const getCollection = () => {
  const db = dbConnection.getDb();
  if (!db) {
    throw new Error("Database connection not established");
  }
  return db.collection("conversations");
};

export default {
  async create(participants) {
    const conversationsCollection = getCollection();
    const newConversation = {
      participants: participants.map((id) => new ObjectId(id)),
      createdAt: new Date(),
      updatedAt: new Date(),
      lastMessage: null,
    };

    const result = await conversationsCollection.insertOne(newConversation);
    return { ...newConversation, _id: result.insertedId };
  },

  async findById(id) {
    const conversationsCollection = getCollection();
    return await conversationsCollection.findOne({ _id: new ObjectId(id) });
  },

  async findByParticipants(participants) {
    const conversationsCollection = getCollection();
    const participantIds = participants.map((id) => new ObjectId(id));
    return await conversationsCollection.findOne({
      participants: { $all: participantIds, $size: participantIds.length },
    });
  },

  async listByUserId(userId) {
    const conversationsCollection = getCollection();
    return await conversationsCollection
      .find({
        participants: new ObjectId(userId),
      })
      .toArray();
  },

  async updateLastMessage(id, messageData) {
    const conversationsCollection = getCollection();
    await conversationsCollection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          lastMessage: messageData,
          updatedAt: new Date(),
        },
      }
    );
  },
};
