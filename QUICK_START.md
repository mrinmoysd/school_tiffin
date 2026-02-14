# School Tiffin Platform - Quick Start Guide

## ⚡ Get Up and Running in 5 Minutes

This guide gets you from zero to running development environment.

---

## Prerequisites Checklist

- [ ] Node.js v18.19.0 installed (run `node --version`)
- [ ] pnpm installed (run `pnpm --version`)
- [ ] Docker Desktop installed and running
- [ ] Git installed

---

## Step-by-Step Setup

### 1. Install Required Tools (If not installed)

```bash
# Install pnpm
npm install -g pnpm@8.15.0

# Install Node Version Manager (choose one)
# Option A: Volta (Recommended)
curl https://get.volta.sh | bash

# Option B: nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
```

---

### 2. Navigate to Project & Install Dependencies

```bash
# Go to project directory
cd /Users/tanmoybhadra/Documents/Mrinmoy_Work/School_Tiffin_Project

# Install all dependencies (this will take 2-3 minutes)
pnpm install
```

---

### 3. Set Up Environment Variables

```bash
# Copy environment template
cp apps/backend/.env.example apps/backend/.env

# Generate JWT secrets
echo "JWT_ACCESS_SECRET=$(openssl rand -base64 32)" >> apps/backend/.env
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 32)" >> apps/backend/.env
```

**Edit the .env file if needed:**
```bash
nano apps/backend/.env
```

---

### 4. Start Database Services

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Start Docker services (PostgreSQL, Redis, MailHog, Redis Commander)
docker-compose up -d

# Verify services are running
docker-compose ps
```

**Expected output:**
```
NAME                        STATUS
schooltiffin-postgres       Up (healthy)
schooltiffin-redis          Up (healthy)
schooltiffin-mailhog        Up
schooltiffin-redis-commander Up
```

---

### 5. Set Up Database

```bash
# Navigate to backend
cd apps/backend

# Generate Prisma Client
pnpm prisma:generate

# Run database migrations
pnpm migrate:dev

# (Optional) Seed with sample data
pnpm seed
```

---

### 6. Start Development Server

```bash
# From backend directory
pnpm start:dev

# Or from project root
cd ../..
pnpm --filter backend dev
```

**Wait for this message:**
```
🚀 Server is running!

📍 Local:            http://localhost:3000
📚 API Docs:         http://localhost:3000/api/docs
🌍 Environment:      development
📦 API Version:      v1
```

---

### 7. Verify Everything Works

Open your browser and visit:

1. **API Health Check**: http://localhost:3000
   - Should return: `{"status":"ok","message":"School Tiffin Platform API is running"}`

2. **API Documentation**: http://localhost:3000/api/docs
   - Should show Swagger UI

3. **MailHog (Email Testing)**: http://localhost:8025
   - Email testing interface

4. **Redis Commander**: http://localhost:8081
   - Redis database UI

---

## 🎉 You're Done!

Your development environment is now ready!

---

## Common Commands

### Development
```bash
# Start backend API
pnpm --filter backend dev

# Start all services
pnpm dev

# Run tests
pnpm --filter backend test

# View logs
docker-compose logs -f
```

### Database
```bash
# Open Prisma Studio (Database UI)
cd apps/backend && pnpm prisma:studio

# Create new migration
pnpm migrate:dev --name your_migration_name

# View migration status
pnpm migrate:status
```

### Docker
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart a service
docker-compose restart postgres

# View logs
docker-compose logs -f postgres
```

---

## Troubleshooting

### "Port 3000 already in use"
```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 pnpm start:dev
```

### "Cannot connect to database"
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Restart PostgreSQL
docker-compose restart postgres

# Check the DATABASE_URL in .env
cat apps/backend/.env | grep DATABASE_URL
```

### "Prisma Client not generated"
```bash
cd apps/backend
pnpm prisma:generate
```

### "pnpm: command not found"
```bash
npm install -g pnpm@8.15.0
```

---

## Next Steps

1. ✅ Read the [Complete Setup Guide](./SETUP_GUIDE.md)
2. ✅ Review [Project Overview](./PROJECT_OVERVIEW.md)
3. ✅ Check [API Documentation](http://localhost:3000/api/docs)
4. ✅ Read the [Validation Reports](./VALIDATION/)
5. ✅ Start building! 🚀

---

## Project Structure

```
School_Tiffin_Project/
├── apps/
│   ├── backend/          # NestJS API
│   ├── mobile/           # React Native (to be added)
│   └── admin/            # React Admin Panel (to be added)
├── packages/
│   ├── shared-types/     # Shared TypeScript types
│   └── config/           # Shared configurations
├── scripts/              # Helper scripts
├── docs/                 # Documentation
├── LLD/                  # Low-Level Design documents
├── TASKS/                # Task breakdowns
└── VALIDATION/           # Validation reports
```

---

## Available Services

When Docker is running:

| Service | URL/Port | Credentials |
|---------|----------|-------------|
| Backend API | http://localhost:3000 | - |
| API Docs | http://localhost:3000/api/docs | - |
| PostgreSQL | localhost:5432 | postgres/postgres |
| Redis | localhost:6379 | - |
| Redis Commander | http://localhost:8081 | - |
| MailHog UI | http://localhost:8025 | - |
| MailHog SMTP | localhost:1025 | - |

---

## Support

If you encounter issues:

1. Check this guide first
2. Review [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions
3. Check Docker logs: `docker-compose logs -f`
4. Verify environment variables in `.env`

---

**Happy Coding! 🎉**
