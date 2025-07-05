#!/bin/bash

# Cymatics Backend Setup Script
echo "🎬 Setting up Cymatics Backend..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm version: $(npm -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update the .env file with your configuration before starting the server"
else
    echo "✅ .env file already exists"
fi

# Generate Prisma client
echo "🗄️  Generating Prisma client..."
npm run db:generate

if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma client"
    exit 1
fi

echo "✅ Prisma client generated successfully"

# Create uploads directory
if [ ! -d "uploads" ]; then
    echo "📁 Creating uploads directory..."
    mkdir -p uploads
    echo "✅ Uploads directory created"
fi

# Create logs directory
if [ ! -d "logs" ]; then
    echo "📁 Creating logs directory..."
    mkdir -p logs
    echo "✅ Logs directory created"
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update your .env file with the correct database URL and other settings"
echo "2. Make sure PostgreSQL is running on port 5433"
echo "3. Run 'npm run db:push' to create the database schema"
echo "4. Run 'npm run db:seed' to populate with sample data (optional)"
echo "5. Run 'npm run dev' to start the development server"
echo ""
echo "🔗 Useful commands:"
echo "  npm run dev          - Start development server"
echo "  npm run build        - Build for production"
echo "  npm run start        - Start production server"
echo "  npm run db:studio    - Open Prisma Studio"
echo "  npm test             - Run tests"
echo ""
echo "📚 Documentation: http://localhost:3000/api"
echo "🏥 Health check: http://localhost:3000/health"
