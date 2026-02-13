// backend/config/database.js
const { MongoClient, ServerApiVersion } = require('mongodb');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    console.log('🔌 Connecting to MongoDB...');
    
    const client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });

    await client.connect();
    await client.db("admin").command({ ping: 1 });
    
    console.log('✅ Successfully connected to MongoDB Atlas!');
    return client;
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    throw error; // Re-throw to handle in server.js
  }
};

module.exports = connectDB;
