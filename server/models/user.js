import { ObjectId } from "mongodb";
import dbConnection from "../db/connection.js";
import bcrypt from "bcrypt";

const getCollection = () => {
  const db = dbConnection.getDb();
  if (!db) {
    throw new Error("Database connection not established");
  }
  return db.collection("users");
};

export default {
  async create(userData) {
    const usersCollection = getCollection();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    const newUser = {
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      avatar: userData.avatar || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await usersCollection.insertOne(newUser);
    return { ...newUser, _id: result.insertedId, password: undefined };
  },

  async findByEmail(email) {
    const usersCollection = getCollection();
    return await usersCollection.findOne({ email });
  },

  async findById(id) {
    const usersCollection = getCollection();
    return await usersCollection.findOne({ _id: new ObjectId(id) });
  },

  async findByUsername(username) {
    const usersCollection = getCollection();
    return await usersCollection.findOne({ username });
  },

  async list(excludeId = null) {
    const usersCollection = getCollection();
    let query = {};
    if (excludeId) {
      query = { _id: { $ne: new ObjectId(excludeId) } };
    }
    return await usersCollection
      .find(query, { projection: { password: 0 } })
      .toArray();
  },
};
