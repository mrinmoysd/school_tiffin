# Task Breakdown: Backend Development

## Phase 2.1: Authentication Module

### Task 2.1.1: Auth Module Setup
**Estimated Time**: 2 hours
**Priority**: Critical
**Dependencies**: Phase 1 Complete

- [ ] Create auth module: `nest g module auth`
- [ ] Create auth controller: `nest g controller auth`
- [ ] Create auth service: `nest g service auth`
- [ ] Install dependencies (bcrypt, jwt, passport)
- [ ] Create DTOs
  - RegisterDTO
  - LoginDTO
  - SendOTPDTO
  - VerifyOTPDTO
  - RefreshTokenDTO

**Acceptance Criteria:**
- Module structure created
- DTOs with validation decorators

---

### Task 2.1.2: Registration & Login Implementation
**Estimated Time**: 4 hours
**Priority**: Critical
**Dependencies**: 2.1.1

- [ ] Implement user registration logic
  - Email validation
  - Password hashing with bcrypt
  - Check for duplicate email/phone
  - Create user record
  - Send verification email
- [ ] Implement login logic
  - Find user by email
  - Verify password
  - Generate JWT access token
  - Generate refresh token
  - Store refresh token in database
  - Update last login timestamp
- [ ] Create POST `/api/v1/auth/register` endpoint
- [ ] Create POST `/api/v1/auth/login` endpoint
- [ ] Write unit tests

**Acceptance Criteria:**
- Can register new user successfully
- Can login with email/password
- Returns JWT tokens
- Passwords hashed in database

---

### Task 2.1.3: OTP Authentication Implementation
**Estimated Time**: 4 hours
**Priority**: High
**Dependencies**: 2.1.2

- [ ] Implement OTP generation (6-digit random)
- [ ] Store OTP in Redis with 5-minute expiry
- [ ] Implement rate limiting (3 OTP per hour per phone)
- [ ] Integrate SMS service for OTP sending
- [ ] Implement OTP verification
  - Validate OTP from Redis
  - Find or create user by phone
  - Mark phone as verified
  - Generate JWT tokens
- [ ] Create POST `/api/v1/auth/send-otp` endpoint
- [ ] Create POST `/api/v1/auth/verify-otp` endpoint
- [ ] Write unit tests

**Acceptance Criteria:**
- OTP sent successfully to phone
- Can login with phone + OTP
- Rate limiting works
- Auto-registers user if phone not exists

---

### Task 2.1.4: JWT Strategy & Guards
**Estimated Time**: 3 hours
**Priority**: Critical
**Dependencies**: 2.1.2

- [ ] Create JWT strategy (Passport)
- [ ] Create JWT auth guard
- [ ] Create roles guard
- [ ] Create @CurrentUser() decorator
- [ ] Create @Roles() decorator
- [ ] Create @Public() decorator (skip auth)
- [ ] Implement token refresh logic
- [ ] Create POST `/api/v1/auth/refresh` endpoint
- [ ] Create POST `/api/v1/auth/logout` endpoint
- [ ] Write unit tests

**Acceptance Criteria:**
- Protected routes require valid JWT
- Can refresh access token
- Role-based access control working
- Logout revokes refresh token

---

### Task 2.1.5: Password Management
**Estimated Time**: 3 hours
**Priority**: Medium
**Dependencies**: 2.1.2

- [ ] Implement forgot password flow
  - Generate reset token (JWT with 1h expiry)
  - Send reset link via email
- [ ] Implement reset password
  - Verify reset token
  - Update password
  - Revoke all refresh tokens
- [ ] Implement change password (authenticated)
  - Verify current password
  - Update to new password
- [ ] Create POST `/api/v1/auth/forgot-password` endpoint
- [ ] Create POST `/api/v1/auth/reset-password` endpoint
- [ ] Create POST `/api/v1/auth/change-password` endpoint
- [ ] Write unit tests

**Acceptance Criteria:**
- Can request password reset
- Reset link works
- Can change password when logged in

---

## Phase 2.2: Users & Students Module

