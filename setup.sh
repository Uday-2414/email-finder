#!/bin/bash

echo "🚀 Starting Contact Scraper Pro..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Backend installation failed"
    exit 1
fi
cd ..

echo "✅ Backend dependencies installed"
echo ""

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Frontend installation failed"
    exit 1
fi
cd ..

echo "✅ Frontend dependencies installed"
echo ""
echo "🎉 Setup complete!"
echo ""
echo "To start the application:"
echo "  1. In one terminal: cd backend && npm run dev"
echo "  2. In another terminal: cd frontend && npm start"
echo ""
echo "Backend will run on http://localhost:5000"
echo "Frontend will run on http://localhost:3000"
