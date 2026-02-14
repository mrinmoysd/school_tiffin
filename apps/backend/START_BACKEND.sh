#!/bin/bash

# ============================================
# Complete Backend Startup Script
# ============================================

set -e

echo "🚀 Starting School Tiffin Backend..."
echo ""

cd "$(dirname "$0")"

# Step 1: Check if .env exists
if [ ! -f .env ]; then
  echo "⚠️  .env file not found!"
  echo "  Please create .env file (you can copy .env.example)"
  echo "  Required variables:"
  echo "    - DATABASE_URL"
  echo "    - JWT_ACCESS_SECRET"
  echo "    - JWT_REFRESH_SECRET"
  echo "    - REDIS_HOST"
  echo "    - REDIS_PORT"
  echo ""
  read -p "Do you want to create .env from .env.example? (y/n) " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    cp .env.example .env
    echo "✅ Created .env file"
    echo "⚠️  Please edit .env with your configuration before continuing"
    exit 1
  else
    exit 1
  fi
fi

# Step 2: Generate Prisma Client
echo "📦 Generating Prisma Client..."
pnpm prisma:generate

# Step 3: Check if migrations are applied
echo ""
echo "🗄️  Checking database migrations..."
if ! pnpm prisma migrate status 2>&1 | grep -q "Database schema is up to date"; then
  echo "⚠️  Database needs migrations"
  read -p "Run migrations now? (y/n) " -n 1 -r
  echo ""
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    pnpm prisma migrate dev --name init
  else
    echo "⚠️  Skipping migrations - backend may not work correctly"
  fi
fi

# Step 4: Start the development server
echo ""
echo "🚀 Starting development server..."
echo ""
echo "📍 Backend will be available at: http://localhost:3000"
echo "📚 Swagger Docs: http://localhost:3000/api/docs"
echo "🎯 Bull Board (job monitoring): http://localhost:3000/admin/queues"
echo ""

pnpm start:dev
