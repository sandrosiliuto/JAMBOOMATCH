// api/match.js - Logic for handling matches securely
// This file is designed to be used as a Vercel Serverless Function

import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) return cachedClient;
  const client = await MongoClient.connect(MONGODB_URI);
  cachedClient = client;
  return client;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db("jamboo");
    const { fromId, toId } = req.body;

    if (!fromId || !toId) {
      return res.status(400).json({ error: 'Missing fromId or toId' });
    }

    // 1. Add to likesDados of the sender
    await db.collection("asistentes").updateOne(
      { _id: new ObjectId(fromId) },
      { $addToSet: { likesDados: toId } }
    );

    // 2. Check if the target user has already liked the sender
    const targetUser = await db.collection("asistentes").findOne({ _id: new ObjectId(toId) });
    const isMatch = targetUser && targetUser.likesDados && targetUser.likesDados.includes(fromId);

    return res.status(200).json({ 
      success: true, 
      match: isMatch,
      message: isMatch ? "It's a match!" : "Like recorded" 
    });
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
