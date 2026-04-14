import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
const MONGODB_URI = process.env.MONGODB_URI || "";

app.use(express.json({ limit: '10mb' })); // Increase limit for base64 photos

let client: MongoClient;
async function getDb() {
  if (!client) {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
  }
  return client.db("jamboo");
}

async function startServer() {
  // API Routes
  
  // Register or Login
  app.post("/api/asistentes", async (req, res) => {
    try {
      const db = await getDb();
      const { nombre, instagram, fotoURL } = req.body;
      
      // Check if already exists by instagram
      const existing = await db.collection("asistentes").findOne({ instagram });
      if (existing) {
        return res.json(existing);
      }

      const result = await db.collection("asistentes").insertOne({
        nombre,
        instagram,
        fotoURL, // Base64 string
        likesDados: [],
        createdAt: new Date()
      });

      const newUser = await db.collection("asistentes").findOne({ _id: result.insertedId });
      res.json(newUser);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error registering user" });
    }
  });

  // Get all users (for swiping)
  app.get("/api/asistentes", async (req, res) => {
    try {
      const db = await getDb();
      const { exclude } = req.query;
      const query = exclude ? { _id: { $ne: new ObjectId(exclude as string) } } : {};
      const users = await db.collection("asistentes").find(query).limit(100).toArray();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: "Error fetching users" });
    }
  });

  // Like a user
  app.post("/api/match", async (req, res) => {
    try {
      const db = await getDb();
      const { fromId, toId } = req.body;

      // Add to likesDados
      await db.collection("asistentes").updateOne(
        { _id: new ObjectId(fromId) },
        { $addToSet: { likesDados: toId } }
      );

      // Check for mutual match
      const targetUser = await db.collection("asistentes").findOne({ _id: new ObjectId(toId) });
      const isMatch = targetUser?.likesDados?.includes(fromId);

      res.json({ match: isMatch });
    } catch (error) {
      res.status(500).json({ error: "Error processing match" });
    }
  });

  // Get matches
  app.get("/api/matches", async (req, res) => {
    try {
      const db = await getDb();
      const { userId } = req.query;
      if (!userId) return res.status(400).json({ error: "Missing userId" });
      
      const user = await db.collection("asistentes").findOne({ _id: new ObjectId(userId as string) });
      if (!user) return res.status(404).json({ error: "User not found" });

      const likesReceived = await db.collection("asistentes").find({
        likesDados: userId,
        _id: { $in: (user.likesDados || []).map((id: string) => new ObjectId(id)) }
      }).toArray();

      res.json(likesReceived);
    } catch (error) {
      res.status(500).json({ error: "Error fetching matches" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
