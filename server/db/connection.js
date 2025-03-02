import { MongoClient, ServerApiVersion } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri = process.env.ATLAS_URI;
if (!uri) {
  console.error("ERROR: ATLAS_URI environment variable is not set");
  process.exit(1);
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

let db;

async function connectToDatabase() {
  try {
    // Connect the client to the server
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      `Pinged your deployment. You successfully connected to MongoDB!`
    );

    db = client.db("CipherTalkDb");
  } catch (err) {
    console.error("Database connection error:", err);
    process.exit(1);
  }
}

// Initialize connection
connectToDatabase();

export default { getDb: () => db, client };
