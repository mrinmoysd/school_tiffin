# AI Agent Context: School Tiffin Platform
## Session Warm-Up Script for AI Assistants

> **Purpose**: This document provides complete context about the School Tiffin Platform project for AI agents starting a new session. Read this first to understand the project comprehensively.

---

## 🎯 Project Overview (30-Second Summary)

**What**: A food ordering and subscription management platform for school meals

**Who**: 
- Parents (Mobile App - React Native)
- School Admins (Admin Panel - React Web)
- Food Vendors (Future)

**Core Value**: Parents subscribe to healthy meal plans for their children, manage deliveries, and handle payments. Admins manage schools, meal plans, and delivery operations.

**Tech Stack**: Node.js/NestJS backend, React Native mobile, React admin panel, PostgreSQL, Redis, Razorpay payments

---

## 🗂 Repository Structure

```
School_Tiffin_Project/
├── README.md                          # Navigation & quick start
├── PROJECT_OVERVIEW.md                # Complete project summary
├── ENTERPRISE_SCALABILITY_ASSESSMENT.md  # Scaling & architecture analysis
├── AI_AGENT_CONTEXT.md               # This file - for AI agents
│
├── LLD/                               # Low-Level Design (6 docs)
│   ├── 01_Database_Schema_Design.md
│   ├── 02_API_Specifications.md
│   ├── 03_Subscription_Engine_Logic.md
│   ├── 04_Authentication_Authorization_Flow.md
│   ├── 05_Background_Jobs_Queue_System.md
│   └── 06_Component_Architecture.md
│
└── TASKS/                             # Task Breakdowns (5 docs, ~510 hours)
    ├── 01_Project_Setup_Infrastructure.md
    ├── 02_Backend_Development.md
    ├── 03_Mobile_App_Development.md
    ├── 04_Admin_Panel_Development.md
    └── 05_Testing_Deployment.md
```

---

## 💡 Core Concepts (Essential Understanding)

### 1. **Subscription Model** (MOST IMPORTANT)

**What it is**: Parents subscribe to a meal plan for a duration (e.g., 30 days), and the system automatically generates a delivery schedule.

**Key Logic**:
- Meal plan has duration (e.g., 30 days) and price
- School has operating days (e.g., MON-FRI)
- System generates **only operating days** from start date
- Example: 30-day plan starting Monday = ~22 actual delivery days (skips weekends)

**Critical Tables**:
- `subscriptions` - Main subscription record
- `subscription_days` - Each scheduled delivery date (one row per day)

**Subscription States**:
```
PENDING → ACTIVE → COMPLETED
         ↓
    CANCELLED
         ↓
      PAUSED (temporary)
```

---

### 2. **Pause Management** (Complex Feature)

**What it is**: Parents can pause subscriptions for specific dates (vacation, etc.)

**The Magic**: When paused, the subscription automatically **extends** by the same number of days.

**Example**:
- Original: 30 days, ends March 31
- Pause: March 15-19 (3 operating days)
- New end date: April 3 (extended by 3 days)

**How it works**:
1. Parent creates pause request (UI shows impact preview)
2. Admin approves pause request
3. Background job:
   - Marks dates in `subscription_days` as PAUSED
   - Generates 3 new delivery dates after original end date
   - Updates `subscription.current_end_date`

**Critical**: Preserves total delivery count (30 days remains 30 days)

---

### 3. **Payment Flow** (Razorpay Integration)

**Steps**:
1. User creates subscription → Backend creates `subscription` (status: PENDING)
2. User clicks "Pay" → Backend creates `order` and Razorpay order
3. Mobile app opens Razorpay SDK → User completes payment
4. Razorpay webhook → Backend processes → Updates order & subscription
5. Subscription status → ACTIVE
6. Background job sends notification

**Critical**: 
- Idempotency (duplicate webhooks)
- Webhook signature verification
- Transaction tracking in `payment_transactions` table

---

### 4. **Background Jobs** (BullMQ + Redis)

**Critical Jobs**:

1. **Daily Delivery Job** (6 AM daily)
   - Fetches today's scheduled deliveries
   - Groups by school
   - Sends notifications to parents
   - Generates delivery lists for admins