### Task 2.2.1: Users Module Setup
**Estimated Time**: 2 hours
**Priority**: High
**Dependencies**: 2.1.4

- [ ] Create users module
- [ ] Create users controller
- [ ] Create users service
- [ ] Create users repository (if using repository pattern)
- [ ] Create DTOs
  - UpdateUserDTO
  - CreateUserDTO (admin only)

**Acceptance Criteria:**
- Module structure in place
- DTOs created

---

### Task 2.2.2: User Profile APIs
**Estimated Time**: 3 hours
**Priority**: High
**Dependencies**: 2.2.1

- [ ] Implement GET `/api/v1/users/me`
  - Return current user profile
  - Exclude sensitive fields (password)
- [ ] Implement PATCH `/api/v1/users/me`
  - Update user profile
  - Validate inputs
  - Handle email/phone uniqueness
- [ ] Implement profile picture upload (future)
- [ ] Write unit tests
- [ ] Write integration tests

**Acceptance Criteria:**
- Can fetch own profile
- Can update profile
- Validation working

---

### Task 2.2.3: Students Module
**Estimated Time**: 4 hours
**Priority**: High
**Dependencies**: 2.2.1

- [ ] Create students module
- [ ] Create students controller
- [ ] Create students service
- [ ] Create DTOs
  - CreateStudentDTO
  - UpdateStudentDTO
