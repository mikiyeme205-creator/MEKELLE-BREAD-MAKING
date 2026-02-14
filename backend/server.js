// backend/server.js - COMPLETE FIXED VERSION
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// ✅ CRITICAL: Bind to 0.0.0.0 (required for Render)
const HOST = '0.0.0.0';
const PORT = parseInt(process.env.PORT) || 10000; // Render default is 10000

// Middleware
app.use(cors());
app.use(express.json());

// ✅ FIX: Increase timeout values (prevents 502)
app.use((req, res, next) => {
  res.setTimeout(120000, () => {
    console.log('Request timeout');
    res.status(503).send('Service timeout');
  });
  next();
});

// MongoDB Connection with proper error handling
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      family: 4,
      maxPoolSize: 10,
      minPoolSize: 2
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    // Don't exit - keep server running even if DB fails
    return null;
  }
};

// Connect to database (don't block server start)
connectDB().then(() => {
  console.log('📊 Database connection initialized');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Digital Bread Making API',
    status: 'running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    server: `Listening on ${HOST}:${PORT}`,
    timestamp: new Date().toISOString()
  });
});

// Test database endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database not connected'
      });
    }
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    res.json({
      success: true,
      message: 'Database connected',
      collections: collections.map(c => c.name)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ✅ FIX: Proper server configuration for Render
const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Server is RUNNING!`);
  console.log(`📡 Host: ${HOST}`);
  console.log(`🔌 Port: ${PORT}`);
  console.log(`🌍 URL: http://${HOST}:${PORT}`);
  console.log(`🔗 Public: https://mekelle-bread-making.onrender.com`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// ✅ FIX: Critical - Increase keepAliveTimeout to prevent 502
server.keepAliveTimeout = 120000; // 120 seconds
server.headersTimeout = 120000;    // 120 seconds

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing gracefully...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing gracefully...');
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});