2. **Subscription Expiry Job** (11:59 PM daily)
   - Finds subscriptions with 0 remaining days
   - Marks as COMPLETED
   - Sends completion notification

3. **Pause Processing Job** (on demand)
   - Triggered after admin approval
   - Updates schedule
   - Extends subscription

4. **Cleanup Jobs** (weekly/monthly)
   - Old notifications
   - Expired tokens
   - Archive old subscriptions

---

## 🏗 Technical Architecture

### Backend (Node.js/NestJS)

**Key Modules**:
```
auth/              # JWT, OTP, password management
users/             # Parent accounts
students/          # Children profiles
schools/           # Educational institutions
meal-plans/        # Subscription packages
subscriptions/     # CORE - subscription engine
pause-requests/    # Pause management
orders/            # Financial records
payments/          # Razorpay integration
notifications/     # FCM, email, SMS
admin/             # Admin-specific APIs
cms/               # Static content
jobs/              # Background workers
```

**Key Services**:
- `SubscriptionEngineService` - Schedule generation logic
- `PaymentService` - Razorpay wrapper
- `NotificationService` - Multi-channel notifications

---

### Mobile App (React Native)

**Key Screens**:
```
Auth Flow:
- LoginScreen
- RegisterScreen
- OTPScreen

Main Flow:
- HomeScreen (active subscriptions)
- SchoolListScreen
- SchoolDetailScreen
- MealPlanDetailScreen
- SubscriptionReviewScreen
- PaymentScreen
- SubscriptionDetailScreen
- DeliveryScheduleScreen
- PauseRequestScreen

Profile:
- ProfileScreen
- StudentsScreen
- OrdersScreen
- NotificationsScreen
```

**State Management**: Redux Toolkit
- `authSlice` - User auth state
- `subscriptionSlice` - Active subscriptions
- `userSlice` - User profile

---

### Admin Panel (React.js)

**Key Pages**:
```
- Dashboard (metrics)
- Schools List/Create/Edit
- Meal Plans List/Create/Edit
- Menu Management
- Subscriptions List/Detail
- Orders List/Detail
- Pause Requests (IMPORTANT - approval workflow)
- Deliveries (by date/school, export lists)
- Users List/Detail
- Reports (sales, subscriptions)
- CMS Editor
```

---

## 🗄 Database Schema (Quick Reference)

### Core Tables (14 total):

**Users & Students**:
- `users` - Parents & admins
- `students` - Children (linked to parent)

**Schools & Meals**:
- `schools` - Educational institutions
- `meal_plans` - Subscription packages
- `menu_items` - Daily menu content

**Subscriptions** (CORE):
- `subscriptions` - Main subscription record
  - Important fields: `start_date`, `original_end_date`, `current_end_date`, `total_days`, `delivered_days`, `paused_days`, `remaining_days`
- `subscription_days` - Individual delivery dates
  - Important fields: `scheduled_date`, `status` (SCHEDULED/DELIVERED/PAUSED/CANCELLED)

**Pause Management**:
- `pause_requests` - Pause requests from parents
  - Status: PENDING → APPROVED/REJECTED → PROCESSED

**Orders & Payments**:
- `orders` - Financial transactions
- `payment_transactions` - Gateway transaction logs

**Others**:
- `refresh_tokens` - JWT refresh tokens
- `notifications` - User notifications
- `cms_pages` - Static content
- `audit_logs` - Admin action tracking

**Key Relationships**:
```
user (parent) → students → subscriptions → subscription_days
school → meal_plans → menu_items
subscription → order → payment_transactions
subscription → pause_requests
```

---

## 🔐 Authentication & Authorization

### Authentication Methods:
1. **Email + Password** (bcrypt hashing)
2. **Phone + OTP** (Redis-based, 5-minute expiry)

### JWT Structure:
```typescript
AccessToken (1 hour expiry): {
  userId, email, role
}

RefreshToken (7 days expiry): {
  userId, tokenId
}
```

