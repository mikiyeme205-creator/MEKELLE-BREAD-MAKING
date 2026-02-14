cat > server.js << 'EOF'
const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Simple route
app.get('/', (req, res) => {
  res.json({ message: 'Digital Bread API is running!' });
});

app.listen(PORT, () => {
  console.log("Server running on port" + PORT);
});
// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', time: new Date().toISOString() });
});

// MongoDB connection
const uri = process.env.MONGODB_URI;
if (uri) {
  const client = new MongoClient(uri, {
    serverApi: { version: ServerApiVersion.v1, strict: true }
  });
  
  client.connect()
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB error:', err.message));
}

// Start server - NO EMOJIS, PLAIN TEXT ONLY
app.listen(port, () => {
  console.log('Server started on port ' + port);
  console.log('Environment: ' + (process.env.NODE_ENV || 'development'));
});

module.exports = app;
EOF
