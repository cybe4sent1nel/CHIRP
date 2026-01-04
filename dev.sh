#!/bin/bash

# Chirp Development Server - Unified Start Script
# This script starts both client and server concurrently

echo "🚀 Starting Chirp Development Environment..."
echo ""

# Check if node_modules exist in both directories
if [ ! -d "server/node_modules" ]; then
    echo "📦 Installing server dependencies..."
    cd server && npm install && cd ..
fi

if [ ! -d "client/node_modules" ]; then
    echo "📦 Installing client dependencies..."
    cd client && npm install && cd ..
fi

# Check if concurrently is installed globally
if ! command -v concurrently &> /dev/null; then
    echo "📦 Installing concurrently globally..."
    npm install -g concurrently
fi

echo ""
echo "✨ Starting servers..."
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:4000"
echo "📧 Inngest: http://localhost:8288"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Start all three services concurrently
concurrently \
  --names "SERVER,CLIENT,INNGEST" \
  --prefix-colors "cyan,magenta,yellow" \
  "cd server && npm run dev" \
  "cd client && npm run dev" \
  "cd server && npx inngest-cli@latest dev"
