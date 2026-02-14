#!/bin/bash

echo "🚀 Starting School Tiffin Backend..."

# Navigate to backend directory
cd apps/backend

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit apps/backend/.env and add your configuration"
    exit 1
fi

# Generate Prisma Client if needed
echo "📦 Ensuring Prisma Client is generated..."
pnpm prisma:generate > /dev/null 2>&1

# Start the development server
echo "✅ Starting backend server..."
echo ""
pnpm start:dev
