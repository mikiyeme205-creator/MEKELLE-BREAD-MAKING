#!/bin/bash
# setup.sh - Quick environment setup

echo "🔧 Setting up Digital Bread Making Backend..."
echo ""

# Check if .env exists
if [ -f .env ]; then
    echo "⚠️  .env file already exists. Overwrite? (y/n)"
    read answer
    if [ "$answer" != "y" ]; then
        echo "❌ Setup cancelled"
        exit 1
    fi
fi

# Create .env file
cat > .env << EOF
# Digital Bread Making Backend Configuration
# Created: $(date)

# MongoDB Connection (REPLACE WITH YOUR VALUES!)
MONGODB_URI=mongodb+srv://mikiyeme205_db_user:DigitalBread2026!@cluster0.vfriurw.mongodb.net/digital_bread?retryWrites=true&w=majority&appName=Cluster0

# JWT Secret
JWT_SECRET=$(openssl rand -hex 32)

# Server
PORT=5000
NODE_ENV=development
EOF

echo "✅ .env file created successfully!"
echo ""
echo "📁 File location: $(pwd)/.env"
echo ""
echo "📝 Next steps:"
echo "1. Review the .env file and update if needed"
echo "2. Run 'npm install' to install dependencies"
echo "3. Run 'node server.js' starts your node.js server"
echo "4. Run 'npm run dev' to start development server"
