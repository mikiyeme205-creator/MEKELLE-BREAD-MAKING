// backend/server.js
const express = require('express');
require('dotenv').config(); // Load environment variables
const connectDB = require('./config/database');

const app = express();

// Middleware
app.use(express.json());

// Connect to MongoDB
connectDB().then(client => {
  // Make db available to routes
  app.locals.db = client.db('digital_bread');
  app.locals.mongoClient = client;
  console.log('✅ Database connection established');
}).catch(err => {
  console.error('❌ Failed to connect to database:', err);
});

// Root route
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
    if (!db) {
      return res.status(500).json({ 
        success: false, 
        error: 'Database not connected' 
      });
    }
    
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// 🔴 FIXED LINE - This was the error!
const PORT = process.env.PORT  5000;  // ← CORRECT: uses  not just space

// Start server
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

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  server.close(() => process.exit(1));
});
