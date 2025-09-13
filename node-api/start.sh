#!/bin/bash

# SQLMap BullMQ Proxy Startup Script

set -e

echo "🚀 Starting SQLMap BullMQ Proxy..."

# Check if Redis is running
echo "📊 Checking Redis connection..."
if ! redis-cli ping > /dev/null 2>&1; then
    echo "❌ Redis is not running. Please start Redis first:"
    echo "   brew services start redis  # macOS"
    echo "   sudo systemctl start redis # Linux"
    echo "   docker run -d -p 6379:6379 redis:alpine # Docker"
    exit 1
fi
echo "✅ Redis is running"

# Check if SQLMap API is running
echo "🔗 Checking SQLMap API connection..."
if ! curl -s http://localhost:8775/version > /dev/null 2>&1; then
    echo "❌ SQLMap API is not running. Please start it first:"
    echo "   python sqlmapapi.py -s -H 0.0.0.0 -p 8775"
    echo "   or use Docker: docker run -d -p 8775:8775 sqlmap/sqlmap:latest"
    exit 1
fi
echo "✅ SQLMap API is running"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start the application
echo "🎯 Starting NestJS application..."
npm run start:dev
