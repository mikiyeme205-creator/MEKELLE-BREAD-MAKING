// backend/server.js - COMPLETE FIXED VERSION
const express = require('express');
require('dotenv').config();
const connectDB = require('./config/database');

const app = express();

// Middleware
app.use(express.json());

// Connect to MongoDB
connectDB().then(client => {
  app.locals.db = client.db('digital_bread');
  app.locals.mongoClient = client;
  console.log('✅ Database connected');
}).catch(err => {
  console.error('❌ Database error:', err);
});

// Routes
app.get('/', (req, res) => {
  res.json({ 
    message: 'Digital Bread Making API',
    status: 'running',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// 🔴 THIS LINE IS CORRECT:
const PORT = process.env.PORT || 5000;  // ← NOTICE THE  OPERATOR!

// Start server
const server = app.listen(PORT, () => {
  console.log(🚀 Server running on port ${PORT});
});

// Graceful shutdown
process.on('SIGINT', () => {
  server.close(() => process.exit(0));
});
