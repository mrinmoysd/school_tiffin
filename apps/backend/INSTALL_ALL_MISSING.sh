#!/bin/bash

# ============================================
# Install All Missing Backend Dependencies
# ============================================

set -e  # Exit on error

echo "🔧 Installing all missing backend dependencies..."
echo ""

cd "$(dirname "$0")"

# Core dependencies
echo "📦 Installing date-fns (required for AdminService, SubscriptionEngine)..."
pnpm add date-fns

echo "📦 Installing Razorpay SDK..."
pnpm add razorpay

echo "📦 Installing Firebase Admin SDK..."
pnpm add firebase-admin

echo "📦 Installing AWS SDK for S3..."
pnpm add @aws-sdk/client-s3

echo "📦 Installing Bull Board for job monitoring..."
pnpm add @bull-board/api @bull-board/nestjs @bull-board/express

echo "📦 Installing UUID..."
pnpm add uuid

echo "📦 Installing Nodemailer (Email)..."
pnpm add nodemailer

echo "📦 Installing Twilio (SMS)..."
pnpm add twilio

echo ""
echo "📦 Installing dev dependencies..."
pnpm add -D @types/multer @types/uuid @types/nodemailer

echo ""
echo "✅ All dependencies installed successfully!"
echo ""
echo "📋 Next steps:"
echo "  1. Run: pnpm prisma:generate"
echo "  2. Run: pnpm prisma migrate dev"
echo "  3. Run: pnpm start:dev"
echo ""
