// backend/config/database.js
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config(); // ← ADD THIS LINE!

const connectDB = async () => {
  try {
    // Get URI from environment variables
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      throw new Error('❌ MONGODB_URI not found in .env file!');
    }

    console.log('🔌 Connecting to MongoDB...');
    
    const client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    });

    // Connect to MongoDB
    await client.connect();
    
    // Ping database to confirm connection
    await client.db("admin").command({ ping: 1 });
    
    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log(📊 Database: digital_bread);
    console.log(🌍 Cluster: ${uri.split('@')[1].split('/')[0]});
    
    return client;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if .env file exists in backend folder');
    console.log('2. Verify MONGODB_URI in .env is correct');
    console.log('3. Check password in connection string');
    console.log('4. Verify IP whitelist includes 0.0.0.0/0');
    process.exit(1);
  }
};

module.exports = connectDB;