### Roles & Permissions:
- **PARENT**: Own data only, create subscriptions, pause requests
- **ADMIN**: All data, approve pause requests, manage schools/meals
- **SCHOOL_ADMIN** (Future): School-specific admin

### Guards:
- `JwtAuthGuard` - Validates JWT
- `RolesGuard` - Checks user role
- Ownership validation - Ensures parent can only access own data

---

## 🔄 Critical Workflows

### Workflow 1: Create Subscription (Happy Path)

```
1. Mobile App: User browses schools → selects meal plan
2. Mobile App: User selects start date, reviews
3. Mobile App: POST /api/v1/subscriptions
4. Backend: 
   - Validates student belongs to parent
   - Gets school operating days
   - Generates delivery schedule (N operating days)
   - Creates subscription (status: PENDING)
   - Creates subscription_days (bulk insert)
5. Backend: Returns subscription + schedule
6. Mobile App: Shows payment screen
7. Mobile App: POST /api/v1/payments/create-intent
8. Backend: Creates order + Razorpay order
9. Mobile App: Opens Razorpay SDK → User pays
10. Razorpay: Sends webhook to backend
11. Backend Job: 
    - Verifies signature
    - Updates order (SUCCESS)
    - Updates subscription (ACTIVE)
    - Sends notification
12. Mobile App: Shows success, navigates to subscription detail
```

---

### Workflow 2: Pause Subscription (Admin Approval)

```
1. Mobile App: User goes to active subscription
2. Mobile App: Taps "Pause" → Selects date range
3. Backend: Calculates affected days (only operating days)
4. Mobile App: Shows preview (new end date)
5. Mobile App: POST /api/v1/pause-requests
6. Backend: Creates pause_request (status: PENDING)
7. Admin Panel: Admin views pause requests page
8. Admin Panel: Admin clicks "Approve"
9. Admin Panel: PATCH /api/v1/pause-requests/:id/status
10. Backend: Updates status to APPROVED, queues job
11. Background Job: 
    - Marks subscription_days as PAUSED
    - Generates N new days after original end date
    - Updates subscription.current_end_date
    - Marks pause_request as PROCESSED
    - Sends notification to parent
12. Mobile App: Receives notification, shows updated schedule
```

---

### Workflow 3: Daily Deliveries

```
1. Cron: Triggers at 6 AM daily
2. Background Job: Daily Delivery Job
3. Backend: 
   - Fetches today's subscription_days (status: SCHEDULED)
   - Groups by school_id
4. Backend: For each school:
   - Generates delivery list (student names, grades, meal plans)
   - Caches for admin panel
5. Backend: For each delivery:
   - Queues notification to parent (delivery reminder)
6. Admin Panel: Admin views deliveries page
7. Admin Panel: Filters by school, exports to PDF/CSV
8. Admin Panel: Marks deliveries as completed (bulk or individual)
9. Backend: 
   - Updates subscription_day.status = DELIVERED
   - Increments subscription.delivered_days
   - Decrements subscription.remaining_days
```

---

## 🚨 Common Issues & Gotchas

### 1. **Subscription Schedule Generation**
❌ **Wrong**: Generating 30 calendar days
✅ **Right**: Generating 30 operating days only

**Example**:
- Start: Monday, March 1
- Duration: 5 days
- Operating days: MON-FRI
- Generated dates: Mar 1, 2, 3, 4, 5 (NOT including weekend)

---

### 2. **Pause Extension Logic**
❌ **Wrong**: Just marking days as paused
✅ **Right**: Mark days as paused AND extend subscription by same number of operating days

**Why**: Parents paid for N deliveries, they should get N deliveries.

---

### 3. **Payment Webhook Idempotency**
❌ **Wrong**: Processing webhook multiple times
✅ **Right**: Check if order already processed (by transaction ID)

**Implementation**: Use `payment_transactions.gateway_transaction_id` as unique constraint

---

### 4. **Operating Days Edge Case**
**Problem**: What if school changes operating days mid-subscription?

**Solution**: Store operating days at subscription creation time, don't recalculate from school.

**Current Design**: Doesn't store, relies on school's current operating days. Consider enhancement.

---