- [ ] Implement GET `/api/v1/students` (list parent's students)
- [ ] Implement POST `/api/v1/students` (create student)
- [ ] Implement GET `/api/v1/students/:id`
- [ ] Implement PATCH `/api/v1/students/:id` (update)
- [ ] Implement DELETE `/api/v1/students/:id` (soft delete)
- [ ] Add ownership validation (parent can only access their students)
- [ ] Write tests

**Acceptance Criteria:**
- Parent can manage their students
- Cannot access other parent's students
- Validation working (e.g., valid school ID)

---

## Phase 2.3: Schools & Meal Plans Module

### Task 2.3.1: Schools Module
**Estimated Time**: 4 hours
**Priority**: High
**Dependencies**: Phase 1

- [ ] Create schools module
- [ ] Create schools controller
- [ ] Create schools service
- [ ] Create DTOs
  - CreateSchoolDTO
  - UpdateSchoolDTO
- [ ] Implement GET `/api/v1/schools` (public, with filters)
  - Filter by city
  - Filter by service availability
  - Pagination
- [ ] Implement GET `/api/v1/schools/:id` (public)
- [ ] Implement POST `/api/v1/schools` (admin only)
- [ ] Implement PATCH `/api/v1/schools/:id` (admin only)
- [ ] Implement PATCH `/api/v1/schools/:id/service-availability` (admin)
- [ ] Add Redis caching for school list
- [ ] Write tests

**Acceptance Criteria:**
- Public can view schools
- Admin can create/update schools
- Caching working (5 min TTL)

---

### Task 2.3.2: Meal Plans Module
**Estimated Time**: 4 hours
**Priority**: High
**Dependencies**: 2.3.1

- [ ] Create meal-plans module
- [ ] Create meal-plans controller
- [ ] Create meal-plans service
- [ ] Create DTOs
  - CreateMealPlanDTO
  - UpdateMealPlanDTO
- [ ] Implement GET `/api/v1/meal-plans?schoolId=xxx`
- [ ] Implement GET `/api/v1/meal-plans/:id`
- [ ] Implement POST `/api/v1/meal-plans` (admin)
- [ ] Implement PATCH `/api/v1/meal-plans/:id` (admin)
- [ ] Implement DELETE `/api/v1/meal-plans/:id` (admin, soft delete)
- [ ] Add Redis caching
- [ ] Write tests

**Acceptance Criteria:**
- Can list meal plans by school
- Admin can manage meal plans
- Caching working

---

### Task 2.3.3: Menu Items Module
**Estimated Time**: 3 hours
**Priority**: Medium
**Dependencies**: 2.3.2

- [ ] Create menu-items module (or part of meal-plans)
- [ ] Create DTOs
  - CreateMenuItemDTO
  - UpdateMenuItemDTO
- [ ] Implement GET `/api/v1/meal-plans/:id/menu`
- [ ] Implement POST `/api/v1/meal-plans/:id/menu` (admin)
- [ ] Implement PATCH `/api/v1/menu-items/:id` (admin)
- [ ] Implement DELETE `/api/v1/menu-items/:id` (admin)
- [ ] Write tests

**Acceptance Criteria:**
- Can view menu for a meal plan
- Admin can manage menu items

---

## Phase 2.4: Subscriptions Module (Core)

### Task 2.4.1: Subscription Engine Service
**Estimated Time**: 6 hours
**Priority**: Critical
**Dependencies**: 2.3.2

- [ ] Create subscriptions module
- [ ] Create subscription-engine service
- [ ] Implement `generateDeliverySchedule()` function
  - Parse school operating days
  - Generate N operating days from start date
  - Skip weekends/holidays
  - Return array of dates
- [ ] Implement `generateSubscriptionNumber()` utility
- [ ] Write comprehensive unit tests for schedule generation
  - Test with different operating days
  - Test with different start dates
  - Test boundary conditions

**Acceptance Criteria:**
- Schedule generation working correctly
- All edge cases covered in tests
- Logic matches LLD specification

---

### Task 2.4.2: Create Subscription API
**Estimated Time**: 5 hours
**Priority**: Critical
**Dependencies**: 2.4.1

- [ ] Create subscriptions controller
- [ ] Create subscriptions service
- [ ] Create CreateSubscriptionDTO
- [ ] Implement POST `/api/v1/subscriptions`
  - Validate student ID (belongs to parent)
  - Validate meal plan ID
  - Get school operating days
  - Generate delivery schedule
  - Create subscription record
  - Create subscription_days records (bulk)
  - Return subscription with schedule
- [ ] Add transaction handling
- [ ] Write integration tests

**Acceptance Criteria:**
- Can create subscription successfully
- Schedule generated correctly
- Database records created
- Returns proper response

---

### Task 2.4.3: Subscription Management APIs
**Estimated Time**: 4 hours
**Priority**: High
**Dependencies**: 2.4.2

- [ ] Implement GET `/api/v1/subscriptions` (user's subscriptions)
  - Filter by status
  - Filter by student
  - Pagination
- [ ] Implement GET `/api/v1/subscriptions/:id`
  - Include student, school, meal plan details
  - Include delivery statistics
- [ ] Implement GET `/api/v1/subscriptions/:id/schedule`
  - Return delivery calendar
  - Show status for each date
- [ ] Implement POST `/api/v1/subscriptions/:id/cancel`
  - Calculate refund amount
  - Mark as cancelled
  - Queue notification
- [ ] Add ownership validation
- [ ] Write tests

**Acceptance Criteria:**
- Parent can view their subscriptions
- Can view detailed schedule
- Can cancel subscription
- Refund calculation correct

---

## Phase 2.5: Pause Management Module

### Task 2.5.1: Pause Request APIs
**Estimated Time**: 5 hours
**Priority**: High
**Dependencies**: 2.4.3

- [ ] Create pause-requests module
- [ ] Create DTOs
  - CreatePauseRequestDTO
- [ ] Implement POST `/api/v1/pause-requests`
  - Validate subscription is active
  - Validate dates (not in past)
  - Check no overlapping pause requests
  - Calculate affected days
  - Calculate new end date
  - Create pause request record
  - Return request with impact details
- [ ] Implement GET `/api/v1/pause-requests`
  - List user's pause requests
  - Filter by status
- [ ] Implement DELETE `/api/v1/pause-requests/:id` (cancel before approval)
- [ ] Write tests

**Acceptance Criteria:**
- Can create pause request
- Affected days calculated correctly
- New end date calculated correctly
- Validations working

---

### Task 2.5.2: Pause Request Approval (Admin)
**Estimated Time**: 4 hours
**Priority**: High
**Dependencies**: 2.5.1

- [ ] Implement PATCH `/api/v1/pause-requests/:id/status` (admin only)
  - Accept status: APPROVED or REJECTED
  - Update pause request status
  - If approved, queue pause processing job
- [ ] Create pause processing job (BullMQ)
  - Update subscription_days to PAUSED
  - Extend subscription end date
  - Create new subscription_days for extension
  - Update subscription record
  - Mark pause request as PROCESSED
  - Send notification to parent
- [ ] Write tests for job processor

**Acceptance Criteria:**
- Admin can approve/reject pause requests
- Approval triggers background job
- Schedule updated correctly
- Subscription extended

---

## Phase 2.6: Orders & Payments Module

### Task 2.6.1: Orders Module Setup
**Estimated Time**: 3 hours
**Priority**: Critical
**Dependencies**: 2.4.2

- [ ] Create orders module
- [ ] Create orders controller
- [ ] Create orders service
- [ ] Create DTOs
  - CreateOrderDTO
- [ ] Implement order number generation
- [ ] Create order entity relationships

**Acceptance Criteria:**
- Module structure ready
- Order creation logic skeleton

---

### Task 2.6.2: Payment Integration (Razorpay)
**Estimated Time**: 6 hours
**Priority**: Critical
**Dependencies**: 2.6.1

- [ ] Create payments module
- [ ] Create RazorpayGateway service
- [ ] Implement POST `/api/v1/payments/create-intent`
  - Validate subscription ID
  - Create order record in database
  - Create Razorpay order
  - Return order details + Razorpay key
- [ ] Implement POST `/api/v1/payments/verify`
  - Verify Razorpay signature
  - Update order status
  - Create payment transaction record
  - Activate subscription
  - Queue notification
- [ ] Implement webhook endpoint POST `/api/v1/webhooks/payment`
  - Verify webhook signature
  - Queue payment processing job
  - Return 200 immediately
- [ ] Create payment processing job
  - Handle payment.success event
  - Handle payment.failed event
  - Update order and subscription
  - Send notifications
- [ ] Write tests (use Razorpay test mode)

**Acceptance Criteria:**
- Can create payment intent
- Can verify payment
- Webhook handling works
- Subscription activated on success
- Idempotency handled

---

### Task 2.6.3: Order Management APIs
**Estimated Time**: 3 hours
**Priority**: Medium
**Dependencies**: 2.6.2

- [ ] Implement GET `/api/v1/orders/:id`
  - Return order with transaction details
- [ ] Implement GET `/api/v1/orders`
  - List user's orders
  - Filter by status
  - Pagination
- [ ] Add ownership validation
- [ ] Write tests

**Acceptance Criteria:**
- Can view order details
- Can list orders
- Only own orders visible

---

## Phase 2.7: Notifications Module

### Task 2.7.1: Notification Service
**Estimated Time**: 4 hours
**Priority**: High
**Dependencies**: Phase 1

- [ ] Create notifications module
- [ ] Create notification service
- [ ] Create FCM provider
- [ ] Create email provider
- [ ] Create SMS provider
- [ ] Implement notification queue processor
  - send-push-notification job
  - send-email job
  - send-sms job
- [ ] Implement notification storage in database
- [ ] Write tests

**Acceptance Criteria:**
- Can send push notifications
- Can send emails
- Can send SMS
- Jobs process successfully

---

### Task 2.7.2: Notification APIs
**Estimated Time**: 3 hours
**Priority**: Medium
**Dependencies**: 2.7.1

- [ ] Implement POST `/api/v1/notifications/register-token`
  - Store FCM token for user
  - Link to user and device
- [ ] Implement GET `/api/v1/notifications`
  - List user's notifications
  - Pagination
  - Filter by read/unread
- [ ] Implement PATCH `/api/v1/notifications/:id/read`
  - Mark as read
- [ ] Implement PATCH `/api/v1/notifications/read-all`
  - Mark all as read
- [ ] Write tests

**Acceptance Criteria:**
- Can register FCM token
- Can list notifications
- Can mark as read

---

## Phase 2.8: Admin APIs

### Task 2.8.1: Admin Dashboard API
**Estimated Time**: 3 hours
**Priority**: Medium
**Dependencies**: 2.4.3, 2.6.2

- [ ] Create admin module
- [ ] Create admin controller
- [ ] Implement GET `/api/v1/admin/dashboard`
  - Count active subscriptions
  - Count today's deliveries
  - Calculate monthly revenue
  - Count pending pause requests
  - Count active schools
  - Cache results for 5 minutes
- [ ] Add admin role guard
- [ ] Write tests

**Acceptance Criteria:**
- Admin can view dashboard stats
- Stats are accurate
- Caching working

---

### Task 2.8.2: Admin Delivery Management
**Estimated Time**: 4 hours
**Priority**: High
**Dependencies**: 2.4.3

- [ ] Implement GET `/api/v1/admin/deliveries`
  - Filter by school
  - Filter by date
  - Return delivery list with student details
  - Pagination
- [ ] Implement GET `/api/v1/admin/deliveries/export`
  - Generate CSV or PDF
  - School-wise delivery list
  - Date range filter
- [ ] Implement PATCH `/api/v1/admin/deliveries/:id/status`
  - Mark delivery as completed
  - Update subscription counters
- [ ] Write tests

**Acceptance Criteria:**
- Admin can view deliveries by school/date
- Can export delivery list
- Can mark deliveries as completed

---

### Task 2.8.3: Admin User Management
**Estimated Time**: 3 hours
**Priority**: Low
**Dependencies**: 2.2.1

- [ ] Implement GET `/api/v1/admin/users`
  - List all users
  - Filter by role
  - Search by email/phone
  - Pagination
- [ ] Implement GET `/api/v1/admin/users/:id`
  - View user details
  - Include students and subscriptions
- [ ] Implement PATCH `/api/v1/admin/users/:id/status`
  - Activate/deactivate user account
- [ ] Write tests

**Acceptance Criteria:**
- Admin can view all users
- Can search and filter
- Can deactivate accounts

---

### Task 2.8.4: Admin Reports
**Estimated Time**: 4 hours
**Priority**: Medium
**Dependencies**: 2.6.3

- [ ] Implement GET `/api/v1/admin/reports/sales`
  - Date range filter
  - School filter
  - Calculate total revenue
  - Calculate subscription count
  - School-wise breakdown
- [ ] Implement GET `/api/v1/admin/reports/subscriptions`
  - Active subscriptions by school
  - Subscription trends (daily/monthly)
- [ ] Add Redis caching for reports
- [ ] Create report generation job for large datasets
- [ ] Write tests

**Acceptance Criteria:**
- Admin can generate sales reports
- Reports accurate
- Large reports processed in background

---

## Phase 2.9: CMS Module

### Task 2.9.1: CMS APIs
**Estimated Time**: 3 hours
**Priority**: Low
**Dependencies**: Phase 1

- [ ] Create cms module
- [ ] Create DTOs
  - CreateCMSPageDTO
  - UpdateCMSPageDTO
- [ ] Implement GET `/api/v1/cms/:slug` (public)
  - Return published page content
  - Cache for 1 hour
- [ ] Implement POST `/api/v1/cms` (admin)
  - Create new CMS page
- [ ] Implement PATCH `/api/v1/cms/:slug` (admin)
  - Update page content
  - Increment version
- [ ] Implement PATCH `/api/v1/cms/:slug/publish` (admin)
  - Mark as published
- [ ] Write tests

**Acceptance Criteria:**
- Can create and update CMS pages
- Public can view published pages
- Caching working

---

## Phase 2.10: File Upload Module

### Task 2.10.1: S3 Upload Service
**Estimated Time**: 3 hours
**Priority**: Medium
**Dependencies**: Phase 1

- [ ] Create uploads module
- [ ] Create S3 service wrapper
- [ ] Implement POST `/api/v1/uploads/image`
  - Accept multipart/form-data
  - Validate file type (jpg, png)
  - Validate file size (max 5MB)
  - Generate unique filename
  - Upload to S3
  - Return public URL
- [ ] Add admin guard
- [ ] Write tests

**Acceptance Criteria:**
- Can upload images successfully
- Files accessible via URL
- Validation working

---

## Phase 2.11: Background Jobs

### Task 2.11.1: Daily Delivery Job
**Estimated Time**: 4 hours
**Priority**: High
**Dependencies**: 2.4.3, 2.7.1

- [ ] Create delivery processor
- [ ] Implement `generate-daily-deliveries` job
  - Fetch today's scheduled deliveries
  - Group by school
  - Generate delivery reports
  - Queue notifications to parents
  - Cache delivery count
- [ ] Create cron job to trigger at 6 AM daily
- [ ] Write tests

**Acceptance Criteria:**
- Job runs daily automatically
- Notifications sent to parents
- Delivery reports generated

---

### Task 2.11.2: Subscription Expiry Job
**Estimated Time**: 2 hours
**Priority**: High
**Dependencies**: 2.4.3

- [ ] Create subscription processor
- [ ] Implement `check-subscription-expiry` job
  - Find active subscriptions with 0 remaining days
  - Mark as completed
  - Queue completion notifications
- [ ] Create cron job to run daily at 11:59 PM
- [ ] Write tests

**Acceptance Criteria:**
- Expired subscriptions marked completed
- Notifications sent

---

### Task 2.11.3: Cleanup Jobs
**Estimated Time**: 3 hours
**Priority**: Low
**Dependencies**: Phase 2 complete

- [ ] Create cleanup processor
- [ ] Implement `cleanup-old-notifications` job
  - Delete read notifications older than 90 days
  - Run weekly
- [ ] Implement `cleanup-expired-tokens` job
  - Delete expired refresh tokens
  - Run daily
- [ ] Implement `archive-completed-subscriptions` job
  - Archive subscriptions older than 1 year
  - Run monthly
- [ ] Write tests

**Acceptance Criteria:**
- Old data cleaned up automatically
- No performance impact on database

---

## Phase 2.12: API Testing & Documentation

### Task 2.12.1: Unit Tests
**Estimated Time**: 8 hours
**Priority**: High
**Dependencies**: Phase 2 modules

- [ ] Write unit tests for all services
  - Auth service
  - Subscription engine
  - Payment service
  - Notification service
- [ ] Aim for >80% code coverage
- [ ] Mock external dependencies
- [ ] Use test database

**Acceptance Criteria:**
- All critical business logic tested
- Tests passing
- Coverage > 80%

---

### Task 2.12.2: Integration Tests
**Estimated Time**: 6 hours
**Priority**: Medium
**Dependencies**: Phase 2 modules

- [ ] Write E2E tests for critical flows
  - User registration → login
  - Subscription creation → payment → activation
  - Pause request → approval → schedule update
- [ ] Use test database
- [ ] Mock external APIs (payment, SMS)

**Acceptance Criteria:**
- Critical flows tested end-to-end
- Tests passing

---

### Task 2.12.3: API Documentation
**Estimated Time**: 4 hours
**Priority**: Medium
**Dependencies**: Phase 2 APIs

- [ ] Complete Swagger documentation
  - Add descriptions to all endpoints
  - Add request/response examples
  - Add authentication requirements
- [ ] Generate Postman collection
- [ ] Create API usage guide
- [ ] Document error codes

**Acceptance Criteria:**
- All APIs documented in Swagger
- Postman collection available
- Documentation accurate

---

## Summary

**Total Estimated Time**: ~120 hours (3-4 weeks with 1-2 developers)

**Critical Path**: 
Auth (2.1) → Users/Students (2.2) → Schools/Meals (2.3) → Subscriptions (2.4) → Payments (2.6)

**Deliverables:**
- ✅ Complete REST API with all endpoints
- ✅ Authentication & authorization
- ✅ Subscription engine with schedule management
- ✅ Payment integration
- ✅ Background jobs
- ✅ Admin APIs
- ✅ Comprehensive tests
- ✅ API documentation

**Next Phase**: Mobile App Development
