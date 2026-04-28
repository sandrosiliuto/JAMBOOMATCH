import admin from "firebase-admin";

if (admin.apps.length === 0) {
  admin.initializeApp({
    projectId: "jamboomatch"
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  try {
    const userDoc = await db.collection("asistentes").doc(userId).get();
    const userData = userDoc.data();
    if (!userData) return res.status(404).json({ error: "User not found" });

    const likesGiven = userData.likesDados || [];
    if (likesGiven.length === 0) return res.status(200).json([]);

    const matchesSnapshot = await db.collection("asistentes")
      .where(admin.firestore.FieldPath.documentId(), "in", likesGiven)
      .get();

    const matches = matchesSnapshot.docs
      .map(doc => ({ _id: doc.id, ...doc.data() }))
      .filter((u: any) => u.likesDados?.includes(userId));

    return res.status(200).json(matches);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