### 5. **Timezone Handling**
**Critical**: All dates should be in school's local timezone (Asia/Kolkata for India)

**Implementation**:
- Store dates as DATE type (no time)
- Backend uses moment-timezone
- Cron jobs run in server timezone (configure carefully)

---

## 🎯 Success Criteria & Metrics

### Technical Metrics:
- API Response Time: p95 < 500ms
- Error Rate: < 1%
- Payment Success Rate: > 95%
- App Crash Rate: < 1%
- Uptime: > 99.5%

### Business Metrics:
- Daily Active Users
- Subscription Creation Rate
- Payment Completion Rate (funnel)
- Churn Rate
- Average Order Value

---

## 🔍 Where to Find Information

| Question | Document | Section |
|----------|----------|---------|
| Database table structure? | LLD/01_Database_Schema_Design.md | Full schema |
| API endpoint details? | LLD/02_API_Specifications.md | All endpoints |
| How subscription engine works? | LLD/03_Subscription_Engine_Logic.md | Algorithms |
| Authentication flow? | LLD/04_Authentication_Authorization_Flow.md | JWT, OTP |
| Background jobs? | LLD/05_Background_Jobs_Queue_System.md | Job definitions |
| Component structure? | LLD/06_Component_Architecture.md | Module structure |
| Setup instructions? | TASKS/01_Project_Setup_Infrastructure.md | Environment setup |
| Backend tasks? | TASKS/02_Backend_Development.md | API development |
| Mobile tasks? | TASKS/03_Mobile_App_Development.md | App development |
| Admin tasks? | TASKS/04_Admin_Panel_Development.md | Panel development |
| Testing & deployment? | TASKS/05_Testing_Deployment.md | Launch process |
| Scalability concerns? | ENTERPRISE_SCALABILITY_ASSESSMENT.md | Architecture analysis |

---

## 🛠 Tech Stack Deep Dive

### Backend Dependencies:
```json
{
  "@nestjs/core": "^10.x",
  "@nestjs/jwt": "^10.x",
  "@nestjs/passport": "^10.x",
  "@nestjs/bull": "^10.x",
  "@prisma/client": "^5.x",
  "bcrypt": "^5.x",
  "bull": "^4.x",
  "ioredis": "^5.x",
  "razorpay": "^2.x",
  "firebase-admin": "^12.x",
  "class-validator": "^0.14.x",
  "class-transformer": "^0.5.x"
}
```

### Mobile Dependencies:
```json
{
  "react-native": "^0.73.x",
  "@react-navigation/native": "^6.x",
  "@reduxjs/toolkit": "^2.x",
  "react-redux": "^9.x",
  "axios": "^1.x",
  "react-hook-form": "^7.x",
  "react-native-keychain": "^8.x",
  "@react-native-firebase/messaging": "^18.x",
  "react-native-razorpay": "^2.x"
}
```

### Admin Dependencies:
```json
{
  "react": "^18.x",
  "react-router-dom": "^6.x",
  "antd": "^5.x",
  "@tanstack/react-query": "^5.x",
  "axios": "^1.x",
  "react-hook-form": "^7.x"
}
```

---

## 🔒 Security Checklist

When working on this project, always ensure:

- [ ] All API endpoints have authentication (except public routes)
- [ ] Role checks on admin-only routes
- [ ] Ownership validation (parent can only access own data)
- [ ] Input validation on all endpoints (DTOs with class-validator)
- [ ] Password hashing (never store plain text)
- [ ] JWT tokens stored securely (keychain on mobile)
- [ ] Payment webhook signature verification
- [ ] Rate limiting on auth endpoints
- [ ] HTTPS only in production
- [ ] No sensitive data in logs
- [ ] SQL injection prevention (ORM handles this)
- [ ] XSS prevention (sanitize user input)

---

## 📊 Project Status & Timeline

### Total Effort: ~510 hours (12-14 weeks)

**Phase Breakdown**:
1. Setup & Infrastructure: ~60 hours (Weeks 1-2)
2. Backend Development: ~120 hours (Weeks 3-6)
3. Mobile App: ~150 hours (Weeks 3-8, parallel)
4. Admin Panel: ~110 hours (Weeks 5-8, parallel)
5. Testing & Deployment: ~70 hours (Weeks 9-12)

