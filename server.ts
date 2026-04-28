import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

// Initialize Firebase Admin
// Note: In production, you'd use a service account. 
// For this applet, we initialize with minimal config and rely on environment or project default.
if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: "jamboomatch",
    // credential: admin.credential.applicationDefault() // This is the standard way on GCP
  });
}

const db = admin.firestore();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' })); // Base64 photos can be large

// API Routes

// Register or Login
app.post("/api/asistentes", async (req, res) => {
  try {
    const { nombre, instagram, fotoURL } = req.body;
    const cleanInstagram = instagram.replace('@', '');
    
    // Check if already exists
    const snapshot = await db.collection("asistentes").where("instagram", "==", cleanInstagram).limit(1).get();
    
    if (!snapshot.empty) {
      const existing = snapshot.docs[0];
      return res.json({ _id: existing.id, ...existing.data() });
    }

    const docRef = await db.collection("asistentes").add({
      nombre,
      instagram: cleanInstagram,
      fotoURL, // Base64 string
      likesDados: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ _id: docRef.id, nombre, instagram: cleanInstagram, fotoURL });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error registering user" });
  }
});

// Get all users
app.get("/api/asistentes", async (req, res) => {
  try {
    const { exclude } = req.query;
    const snapshot = await db.collection("asistentes").limit(100).get();
    
    const users = snapshot.docs
      .map(doc => ({ _id: doc.id, ...doc.data() }))
      .filter((u: any) => u._id !== exclude);
      
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Error fetching users" });
  }
});

// Like a user
app.post("/api/match", async (req, res) => {
  try {
    const { fromId, toId } = req.body;

    // 1. Add to likesDados of sender
    const senderRef = db.collection("asistentes").doc(fromId);
    await senderRef.update({
      likesDados: admin.firestore.FieldValue.arrayUnion(toId)
    });

    // 2. Check for mutual match
    const targetDoc = await db.collection("asistentes").doc(toId).get();
    const targetData = targetDoc.data();
    const isMatch = targetData?.likesDados?.includes(fromId);

    res.json({ match: isMatch });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error processing match" });
  }
});

// Get matches
app.get("/api/matches", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "Missing userId" });
    
    const userDoc = await db.collection("asistentes").doc(userId as string).get();
    const userData = userDoc.data();
    if (!userData) return res.status(404).json({ error: "User not found" });

    const likesGiven = userData.likesDados || [];
    if (likesGiven.length === 0) return res.json([]);

    // Find users who liked back
    const matchesSnapshot = await db.collection("asistentes")
      .where(admin.firestore.FieldPath.documentId(), "in", likesGiven)
      .get();

    const matches = matchesSnapshot.docs
      .map(doc => ({ _id: doc.id, ...doc.data() }))
      .filter((u: any) => u.likesDados?.includes(userId));

    res.json(matches);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error fetching matches" });
  }
});

// Vite middleware
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
