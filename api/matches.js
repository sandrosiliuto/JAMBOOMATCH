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
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  const client = await connectToDatabase();
  const db = client.db("jamboo");

  try {
    const user = await db.collection("asistentes").findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(404).json({ error: "User not found" });

    const matches = await db.collection("asistentes").find({
      likesDados: userId,
      _id: { $in: (user.likesDados || []).map(id => new ObjectId(id)) }
    }).toArray();

    return res.status(200).json(matches);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
