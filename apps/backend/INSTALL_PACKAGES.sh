#!/bin/bash

echo "📦 Installing all Week 1 packages for School Tiffin Backend..."

# Navigate to backend directory
cd "$(dirname "$0")"

echo "1️⃣ Installing authentication packages..."
pnpm add @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt

echo "2️⃣ Installing security packages..."
pnpm add @nestjs/throttler helmet

echo "3️⃣ Installing logging packages..."
pnpm add nestjs-pino pino-http pino-pretty

echo "4️⃣ Installing health check packages..."
pnpm add @nestjs/terminus

echo "5️⃣ Installing dev dependencies..."
pnpm add -D @types/passport-jwt @types/bcrypt @types/compression

echo ""
echo "✅ All packages installed successfully!"
echo ""
echo "Next steps:"
echo "1. Restart your dev server: pnpm start:dev"
echo "2. Let the AI continue with implementation"
