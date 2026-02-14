# ✅ Backend Validation & Startup Guide

**Status**: All modules implemented and ready to run  
**Date**: February 10, 2026

---

## 📋 Pre-Flight Checklist

### 1. **Clean Build Artifacts** (IMPORTANT)

The `.d.ts`, `.d.ts.map`, and `.js.map` files in your `src/` folder are **build artifacts** from previous compilations. They should NOT be in `src/` - they belong in `dist/`.

**Clean them up:**

```bash
cd /Users/tanmoybhadra/Documents/Mrinmoy_Work/School_Tiffin_Project/apps/backend

# Remove all .d.ts, .d.ts.map, .js, and .js.map files from src/
find src -type f \( -name "*.d.ts" -o -name "*.d.ts.map" -o -name "*.js" -o -name "*.js.map" \) -delete

# Verify they're gone
find src -type f \( -name "*.d.ts" -o -name "*.js" \) | head -20
```

This is safe and recommended. These files will be regenerated in `dist/` when you run `pnpm build`.

---

### 2. **Verify Dependencies**

All packages should already be installed. Let's verify:

```bash
cd apps/backend

# Check critical packages
pnpm list date-fns
pnpm list razorpay
pnpm list firebase-admin
pnpm list @aws-sdk/client-s3
pnpm list @bull-board/nestjs
pnpm list @nestjs/bull
```

**If any are missing**, install them:

```bash
# Install any missing packages
pnpm add date-fns
pnpm add razorpay
pnpm add firebase-admin
pnpm add @aws-sdk/client-s3
pnpm add @bull-board/api @bull-board/nestjs @bull-board/express
pnpm add uuid
pnpm add nodemailer twilio

# Dev dependencies
pnpm add -D @types/multer @types/uuid @types/nodemailer
```

---

### 3. **Environment Configuration**

**Copy the example file:**

```bash
cd apps/backend
cp .env.example .env
```

**Edit `.env` with your values:**

```env
# Critical - Must configure these first:
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/school_tiffin_db?schema=public"

JWT_ACCESS_SECRET=change-this-to-a-random-32-char-string
JWT_REFRESH_SECRET=change-this-to-another-random-32-char-string

REDIS_HOST=localhost
REDIS_PORT=6379

# Optional (for full functionality):
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxx

# Firebase FCM (for push notifications)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com

# AWS S3 (for file uploads)
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_REGION=us-east-1
AWS_S3_BUCKET=school-tiffin-uploads

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# SMS (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

---

### 4. **Start Infrastructure Services**

**Using Docker Compose (Recommended):**

```bash
cd /Users/tanmoybhadra/Documents/Mrinmoy_Work/School_Tiffin_Project

# Start PostgreSQL, Redis, MailHog, Redis Commander
docker-compose up -d

# Check services are running
docker-compose ps
```

**Or manually start services if not using Docker:**

- PostgreSQL on port 5432
- Redis on port 6379

---

### 5. **Database Setup**

```bash
cd apps/backend

# Generate Prisma Client
pnpm prisma:generate

# Run migrations
pnpm prisma migrate dev --name init

# (Optional) Open Prisma Studio to verify
pnpm prisma:studio
```

---

## 🚀 Start the Backend

### Development Mode (with hot-reload):

```bash
cd apps/backend

# Start the development server
pnpm start:dev
```

**Expected output:**

```
🚀 Server is running!

📍 Local:            http://localhost:3000
📚 API Docs:         http://localhost:3000/api/docs
🌍 Environment:      development
📦 API Version:      v1
```

### Alternative: Debug Mode

```bash
pnpm start:debug
```

---

## 📖 Access Swagger Documentation

Once the server is running:

**URL**: `http://localhost:3000/api/docs`

### What you'll see:

✅ **15 API Tags**:
- Health
- Auth
- Users
- Students
- Schools
- Meal Plans
- Menu Items (NEW)
- Subscriptions
- Pause Requests
- Orders
- Payments
- Notifications
- Admin
- CMS
- Uploads

✅ **40+ Endpoints** with:
- Complete request/response examples
- Authentication requirements (Bearer token)
- Try-it-out functionality
- Schema definitions

---

## 🧪 Quick Validation Tests

### 1. **Health Check** (No auth required)

```bash
curl http://localhost:3000/api/v1/health
```

**Expected response:**

```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "memory_heap": { "status": "up" },
    "memory_rss": { "status": "up" },
    "disk": { "status": "up" }
  }
}
```

### 2. **Public Schools Endpoint** (Cached)

```bash
curl http://localhost:3000/api/v1/schools
```

### 3. **Register a User**

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test Parent",
    "email": "test@example.com",
    "phoneNumber": "+911234567890",
    "password": "Test@1234"
  }'
```

### 4. **Login**

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@1234"
  }'
```

**Save the `accessToken` from the response!**

### 5. **Test Authenticated Endpoint**

