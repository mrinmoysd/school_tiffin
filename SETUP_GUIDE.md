# School Tiffin Platform - Setup Guide

## 🚀 Quick Start

This guide will help you set up the entire development environment for the School Tiffin Platform.

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v18.19.0 (use nvm or volta)
- **pnpm** v8.15.0 or higher
- **Docker Desktop** (for databases and services)
- **PostgreSQL** 14+ (if not using Docker)
- **Redis** 7+ (if not using Docker)
- **Git**

---

## Step 1: Install Node Version Manager

### Option A: Using Volta (Recommended)

```bash
# Install Volta
curl https://get.volta.sh | bash

# The project will automatically use the correct Node version
```

### Option B: Using nvm

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Use the Node version specified in .nvmrc
nvm use
```

---

## Step 2: Install pnpm

```bash
npm install -g pnpm@8.15.0

# Verify installation
pnpm --version
```

---

## Step 3: Clone and Install

```bash
# Navigate to project directory
cd /path/to/School_Tiffin_Project

# Install all dependencies
pnpm install

# This will install dependencies for:
# - Root workspace
# - Backend (NestJS)
# - Shared packages
# - All workspace packages
```

---

## Step 4: Set Up Environment Variables

```bash
# Copy environment example file
cp apps/backend/.env.example apps/backend/.env

# Edit the .env file with your local configuration
nano apps/backend/.env
```

### Required Environment Variables:

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/schooltiffin

# JWT Secrets (Generate with: openssl rand -base64 32)
JWT_ACCESS_SECRET=your_generated_secret_here
JWT_REFRESH_SECRET=your_generated_secret_here

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Payment Gateway (Use test keys for development)
RAZORPAY_KEY_ID=rzp_test_your_key
RAZORPAY_KEY_SECRET=your_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

---

## Step 5: Start Development Services

### Option A: Using Docker (Recommended)

```bash
# Make script executable
chmod +x scripts/dev-env.sh

# Start all services (PostgreSQL, Redis, MailHog, Redis Commander)
./scripts/dev-env.sh

# Or manually
docker-compose up -d
```

### Option B: Manual Installation

```bash
# Start PostgreSQL
brew services start postgresql@14  # macOS
# or
sudo service postgresql start      # Linux

# Start Redis
brew services start redis          # macOS
# or
sudo service redis-server start    # Linux
```

---

## Step 6: Set Up Database

```bash
# Navigate to backend
cd apps/backend

# Generate Prisma Client
pnpm prisma:generate

# Run initial migration
pnpm migrate:dev

# (Optional) Seed database with sample data
pnpm seed
```

---

## Step 7: Start Development Servers

### Start Backend API

```bash
# From project root
pnpm --filter backend dev

# Or from apps/backend
cd apps/backend
pnpm start:dev
```

The API will be available at:
- **API**: http://localhost:3000
- **API Docs (Swagger)**: http://localhost:3000/api/docs

---

## 📦 Available Commands

### Root Workspace Commands

```bash
pnpm dev            # Start all apps in development mode
pnpm build          # Build all apps
pnpm test           # Run tests for all apps
pnpm lint           # Lint all apps
pnpm format         # Format code with Prettier
pnpm clean          # Clean all node_modules and build artifacts
```

### Backend Commands

```bash
cd apps/backend

pnpm start:dev          # Start in development mode with hot reload
pnpm start:prod         # Start in production mode
pnpm build              # Build the application
pnpm test               # Run tests
pnpm test:cov           # Run tests with coverage
pnpm lint               # Lint code
pnpm prisma:studio      # Open Prisma Studio (Database UI)
pnpm prisma:generate    # Generate Prisma Client
pnpm migrate:dev        # Run migrations in development
pnpm seed               # Seed database with sample data
```

---

## 🐳 Docker Commands

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f postgres
docker-compose logs -f redis

# Restart a service
docker-compose restart backend

# Remove all containers and volumes (WARNING: Deletes all data)
docker-compose down -v
```

---

## 🔧 Development Tools Access

When Docker is running, you can access:

- **PostgreSQL**: `localhost:5432`
  - User: `postgres`
  - Password: `postgres`
  - Database: `schooltiffin`

- **Redis**: `localhost:6379`

- **Redis Commander**: http://localhost:8081
  - Visual UI for Redis

- **MailHog**: http://localhost:8025
  - Email testing interface
  - SMTP: `localhost:1025`

- **Prisma Studio**: Run `pnpm prisma:studio` in backend
  - Database visual editor

---

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:cov

# Run tests in watch mode
pnpm test:watch

# Run E2E tests
pnpm test:e2e
```

---

## 🔍 Linting and Formatting

The project uses ESLint, Prettier, and Husky for code quality.

```bash
# Lint all code
pnpm lint

# Format all code
pnpm format

# Both are run automatically on git commit
```

---

## 📝 Git Commit Convention

This project uses Conventional Commits. Your commit messages must follow this format:

```
<type>(<scope>): <subject>

Examples:
feat(auth): add JWT authentication
fix(subscription): fix schedule generation bug
docs(readme): update setup instructions
chore(deps): update dependencies
```

Valid types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes

---

## 🗄️ Database Management

### Migrations

```bash
# Create a new migration
cd apps/backend
pnpm prisma migrate dev --name your_migration_name

# Apply migrations to production
pnpm migrate:deploy

# View migration status
pnpm migrate:status

# Reset database (WARNING: Deletes all data)
pnpm prisma migrate reset
```

### Backup Database

```bash
# Make backup script executable
chmod +x scripts/backup-db.sh

# Create backup
./scripts/backup-db.sh development

# Backups are stored in backups/ directory
```

---

## 🚨 Troubleshooting

### Port Already in Use

```bash
# Find and kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 pnpm start:dev
```

### Prisma Client Not Generated

```bash
cd apps/backend
pnpm prisma:generate
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps  # if using Docker

# Check connection
psql postgresql://postgres:postgres@localhost:5432/schooltiffin
```

### pnpm Lock Issues

```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

---

## 🌟 VS Code Setup

The project includes VS Code settings and recommended extensions.

1. Open the project in VS Code
2. Install recommended extensions when prompted
3. Settings will be applied automatically

Recommended extensions:
- ESLint
- Prettier
- Prisma
- Docker
- GitLens
- EditorConfig

---

## 📚 Additional Resources

- [Project Overview](./PROJECT_OVERVIEW.md)
- [API Documentation](http://localhost:3000/api/docs) (when running)
- [Database Schema](./LLD/01_Database_Schema_Design.md)
- [Task Breakdown](./TASKS/)

---

## 🆘 Getting Help

If you encounter issues:

1. Check this guide
2. Review error messages carefully
3. Check Docker/service logs
4. Verify environment variables
5. Ensure all prerequisites are installed

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] `pnpm --version` shows v8.15.0+
- [ ] `node --version` shows v18.19.0
- [ ] `docker ps` shows running containers
- [ ] `pnpm --filter backend dev` starts successfully
- [ ] http://localhost:3000 returns health check
- [ ] http://localhost:3000/api/docs shows Swagger UI
- [ ] Database connection works
- [ ] Redis connection works

---

**Setup Complete! Happy Coding! 🚀**
