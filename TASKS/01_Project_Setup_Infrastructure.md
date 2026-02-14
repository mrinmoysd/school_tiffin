# Task Breakdown: Project Setup & Infrastructure

## Phase 1.1: Development Environment Setup

### Task 1.1.1: Local Development Tools Installation
**Estimated Time**: 2 hours
**Priority**: Critical
**Dependencies**: None

- [ ] Install Node.js (v18 LTS or higher)
- [ ] Install PostgreSQL (v14 or higher)
- [ ] Install Redis (v7 or higher)
- [ ] Install Docker & Docker Compose
- [ ] Install VS Code with recommended extensions
  - ESLint
  - Prettier
  - TypeScript
  - Prisma
  - GitLens
- [ ] Install Postman or Insomnia for API testing
- [ ] Install PostgreSQL GUI client (pgAdmin or DBeaver)
- [ ] Install Redis GUI client (RedisInsight)

**Acceptance Criteria:**
- All tools installed and verified with version commands
- Can start PostgreSQL and Redis locally

---

### Task 1.1.2: Git Repository Setup
**Estimated Time**: 1 hour
**Priority**: Critical
**Dependencies**: None

- [ ] Create GitHub/GitLab repository
- [ ] Set up branching strategy (main, develop, feature/*, hotfix/*)
- [ ] Create `.gitignore` files for Node.js, React Native
- [ ] Set up branch protection rules for main
- [ ] Create initial README.md with project overview
- [ ] Set up GitHub Actions / GitLab CI folder structure

**Acceptance Criteria:**
- Repository accessible to team
- Can push and pull code
- Branch protection active

---

### Task 1.1.3: Project Structure Initialization
**Estimated Time**: 2 hours
**Priority**: Critical
**Dependencies**: 1.1.2

- [ ] Create monorepo structure or separate repos decision
- [ ] Initialize backend project folder
- [ ] Initialize mobile app project folder
- [ ] Initialize admin panel project folder
- [ ] Set up shared types/utils package (if monorepo)
- [ ] Create folder structure as per LLD

**Acceptance Criteria:**
- All project folders created
- Basic folder structure in place

---

## Phase 1.2: Backend Infrastructure Setup

### Task 1.2.1: NestJS Project Initialization
**Estimated Time**: 2 hours
**Priority**: Critical
**Dependencies**: 1.1.3

- [ ] Initialize NestJS project: `nest new backend`
- [ ] Install core dependencies
  ```bash
  npm install @nestjs/config @nestjs/jwt @nestjs/passport
  npm install passport passport-jwt bcrypt
  npm install class-validator class-transformer
  npm install @nestjs/bull bull
  npm install ioredis
  ```
- [ ] Install dev dependencies
  ```bash
  npm install -D @types/node @types/passport-jwt @types/bcrypt
  npm install -D @types/bull
  ```
- [ ] Set up TypeScript configuration
- [ ] Configure ESLint and Prettier
- [ ] Set up nodemon for development

**Acceptance Criteria:**
- NestJS app starts successfully
- Hot reload working
- Linter and formatter configured

---

### Task 1.2.2: Database Setup (Prisma)
**Estimated Time**: 3 hours
**Priority**: Critical
**Dependencies**: 1.2.1

- [ ] Install Prisma
  ```bash
  npm install @prisma/client
  npm install -D prisma
  ```
- [ ] Initialize Prisma: `npx prisma init`
- [ ] Configure `schema.prisma` with database URL
- [ ] Copy database schema from LLD document
- [ ] Create initial migration
  ```bash
  npx prisma migrate dev --name init
  ```
- [ ] Generate Prisma Client: `npx prisma generate`
- [ ] Create PrismaModule and PrismaService
- [ ] Set up connection pooling configuration

**Acceptance Criteria:**
- Database schema created successfully
- Can run queries using Prisma Client
- Prisma Studio works: `npx prisma studio`

---

### Task 1.2.3: Redis Configuration
**Estimated Time**: 1 hour
**Priority**: High
**Dependencies**: 1.2.1

- [ ] Install Redis dependencies
  ```bash
  npm install ioredis
  npm install @nestjs/bull bull
  ```
- [ ] Create Redis configuration module
- [ ] Set up Redis client connection
- [ ] Configure connection retry strategy
- [ ] Test Redis connection
- [ ] Set up BullMQ module

**Acceptance Criteria:**
- Redis connection successful
- Can set and get values from Redis
- Bull queues initialized

---

### Task 1.2.4: Environment Configuration
**Estimated Time**: 2 hours
**Priority**: Critical
**Dependencies**: 1.2.1

- [ ] Create `.env.example` file with all variables
- [ ] Create `.env.development` for local dev
- [ ] Create `.env.staging` template
- [ ] Create `.env.production` template
- [ ] Set up ConfigModule from @nestjs/config
- [ ] Create type-safe configuration files
  - database.config.ts
  - jwt.config.ts
  - redis.config.ts
  - app.config.ts
- [ ] Validate environment variables on startup

**Environment Variables:**
```env
# App
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/schooltiffin

# JWT
JWT_ACCESS_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRY=1h
JWT_REFRESH_EXPIRY=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# AWS S3
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=
AWS_REGION=us-east-1

# Payment Gateway
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# Firebase
FCM_SERVER_KEY=

# Email
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=

# SMS
SMS_PROVIDER=
SMS_API_KEY=

# CORS
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:8081
```

**Acceptance Criteria:**
- All environment variables documented
- Type-safe config accessible throughout app
- Validation errors on missing required vars

---

### Task 1.2.5: Common Utilities Setup
**Estimated Time**: 3 hours
**Priority**: Medium
**Dependencies**: 1.2.1

- [ ] Create ResponseInterceptor for standard API responses
- [ ] Create HttpExceptionFilter for error handling
- [ ] Create ValidationPipe setup
- [ ] Create LoggingInterceptor
- [ ] Create custom decorators
  - @CurrentUser()
  - @Roles()
  - @Public()
- [ ] Create utility functions
  - date.util.ts
  - string.util.ts
  - pagination.util.ts
- [ ] Create base entity classes/interfaces

**Acceptance Criteria:**
- All interceptors working
- Custom decorators functional
- Utility functions tested

---

## Phase 1.3: Mobile App Infrastructure Setup

### Task 1.3.1: React Native Project Initialization
**Estimated Time**: 3 hours
**Priority**: Critical
**Dependencies**: 1.1.3

- [ ] Initialize React Native project
  ```bash
  npx react-native init SchoolTiffinApp --template react-native-template-typescript
  ```
- [ ] Install navigation libraries
  ```bash
  npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
  npm install react-native-screens react-native-safe-area-context
  ```
- [ ] Install state management
  ```bash
  npm install @reduxjs/toolkit react-redux
  ```
- [ ] Install form handling
  ```bash
  npm install react-hook-form
  ```
- [ ] Install networking
  ```bash
  npm install axios
  ```
- [ ] Configure TypeScript
- [ ] Set up folder structure as per LLD

**Acceptance Criteria:**
- App runs on iOS simulator
- App runs on Android emulator
- Hot reload working

---

### Task 1.3.2: Mobile App Core Dependencies
**Estimated Time**: 3 hours
**Priority**: Critical
**Dependencies**: 1.3.1

- [ ] Install secure storage
  ```bash
  npm install react-native-keychain
  npm install @react-native-async-storage/async-storage
  ```
- [ ] Install UI components library (optional)
  ```bash
  npm install react-native-paper
  # or
  npm install native-base
  ```
- [ ] Install date picker
  ```bash
  npm install react-native-date-picker
  ```
- [ ] Install calendar component
  ```bash
  npm install react-native-calendars
  ```
- [ ] Install image picker
  ```bash
  npm install react-native-image-picker
  ```
- [ ] Install Firebase for push notifications
  ```bash
  npm install @react-native-firebase/app @react-native-firebase/messaging
  ```
- [ ] Link native dependencies: `npx pod-install`

**Acceptance Criteria:**
- All dependencies installed successfully
- iOS and Android build successful
- No linking errors

---

### Task 1.3.3: Navigation Setup
**Estimated Time**: 2 hours
**Priority**: High
**Dependencies**: 1.3.2

- [ ] Create AuthNavigator (Login, Register, OTP screens)
- [ ] Create MainNavigator (Bottom tabs)
- [ ] Create AppNavigator (Root navigator with auth flow)
- [ ] Set up navigation types
- [ ] Configure deep linking (future)
- [ ] Test navigation between screens

**Acceptance Criteria:**
- Can navigate between screens
- Auth flow working
- Type-safe navigation

---

### Task 1.3.4: Redux Store Setup
**Estimated Time**: 3 hours
**Priority**: High
**Dependencies**: 1.3.2

- [ ] Configure Redux store
- [ ] Create authSlice
- [ ] Create userSlice
- [ ] Create subscriptionSlice
- [ ] Create notificationSlice
- [ ] Set up Redux DevTools
- [ ] Create typed hooks (useAppDispatch, useAppSelector)

**Acceptance Criteria:**
- Redux store configured
- Can dispatch actions and read state
- DevTools working

---

### Task 1.3.5: API Service Layer Setup
**Estimated Time**: 3 hours
**Priority**: High
**Dependencies**: 1.3.2

- [ ] Create Axios instance with base URL
- [ ] Implement request interceptor (add auth token)
- [ ] Implement response interceptor (handle errors, refresh token)
- [ ] Create service files
  - auth.service.ts
  - subscription.service.ts
  - school.service.ts
  - payment.service.ts
- [ ] Create type definitions for API responses
- [ ] Implement error handling

**Acceptance Criteria:**
- Can make API calls
- Token refresh working automatically
- Error handling consistent

---

## Phase 1.4: Admin Panel Infrastructure Setup

### Task 1.4.1: React Admin Project Initialization
**Estimated Time**: 2 hours
**Priority**: High
**Dependencies**: 1.1.3

- [ ] Initialize React project
  ```bash
  npm create vite@latest admin-panel -- --template react-ts
  # or
  npx create-react-app admin-panel --template typescript
  ```
- [ ] Install routing
  ```bash
  npm install react-router-dom
  ```
- [ ] Install UI library
  ```bash
  npm install antd
  # or
  npm install @mui/material @emotion/react @emotion/styled
  ```
- [ ] Install data fetching
  ```bash
  npm install @tanstack/react-query axios
  ```
- [ ] Install form handling
  ```bash
  npm install react-hook-form
  ```
- [ ] Configure TypeScript and ESLint

**Acceptance Criteria:**
- Dev server running
- Basic routing working
- UI library components accessible

---

### Task 1.4.2: Admin Panel Layout Setup
**Estimated Time**: 3 hours
**Priority**: Medium
**Dependencies**: 1.4.1

- [ ] Create MainLayout component (Sidebar + Header + Content)
- [ ] Create Sidebar navigation
- [ ] Create Header with user menu
- [ ] Create AuthLayout for login page
- [ ] Implement responsive design
- [ ] Set up theme configuration

**Acceptance Criteria:**
- Layout renders correctly
- Sidebar navigation working
- Responsive on mobile/tablet

---

### Task 1.4.3: Admin API Service Setup
**Estimated Time**: 2 hours
**Priority**: High
**Dependencies**: 1.4.1

- [ ] Create Axios instance
- [ ] Implement auth interceptors
- [ ] Create service files for each module
- [ ] Set up React Query configuration
- [ ] Create custom hooks for data fetching

**Acceptance Criteria:**
- Can make authenticated API calls
- React Query caching working

---

## Phase 1.5: CI/CD Setup

### Task 1.5.1: Docker Configuration
**Estimated Time**: 3 hours
**Priority**: Medium
**Dependencies**: 1.2.1

- [ ] Create Dockerfile for backend
- [ ] Create Dockerfile for admin panel
- [ ] Create docker-compose.yml for local dev
  - PostgreSQL
  - Redis
  - Backend API
  - Admin Panel
  - Worker (optional)
- [ ] Create .dockerignore files
- [ ] Test Docker build locally
- [ ] Document Docker commands in README

**Acceptance Criteria:**
- `docker-compose up` starts all services
- Can access API and database from containers
- Volumes configured for persistence

---

### Task 1.5.2: GitHub Actions / GitLab CI Setup
**Estimated Time**: 4 hours
**Priority**: Medium
**Dependencies**: 1.5.1

- [ ] Create CI workflow for backend
  - Install dependencies
  - Run linter
  - Run tests
  - Build Docker image
- [ ] Create CI workflow for mobile app
  - Install dependencies
  - Run linter
  - Run tests
  - Build APK (Android)
- [ ] Create CI workflow for admin panel
  - Install dependencies
  - Run linter
  - Build production bundle
- [ ] Set up deployment workflow (staging)
- [ ] Configure secrets in CI platform

**Acceptance Criteria:**
- CI runs on every push
- Builds succeed
- Docker images pushed to registry (if configured)

---

## Phase 1.6: Development Tools & Documentation

### Task 1.6.1: API Documentation Setup
**Estimated Time**: 2 hours
**Priority**: Medium
**Dependencies**: 1.2.1

- [ ] Install Swagger/OpenAPI
  ```bash
  npm install @nestjs/swagger
  ```
- [ ] Configure Swagger module
- [ ] Add API decorators to controllers
- [ ] Generate API documentation
- [ ] Access docs at `/api/docs`
- [ ] Export Postman collection

**Acceptance Criteria:**
- Swagger UI accessible
- All endpoints documented
- Can test APIs from Swagger

---

### Task 1.6.2: Database Seeding
**Estimated Time**: 3 hours
**Priority**: Medium
**Dependencies**: 1.2.2

- [ ] Create seed script in Prisma
- [ ] Seed sample admin user
- [ ] Seed sample schools (2-3)
- [ ] Seed sample meal plans
- [ ] Seed sample menu items
- [ ] Seed sample parent user with students
- [ ] Document seeding process in README

**Seed Data:**
- 1 Admin user (admin@schooltiffin.com)
- 3 Schools
- 6 Meal plans (2 per school)
- Menu items for each plan
- 2 Parent users
- 3 Students

**Acceptance Criteria:**
- Can run `npm run seed` to populate database
- Seed data is realistic and useful for testing

---

### Task 1.6.3: Development Documentation
**Estimated Time**: 3 hours
**Priority**: Medium
**Dependencies**: All Phase 1

- [ ] Create comprehensive README.md
  - Project overview
  - Prerequisites
  - Installation steps
  - Running locally
  - Environment variables
  - Docker commands
- [ ] Create CONTRIBUTING.md
  - Code style guide
  - Git workflow
  - PR process
- [ ] Create API documentation (separate doc)
- [ ] Create architecture diagram
- [ ] Document common issues and solutions

**Acceptance Criteria:**
- New developer can set up project from README
- Documentation is clear and accurate

---

## Phase 1.7: Third-Party Integrations Setup

### Task 1.7.1: AWS S3 Setup
**Estimated Time**: 2 hours
**Priority**: Medium
**Dependencies**: 1.2.1

- [ ] Create AWS account (if needed)
- [ ] Create S3 bucket
- [ ] Configure bucket CORS policy
- [ ] Create IAM user with S3 access
- [ ] Install AWS SDK
  ```bash
  npm install @aws-sdk/client-s3
  ```
- [ ] Create UploadService
- [ ] Test file upload

**Acceptance Criteria:**
- Can upload files to S3
- Files accessible via public URL
- Bucket policy configured correctly

---

### Task 1.7.2: Payment Gateway Setup (Razorpay)
**Estimated Time**: 3 hours
**Priority**: High
**Dependencies**: 1.2.1

- [ ] Create Razorpay account
- [ ] Get API keys (test mode)
- [ ] Install Razorpay SDK
  ```bash
  npm install razorpay
  ```
- [ ] Create PaymentGateway service
- [ ] Implement order creation
- [ ] Implement payment verification
- [ ] Set up webhook endpoint
- [ ] Test payment flow in test mode

**Acceptance Criteria:**
- Can create payment orders
- Can verify payment signatures
- Webhook receives events

---

### Task 1.7.3: Firebase Setup (Push Notifications)
**Estimated Time**: 2 hours
**Priority**: High
**Dependencies**: 1.2.1, 1.3.2

- [ ] Create Firebase project
- [ ] Add Android app to Firebase
- [ ] Add iOS app to Firebase
- [ ] Download google-services.json (Android)
- [ ] Download GoogleService-Info.plist (iOS)
- [ ] Get FCM server key
- [ ] Install admin SDK in backend
  ```bash
  npm install firebase-admin
  ```
- [ ] Initialize Firebase in backend
- [ ] Test push notification sending

**Acceptance Criteria:**
- Can send push notifications to test device
- Notifications received on mobile app

---

### Task 1.7.4: Email Service Setup
**Estimated Time**: 2 hours
**Priority**: Medium
**Dependencies**: 1.2.1

- [ ] Choose email provider (SendGrid, AWS SES, or SMTP)
- [ ] Create account and get API keys
- [ ] Install email library
  ```bash
  npm install nodemailer
  # or
  npm install @sendgrid/mail
  ```
- [ ] Create EmailService
- [ ] Create email templates
  - Welcome email
  - Password reset
  - Payment receipt
  - Subscription activated
- [ ] Test email sending

**Acceptance Criteria:**
- Can send emails successfully
- Templates render correctly

---

### Task 1.7.5: SMS Service Setup
**Estimated Time**: 2 hours
**Priority**: Medium
**Dependencies**: 1.2.1

- [ ] Choose SMS provider (Twilio, AWS SNS)
- [ ] Create account and get API keys
- [ ] Install SMS library
  ```bash
  npm install twilio
  ```
- [ ] Create SMSService
- [ ] Implement OTP sending
- [ ] Test SMS delivery to Indian numbers

**Acceptance Criteria:**
- Can send SMS successfully
- OTPs delivered within 30 seconds

---

## Summary

**Total Estimated Time**: ~60 hours (1.5-2 weeks)
**Critical Path**: Tasks 1.1.* → 1.2.* → 1.3.* → 1.4.*

**Deliverables:**
- ✅ Fully configured development environment
- ✅ Backend API structure with database
- ✅ Mobile app skeleton with navigation
- ✅ Admin panel skeleton
- ✅ Docker setup for local development
- ✅ CI/CD pipelines
- ✅ Third-party integrations configured
- ✅ Comprehensive documentation

**Next Phase**: Backend Development (Core Features)
