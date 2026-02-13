// backend/test-db.js
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

async function testConnection() {
  console.log('🔍 Testing MongoDB Connection...\n');
  
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ Error: MONGODB_URI not found in .env file!');
    console.log('\n📝 Please create .env file with:');
    console.log('MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/digital_bread');
    process.exit(1);
  }

  // Hide password in logs
  const safeUri = uri.replace(/:([^@]+)@/, ':****@');
  console.log('📌 Using connection string:', safeUri);

  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB server');
    
    await client.db("admin").command({ ping: 1 });
    console.log('✅ Database ping successful');
    
    const db = client.db('digital_bread');
    const collections = await db.listCollections().toArray();
    
    console.log('\n📊 Database Status:');
    console.log(   Name: digital_bread);
    console.log(   Collections: ${collections.length});
    
    if (collections.length > 0) {
      console.log('   Available collections:');
      collections.forEach(c => console.log(   - ${c.name}));
    } else {
      console.log('   ⚠️ No collections found. Create them in MongoDB Atlas UI.');
    }
    
    console.log('\n✨ Connection test successful!');
    
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your password in .env file');
    console.log('2. Verify IP whitelist has 0.0.0.0/0');
    console.log('3. Make sure cluster name is correct');
    console.log('4. Check if database user has proper permissions');
  } finally {
    await client.close();
  }
}

testConnection();