```bash
# Replace YOUR_TOKEN with the accessToken from login
curl http://localhost:3000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎯 Module-by-Module Validation

### ✅ Core Modules

| Module | Status | Validation |
|--------|--------|------------|
| Auth | ✅ | `POST /api/v1/auth/register`, `POST /api/v1/auth/login` |
| Users | ✅ | `GET /api/v1/users/me` (with token) |
| Students | ✅ | `POST /api/v1/students` (with token) |
| Schools | ✅ | `GET /api/v1/schools` (public, cached) |
| Meal Plans | ✅ | `GET /api/v1/meal-plans` (public, cached) |
| Menu Items | ✅ | `GET /api/v1/menu-items` (public) |
| Subscriptions | ✅ | `POST /api/v1/subscriptions` (with token) |
| Pause Requests | ✅ | `POST /api/v1/pause-requests` (with token) |
| Orders | ✅ | `GET /api/v1/orders` (with token) |
| Payments | ✅ | `POST /api/v1/payments/create-intent` (with token) |
| Notifications | ✅ | `GET /api/v1/notifications` (with token) |

### ✅ Admin Modules (Require Admin Role)

| Module | Status | Endpoint |
|--------|--------|----------|
| Admin Dashboard | ✅ | `GET /api/v1/admin/dashboard` |
| Delivery Management | ✅ | `GET /api/v1/admin/deliveries` |
| User Management | ✅ | `GET /api/v1/admin/users` |
| Reports | ✅ | `GET /api/v1/admin/reports/sales` |

### ✅ Content & Upload Modules

| Module | Status | Endpoint |
|--------|--------|----------|
| CMS | ✅ | `GET /api/v1/cms/:slug` (public), `POST /api/v1/cms` (admin) |
| Uploads | ✅ | `POST /api/v1/uploads/image` (admin) |

### ✅ Background Jobs

| Job | Status | Monitoring |
|-----|--------|------------|
| Daily Delivery | ✅ | Bull Board at `/admin/queues` |
| Subscription Expiry | ✅ | Bull Board at `/admin/queues` |
| Cleanup | ✅ | Bull Board at `/admin/queues` |
| Pause Approval | ✅ | Bull Board at `/admin/queues` |

**Access Bull Board** (must be logged in as admin):
`http://localhost:3000/admin/queues`

---

## 🔍 Troubleshooting

### Issue 1: "Cannot find module 'date-fns'"

```bash
cd apps/backend
pnpm add date-fns
```

### Issue 2: "Cannot connect to database"

Check:
1. PostgreSQL is running: `docker-compose ps` or `psql -U postgres -h localhost`
2. DATABASE_URL in `.env` is correct
3. Run migrations: `pnpm prisma migrate dev`

### Issue 3: "Cannot connect to Redis"

Check:
1. Redis is running: `docker-compose ps` or `redis-cli ping`
2. REDIS_HOST and REDIS_PORT in `.env` are correct

### Issue 4: "Build errors with .d.ts files"

Clean the build artifacts:

```bash
cd apps/backend
find src -type f \( -name "*.d.ts" -o -name "*.d.ts.map" -o -name "*.js" -o -name "*.js.map" \) -delete
rm -rf dist/
pnpm build
```

### Issue 5: "AWS S3 not configured"

This is **optional** for development. If you see warnings about S3, you can:
- Add AWS credentials to `.env`, OR
- Ignore the warning (uploads will fail but other features work)

### Issue 6: "Firebase not configured"

This is **optional** for development. Push notifications won't work without Firebase, but:
- Email and SMS notifications will still work
- All other features are unaffected

---

## 📊 Performance Checks

### 1. **Redis Caching**

Cached endpoints (should be fast on 2nd request):
- `GET /api/v1/schools`
- `GET /api/v1/meal-plans`
- `GET /api/v1/menu-items`
- `GET /api/v1/cms/:slug`

### 2. **Rate Limiting**

Try hitting an endpoint 101 times in 1 minute - should get rate limited (429 Too Many Requests)

### 3. **Response Compression**

Check response headers - should include `Content-Encoding: gzip`

### 4. **Health Checks**

- Liveness: `GET /api/v1/health/liveness`
- Readiness: `GET /api/v1/health/readiness`

---

## 🎯 Next Steps After Validation

1. **Create Admin User** (via Prisma Studio or seed script)
2. **Add Test Schools & Meal Plans** (via Admin API or Prisma Studio)
3. **Test Complete User Flow**:
   - Register → Login → Add Student → Browse Meal Plans → Create Subscription → Pay
4. **Test Admin Flow**:
   - Login as Admin → View Dashboard → Manage Deliveries → Approve Pause Requests
5. **Test Background Jobs**:
   - Access Bull Board → Manually trigger jobs → Check logs
6. **Run E2E Tests** (when ready):
   ```bash
   pnpm test:e2e
   ```

---

## ✅ Validation Checklist

Before considering the backend "production-ready":

- [ ] All dependencies installed (`pnpm install`)
- [ ] Build artifacts cleaned from `src/` folder
- [ ] `.env` file configured with real values
- [ ] PostgreSQL running and migrations applied
- [ ] Redis running and accessible
- [ ] Backend starts without errors (`pnpm start:dev`)
- [ ] Swagger docs accessible at `/api/docs`
- [ ] Health check returns "ok"
- [ ] Can register and login a user
- [ ] Can create authenticated requests (with Bearer token)
- [ ] Admin endpoints work (with admin user)
- [ ] Bull Board accessible (job monitoring)
- [ ] Redis caching working (fast 2nd requests)
- [ ] Rate limiting working (429 after 100 req/min)

---

## 📖 Additional Resources

**Documentation Files**:
- `BACKEND_IMPLEMENTATION_COMPLETE.md` - Complete implementation summary
- `IMPLEMENTATION_PATTERN_GUIDE.md` - Code patterns and standards
- `QUICK_REFERENCE.md` - Command quick reference
- `docs/week*/` - Week-by-week progress documentation

**Monitoring Dashboards**:
- Swagger UI: `http://localhost:3000/api/docs`
- Bull Board: `http://localhost:3000/admin/queues` (admin only)
- Prisma Studio: `pnpm prisma:studio`
- Redis Commander: `http://localhost:8081` (if using Docker Compose)

---

## 🎉 Success!

If you can:
1. ✅ Start the backend without errors
2. ✅ Access Swagger docs
3. ✅ Register and login a user
4. ✅ Make authenticated API calls

**Your backend is fully operational and ready for development!** 🚀

For production deployment, see deployment guides in the documentation.