**Current Status**: Documentation complete, ready for development

**Next Steps**: Start with TASKS/01_Project_Setup_Infrastructure.md

---

## 💼 Team Recommendations

**Minimum Team**:
- 1 Full-Stack Developer + 1 Mobile Developer
- Timeline: 14-16 weeks

**Recommended Team**:
- 1 Backend Developer
- 1 Mobile Developer (React Native)
- 1 Frontend Developer (React Admin)
- Timeline: 10-12 weeks

**Accelerated Team**:
- 2 Backend Developers
- 2 Mobile Developers
- 1 Frontend Developer
- 1 QA Engineer
- Timeline: 6-8 weeks

---

## 🎓 Learning Resources (If Unfamiliar)

### NestJS (Backend):
- Official Docs: https://docs.nestjs.com
- Focus on: Modules, Controllers, Services, Guards, Interceptors

### Prisma (Database ORM):
- Official Docs: https://www.prisma.io/docs
- Focus on: Schema, Migrations, Queries, Relations

### React Native:
- Official Docs: https://reactnative.dev/docs/getting-started
- Focus on: Components, Navigation, State Management

### Redux Toolkit:
- Official Docs: https://redux-toolkit.js.org
- Focus on: Slices, Async Thunks

### BullMQ (Background Jobs):
- Official Docs: https://docs.bullmq.io
- Focus on: Queues, Workers, Processors, Cron

---

## 🚦 Quick Decision Matrix

| Scenario | Decision |
|----------|----------|
| Need to add new API endpoint? | Follow pattern in LLD/02, create in relevant module |
| Need to modify database schema? | Update Prisma schema, create migration |
| Adding new screen to mobile app? | Follow structure in LLD/06, use feature folders |
| Need to send notification? | Use NotificationService, queue via BullMQ |
| Payment webhook fails? | Check signature verification, ensure idempotency |
| Subscription schedule wrong? | Debug generateDeliverySchedule(), check operating days |
| Admin needs new report? | Add to admin module, use React Query, consider caching |

---

## 🎯 Critical Features Requiring Extra Attention

### 1. Subscription Engine (Backend)
- **Complexity**: High
- **Testing**: Extensive unit tests required
- **Key File**: `subscription-engine.service.ts`
- **Focus**: Schedule generation, operating days logic

### 2. Pause Management (Backend + Mobile + Admin)
- **Complexity**: High
- **Testing**: Integration tests critical
- **Key Files**: `pause-requests.service.ts`, background job processor
- **Focus**: Extension logic, date calculations

### 3. Payment Integration (Backend + Mobile)
- **Complexity**: Medium-High
- **Testing**: Use test mode extensively before production
- **Key Files**: `payments.service.ts`, webhook handler, mobile payment screen
- **Focus**: Security, idempotency, error handling

### 4. Background Jobs (Backend)
- **Complexity**: Medium
- **Testing**: Test each job independently
- **Key Files**: Job processors in `jobs/` folder
- **Focus**: Reliability, retry logic, monitoring

---

## 🔄 Common Development Tasks

### Task: Add New API Endpoint

1. Define DTO in module (e.g., `users/dto/update-user.dto.ts`)
2. Add method to service (e.g., `users.service.ts`)
3. Add controller endpoint (e.g., `users.controller.ts`)
4. Add authentication guard if needed
5. Add to API documentation (Swagger decorators)
6. Write unit tests
7. Test with Postman/Insomnia

### Task: Add New Mobile Screen

1. Create screen component in `features/` folder
2. Add to navigator (stack/tab)
3. Create necessary Redux slice if needed
4. Create API service call
5. Implement UI with loading/error states
6. Test on iOS and Android
7. Handle navigation

### Task: Add New Admin Page

1. Create page component in `pages/` folder
2. Add route in router
3. Add sidebar menu item
4. Implement with React Query for data fetching
5. Add table/form components
6. Test responsiveness
7. Add error handling

### Task: Add Background Job

