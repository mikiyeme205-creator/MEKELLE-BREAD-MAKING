// backend/server.js - COMPLETE FIXED VERSION
const express = require('express');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();

// Middleware
app.use(express.json());

// MongoDB Connection Function
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      throw new Error('MONGODB_URI not found in environment variables');
    }

    console.log('🔌 Connecting to MongoDB Atlas...');
    
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
    process.exit(1);
  }
};

// Connect to MongoDB
connectDB().then(client => {
  app.locals.db = client.db('digital_bread');
  app.locals.mongoClient = client;
  console.log('📊 Database: digital_bread');
});

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Digital Bread Making API',
    status: 'running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Test database route
app.get('/api/test-db', async (req, res) => {
  try {
    const db = app.locals.db;
    const collections = await db.listCollections().toArray();
    res.json({
      success: true,
      message: 'Database connected successfully!',
      collections: collections.map(c => c.name),
      database: 'digital_bread'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ✅ FIXED: Correct PORT declaration (LINE 68)
const PORT = process.env.PORT || 5000;

// ✅ FIXED: Correct console.log with backticks (LINE 71)
const server = app.listen(PORT, () => {
  console.log(🚀 Server running on port ${PORT});
  console.log(📝 Environment: ${process.env.NODE_ENV || 'development'});
  console.log(🔗 Local: http://localhost:${PORT});
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down gracefully...');
  if (app.locals.mongoClient) {
    await app.locals.mongoClient.close();
    console.log('📊 MongoDB connection closed');
  }
  server.close(() => {
    console.log('🛑 Server stopped');
    process.exit(0);
  });
});
