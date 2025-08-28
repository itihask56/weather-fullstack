#!/bin/bash

echo "🚀 Weather Dashboard Deployment Script"
echo "======================================"

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo "❌ Error: backend/.env file not found!"
    echo "   Please copy backend/.env.production to backend/.env and update with your API key"
    exit 1
fi

# Check if API key is set
if grep -q "your_weatherapi_key_here" backend/.env; then
    echo "❌ Error: Please update your WEATHER_API_KEY in backend/.env"
    exit 1
fi

echo "✅ Environment configuration validated"

# Install dependencies
echo "📦 Installing dependencies..."
cd backend && npm install --production

# Run setup script
echo "🔧 Running setup..."
npm run build:check

# Start the application
echo "🚀 Starting Weather Dashboard..."
echo "   Access your app at: http://localhost:3001"
echo "   Health check: http://localhost:3001/health"
echo ""
echo "Press Ctrl+C to stop the server"

npm start