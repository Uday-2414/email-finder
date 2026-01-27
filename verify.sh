#!/bin/bash

echo "🔍 Verifying Contact Scraper Installation..."
echo ""

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js: $NODE_VERSION"
else
    echo "❌ Node.js not found"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo "✅ npm: $NPM_VERSION"
else
    echo "❌ npm not found"
    exit 1
fi

echo ""
echo "Checking backend dependencies..."

if [ -d "backend/node_modules" ]; then
    echo "✅ Backend dependencies installed"
else
    echo "⚠️  Backend dependencies not installed"
    echo "   Run: cd backend && npm install"
fi

echo ""
echo "Checking frontend dependencies..."

if [ -d "frontend/node_modules" ]; then
    echo "✅ Frontend dependencies installed"
else
    echo "⚠️  Frontend dependencies not installed"
    echo "   Run: cd frontend && npm install"
fi

echo ""
echo "Checking file structure..."

FILES=(
    "backend/server.js"
    "backend/package.json"
    "backend/.env"
    "frontend/package.json"
    "frontend/public/index.html"
    "frontend/src/App.js"
)

MISSING=0
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file"
        MISSING=$((MISSING + 1))
    fi
done

echo ""
if [ $MISSING -eq 0 ]; then
    echo "✅ All files present!"
else
    echo "⚠️  $MISSING files missing"
fi

echo ""
echo "🎉 Verification complete!"
