#!/bin/bash

echo "🚀 Starting School Tiffin Platform Development Environment"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker Desktop."
  exit 1
fi

# Start services
echo "📦 Starting services..."
docker-compose up -d

# Wait for services
echo "⏳ Waiting for services to be healthy..."
sleep 5
docker-compose ps

# Show access URLs
echo ""
echo "✅ Development environment is ready!"
echo ""
echo "📍 Access Points:"
echo "  Backend API:        http://localhost:3000"
echo "  API Docs:           http://localhost:3000/api/docs"
echo "  Admin Panel:        http://localhost:3001"
echo "  PostgreSQL:         localhost:5432"
echo "  Redis:              localhost:6379"
echo "  Redis Commander:    http://localhost:8081"
echo "  MailHog UI:         http://localhost:8025"
echo ""
echo "📝 Logs: docker-compose logs -f [service-name]"
echo "🛑 Stop: docker-compose down"
