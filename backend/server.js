// backend/server.js
const express = require('express');
require('dotenv').config(); // ← ADD THIS AT THE TOP!
const connectDB = require('./config/database');

const app = express();
app.get('/', (req, res) => {
  res.json({ message: 'Digital Bread API is running!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(Server running on port ${PORT});
});
// Middleware
app.use(express.json());

// Connect to MongoDB
connectDB().then(client => {
  // Make db available to routes
  app.locals.db = client.db('digital_bread');
  app.locals.mongoClient = client;
});

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Digital Bread Making API',
    status: 'running',
    environment: process.env.NODE_ENV,
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
      message: 'Database connected!',
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

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(🚀 Server running on port ${PORT});
  console.log(📝 Environment: ${process.env.NODE_ENV});
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
