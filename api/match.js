// api/match.js - Logic for handling matches securely
// This file is designed to be used as a Vercel Serverless Function

import admin from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: "jamboomatch"
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { fromId, toId } = req.body;

    if (!fromId || !toId) {
      return res.status(400).json({ error: 'Missing fromId or toId' });
    }

    // 1. Add to likesDados of the sender
    const senderRef = db.collection("asistentes").doc(fromId);
    await senderRef.update({
      likesDados: admin.firestore.FieldValue.arrayUnion(toId)
    });

    // 2. Check if the target user has already liked the sender
    const targetDoc = await db.collection("asistentes").doc(toId).get();
    const targetData = targetDoc.data();
    const isMatch = targetData?.likesDados?.includes(fromId);

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
