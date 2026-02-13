// backend/server.js
const express = require('express');
require('dotenv').config(); // Load environment variables
const connectDB = require('./config/database');

const app = express();

// ✅ MIDDLEWARE - Must come BEFORE routes!
app.use(express.json());

// ✅ VARIABLES - Fixed operator
const PORT = process.env.PORT  5000;  // ← Added 

// ✅ CONNECT TO DATABASE
let dbClient = null;

connectDB().then(client => {
  dbClient = client;
  app.locals.db = client.db('digital_bread');
  app.locals.mongoClient = client;
  console.log('✅ Database connected and ready');
}).catch(err => {
  console.error('❌ Database connection failed:', err.message);
  // Don't exit - API can still run for testing
});

// ✅ ROUTES
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
    if (!app.locals.db) {
      return res.status(503).json({ 
        success: false, 
        error: 'Database not connected yet',
        message: 'Please wait a few seconds and try again'
      });
    }
    
    const db = app.locals.db;
    const collections = await db.listCollections().toArray();
    res.json({
      success: true,
      message: '✅ Database connected!',
      collections: collections.map(c => c.name),
      database: 'digital_bread'
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Health check endpoint (for Render)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// ✅ START SERVER - Fixed template literals
const server = app.listen(PORT, () => {
  console.log(🚀 Server running on port ${PORT});  // ← Fixed backticks
  console.log(📝 Environment: ${process.env.NODE_ENV || 'development'});
  console.log(🔗 Local: http://localhost:${PORT});
  console.log(🔗 Test: http://localhost:${PORT}/api/test-db);
});

// ✅ GRACEFUL SHUTDOWN - Fixed template literals
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
  console.error('❌ Unhandled Rejection:', err);
  // Don't exit, just log
});
