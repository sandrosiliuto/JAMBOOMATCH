import admin from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: "jamboomatch"
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { nombre, instagram, fotoURL } = req.body;
      const cleanInstagram = instagram.replace('@', '');

      const snapshot = await db.collection("asistentes").where("instagram", "==", cleanInstagram).limit(1).get();
      if (!snapshot.empty) {
        const existing = snapshot.docs[0];
        return res.status(200).json({ _id: existing.id, ...existing.data() });
      }

      const result = await db.collection("asistentes").add({
        nombre,
        instagram: cleanInstagram,
        fotoURL,
        likesDados: [],
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      const newUserDoc = await result.get();
      return res.status(201).json({ _id: newUserDoc.id, ...newUserDoc.data() });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  if (req.method === 'GET') {
    try {
      const { exclude } = req.query;
      const snapshot = await db.collection("asistentes").limit(100).get();
      const users = snapshot.docs
        .map(doc => ({ _id: doc.id, ...doc.data() }))
        .filter(u => u._id !== exclude);
      return res.status(200).json(users);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).end();
}
