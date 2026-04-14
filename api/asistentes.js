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
  const client = await connectToDatabase();
  const db = client.db("jamboo");

  if (req.method === 'POST') {
    const { nombre, instagram, fotoURL } = req.body;
    const existing = await db.collection("asistentes").findOne({ instagram });
    if (existing) return res.status(200).json(existing);

    const result = await db.collection("asistentes").insertOne({
      nombre,
      instagram,
      fotoURL,
      likesDados: [],
      createdAt: new Date()
    });
    const newUser = await db.collection("asistentes").findOne({ _id: result.insertedId });
    return res.status(201).json(newUser);
  }

  if (req.method === 'GET') {
    const { exclude } = req.query;
    const query = exclude ? { _id: { $ne: new ObjectId(exclude) } } : {};
    const users = await db.collection("asistentes").find(query).limit(100).toArray();
    return res.status(200).json(users);
  }

  return res.status(405).end();
}
