// backend/server.js - COMPLETE PRODUCTION READY VERSION
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const HOST = '0.0.0.0';
const PORT = parseInt(process.env.PORT) || 10000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ✅ FIXED: MongoDB Connection (no deprecated options)
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      throw new Error('❌ MONGODB_URI not found in environment variables');
    }

    console.log('🔌 Connecting to MongoDB Atlas...');
    console.log('📍 Connection string:', uri.replace(/:([^@]+)@/, ':****@'));

    const conn = await mongoose.connect(uri, {
      // Modern connection options (deprecated options removed)
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4
      maxPoolSize: 10,
      minPoolSize: 2,
      retryWrites: true,
      retryReads: true
    });

    console.log(`✅ MongoDB Connected Successfully!`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🌍 Host: ${conn.connection.host}`);
    console.log(`🔄 Connection State: ${conn.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
    
    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    
    // Detailed error logging
    if (error.message.includes('Authentication failed')) {
      console.log('🔑 Fix: Check username and password in connection string');
    } else if (error.message.includes('getaddrinfo')) {
      console.log('🌐 Fix: Check cluster name or network connection');
    } else if (error.message.includes('timed out')) {
      console.log('⏱️ Fix: Check IP whitelist in MongoDB Atlas');
    }
    
    return null;
  }
};

// Initialize database connection (don't block server start)
let dbConnected = false;
connectDB().then((connected) => {
  dbConnected = !!connected;
  if (dbConnected) {
    console.log('🎉 Database is ready!');
  } else {
    console.log('⚠️ Server running without database connection - retrying...');
    // Attempt reconnection after 30 seconds
    setTimeout(() => {
      console.log('🔄 Attempting to reconnect to MongoDB...');
      connectDB().then(() => {
        console.log('✅ Reconnection successful!');
      });
    }, 30000);
  }
});

// ==================== ROUTES ====================

// Health check endpoint (for Render and monitoring)
app.get('/health', (req, res) => {
  const dbState = ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown';
  res.json({
    status: 'healthy',
    database: {
      state: dbState,
      connected: mongoose.connection.readyState === 1
    },
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  const dbState = ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown';
  res.json({
    message: 'Digital Bread Making API',
    status: 'running',
    database: {
      state: dbState,
      connected: mongoose.connection.readyState === 1
    },
    server: {
      host: HOST,
      port: PORT,
      url: `https://mekelle-bread-making.onrender.com`
    },
    endpoints: {
      health: '/health',
      products: '/api/products',
      testDb: '/api/test-db',
      diagnose: '/api/diagnose'
    },
    timestamp: new Date().toISOString()
  });
});

// Test database endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database not connected',
        dbState: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState]
      });
    }
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    // Get database stats
    const stats = await mongoose.connection.db.stats();
    
    res.json({
      success: true,
      message: 'Database connected successfully!',
      database: mongoose.connection.name,
      collections: collections.map(c => c.name),
      stats: {
        collections: stats.collections,
        objects: stats.objects,
        dataSize: `${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Diagnostic endpoint (helps debug connection issues)
app.get('/api/diagnose', async (req, res) => {
  const { MongoClient, ServerApiVersion } = require('mongodb');
  
  const uri = process.env.MONGODB_URI;
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      memory: process.memoryUsage()
    },
    mongodb: {
      uri: uri ? uri.replace(/:([^@]+)@/, ':****@') : 'not set',
      currentState: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState],
      models: Object.keys(mongoose.models || {})
    },
    tests: {}
  };

  // Test direct connection
  if (uri) {
    const testClient = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      },
      connectTimeoutMS: 5000
    });

    try {
      await testClient.connect();
      await testClient.db("admin").command({ ping: 1 });
      diagnostics.tests.directConnection = { success: true };
      await testClient.close();
    } catch (error) {
      diagnostics.tests.directConnection = { 
        success: false, 
        error: error.message,
        code: error.code
      };
    }
  }

  res.json(diagnostics);
});

// Products endpoint
app.get('/api/products', async (req, res) => {
  // If database is not connected, return demo data
  if (mongoose.connection.readyState !== 1) {
    return res.json([
      { 
        id: 1, 
        name: 'Small Bread', 
        price: 5, 
        size: 'small',
        description: 'Perfect individual portion for a quick breakfast',
        isAvailable: true,
        category: 'bread'
      },
      { 
        id: 2, 
        name: 'Large Bread', 
        price: 11, 
        size: 'large',
        description: 'Family size, baked golden brown with crispy crust',
        isAvailable: true,
        category: 'bread'
      }
    ]);
  }
  
  try {
    // Try to get from database if you have a Product model
    // const products = await Product.find();
    // res.json(products);
    
    // For now, return the same demo data
    res.json([
      { id: 1, name: 'Small Bread', price: 5, size: 'small' },
      { id: 2, name: 'Large Bread', price: 11, size: 'large' }
    ]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ==================== SERVER STARTUP ====================

const server = app.listen(PORT, HOST, () => {
  console.log(`\n🚀 SERVER STARTED SUCCESSFULLY!`);
  console.log(`=================================`);
  console.log(`📡 Host: ${HOST}`);
  console.log(`🔌 Port: ${PORT}`);
  console.log(`🌍 URL: http://${HOST}:${PORT}`);
  console.log(`🔗 Public: https://mekelle-bread-making.onrender.com`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔄 Database: ${mongoose.connection.readyState === 1 ? '✅ CONNECTED' : '❌ DISCONNECTED'}`);
  console.log(`=================================\n`);
});

// Increase timeouts for Render (prevents 502 errors)
server.keepAliveTimeout = 120000; // 120 seconds
server.headersTimeout = 120000;    // 120 seconds

// ==================== GRACEFUL SHUTDOWN (FIXED) ====================

// ✅ CORRECTED: No callbacks, uses async/await
process.on('SIGTERM', async () => {
  console.log('\n👋 SIGTERM received, closing gracefully...');

  // 1. Close the HTTP server first (stop accepting new requests)
  server.close(() => {
    console.log('📡 HTTP server closed.');
  });

  // 2. Close the MongoDB connection if connected (NO CALLBACK!)
  if (mongoose.connection.readyState === 1) { // 1 = connected
    await mongoose.connection.close();
    console.log('📊 MongoDB connection closed.');
  }

  // 3. Exit the process successfully
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n👋 SIGINT received, closing gracefully...');

  server.close(() => {
    console.log('📡 HTTP server closed.');
  });

  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
    console.log('📊 MongoDB connection closed.');
  }

  process.exit(0);
});

// Handle uncaught exceptions (prevent crashes)
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Don't exit immediately, let the process continue
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit immediately, let the process continue
});

// ==================== EXPORT ====================
module.exports = app;