1. Create processor in `jobs/` folder
2. Define job name and data type
3. Implement job logic
4. Add to queue module
5. Add cron schedule if needed
6. Add monitoring/logging
7. Test job execution
8. Handle errors and retries

---

## 📝 Code Style & Conventions

### Backend (NestJS):
- Use Dependency Injection
- DTOs for all inputs (class-validator)
- Service layer for business logic
- Repository pattern for data access (optional)
- Async/await for all async operations
- Error handling with custom exceptions
- Use TypeScript strict mode

### Mobile (React Native):
- Functional components with hooks
- Feature-based folder structure
- Redux Toolkit for state management
- React Hook Form for forms
- TypeScript for type safety
- Styled Components or StyleSheet
- Responsive design (multiple screen sizes)

### Admin (React):
- Functional components with hooks
- React Query for data fetching
- React Router for navigation
- React Hook Form for forms
- TypeScript for type safety
- UI library components (Ant Design/MUI)
- Responsive design (desktop-first)

---

## 🐛 Debugging Tips

### Backend Issues:
- Check logs: `console.log` or logger service
- Use NestJS debugger: VS Code launch.json
- Test API with Postman
- Check database with Prisma Studio: `npx prisma studio`
- Monitor Redis: Use RedisInsight
- Check job queue: Bull Board (if set up)

### Mobile Issues:
- React Native debugger
- Redux DevTools
- Console logs: `console.log`
- Network inspector (Flipper/React Native Debugger)
- Check device logs: `npx react-native log-ios/android`

### Database Issues:
- Use Prisma Studio for visual inspection
- Check migrations: `npx prisma migrate status`
- Use SQL client (pgAdmin, DBeaver)
- Check indexes: `EXPLAIN ANALYZE` in SQL

---

## ✅ When You Start Working

1. **Read this document first** ✓
2. Read `PROJECT_OVERVIEW.md` for big picture
3. Read relevant LLD document for your task
4. Check relevant TASKS document for implementation details
5. Look at code structure in LLD/06
6. Start coding following the task breakdown
7. Write tests as you go
8. Update documentation if you make changes
9. Commit frequently with meaningful messages

---

## 🎉 You're Ready!

You now have comprehensive context about the School Tiffin Platform. Key things to remember:

1. **Subscription engine** is the core feature - understand schedule generation
2. **Pause management** is complex - understand extension logic
3. **Payment integration** is critical - test thoroughly
4. **Background jobs** are essential - ensure reliability
5. **Security** is non-negotiable - follow all best practices

**Where to go next**: 
- If setting up project: `TASKS/01_Project_Setup_Infrastructure.md`
- If working on backend: `TASKS/02_Backend_Development.md`
- If working on mobile: `TASKS/03_Mobile_App_Development.md`
- If working on admin: `TASKS/04_Admin_Panel_Development.md`

---

**Last Updated**: February 2026  
**Version**: 1.0  
**For**: AI Agents & New Team Members  

---

## 🤖 For AI Assistants Specifically

When helping with this project:

1. **Always consider**: Is this change consistent with the subscription engine logic?
2. **Security first**: Never compromise on authentication, authorization, or data protection
3. **Follow patterns**: Use existing code structure and patterns
4. **Test coverage**: Suggest tests for critical features
5. **Performance**: Consider database queries, caching, and API response times
6. **User experience**: Mobile apps should be smooth, admin panel efficient
7. **Documentation**: If adding features, update relevant docs
8. **Scalability**: Keep future growth in mind (see ENTERPRISE_SCALABILITY_ASSESSMENT.md)

**Common Requests**:
- "How do I implement X?" → Check LLD docs, then TASKS docs
- "Where is Y located?" → Check Component Architecture (LLD/06)
- "What's the API for Z?" → Check API Specifications (LLD/02)
- "How does the subscription engine work?" → Read LLD/03 thoroughly
- "Is this secure?" → Cross-reference with LLD/04 and security checklist above

**Pro Tip**: When suggesting code, always reference the relevant LLD or TASKS document to show you understand the context.

---

**You're now fully briefed on the School Tiffin Platform! Happy coding! 🚀**
