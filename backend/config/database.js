const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGODB_URI || "mongodb+srv://mikiyeme205_db_user:DigitalBread2026!@cluster0.vfriurw.mongodb.net/digital_bread?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function connectDB() {
  try {
    // Connect the client to the server
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("✅ Pinged your deployment. You successfully connected to MongoDB!");
    return client;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    process.exit(1);
  }
}

module.exports = { connectDB, client };
