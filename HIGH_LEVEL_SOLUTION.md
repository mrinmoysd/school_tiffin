## High-Level Solution – School Tiffin Platform

### 1. Product in one paragraph

The School Tiffin Platform lets **parents** buy and manage school meal subscriptions for their children, while **admins/operations** manage schools, meal plans, menus, subscriptions, deliveries, and reports. Parents interact via a **mobile app**, admins via a **web admin panel**, and a **NestJS backend** coordinates everything: it stores data, enforces business rules (schedules, pauses, expiries), processes payments, runs background jobs, and sends notifications.

---

### 2. System components and responsibilities

- **Mobile App (`apps/mobile`) – Parent-facing**
  - **Tech**: React Native (Expo), TypeScript.
  - **Main responsibilities**:
    - Auth UI (login, register, reset password) and secure token storage.
    - Screens to manage profile, children, schools, meal plans, subscriptions, orders, and notifications.
    - Calling backend REST APIs and handling loading, error, and empty states.
    - Starting Razorpay checkout using data from the backend and reflecting final payment status.

- **Admin Panel (`apps/admin`) – Operations-facing**
  - **Tech**: React (Vite), TypeScript, Ant Design.
  - **Main responsibilities**:
    - Admin auth and protected layout.
    - CRUD UIs for schools, meal plans, menus, users.
    - Workflows for subscriptions, pause requests, deliveries, and reports.
    - Presenting backend data with filters, search, tables, and exports.

- **Backend API (`apps/backend`) – Source of truth**
  - **Tech**: NestJS, PostgreSQL, Prisma, Redis, BullMQ.
  - **Main responsibilities**:
    - Authentication/authorization and role handling.
    - Domain logic and persistence for users, students, schools, plans, menus, subscriptions, deliveries, and orders.
    - Subscription engine: schedule generation, pause/resume logic, end-date extension, expiries.
    - Payments via Razorpay (order creation, capture, webhooks, idempotency).
    - Background jobs for daily deliveries, clean-ups, and notifications.
    - Notifications via FCM/email/SMS based on domain events.

---

### 3. Key business flows (for Dev & QA)

- **Parent journey (mobile + backend)**
  1. Register/login → backend issues tokens → app stores them securely.
  2. Parent creates children and links them to schools.
  3. Parent browses schools and meal plans, views menus, and selects a plan for a child.
  4. App requests price + draft schedule from backend → parent confirms → Razorpay payment.
  5. On successful payment, backend activates subscription and final schedule; failures leave subscription pending/failed.
  6. Daily, backend jobs update deliveries and statuses; app shows active subscriptions, calendar, and history.
  7. Parent can pause/resume/cancel according to rules; backend updates schedule, end date, and deliveries; app reflects changes.

- **Admin journey (admin panel + backend)**
  1. Admin logs in and manages schools, plans, and menus.
  2. Admin monitors subscriptions and (if configured) approves/denies pause requests.
  3. Admin uses deliveries view for daily operations (filters, status updates, exports).
  4. Admin reviews orders, payments, and reports (subscriptions, revenue, deliveries).
  5. Admin optionally manages CMS content and messaging that surfaces in clients.

---

### 4. Implementation & testing phases

- **Phase 1 – Backend & infrastructure (DONE per project docs)**
  - Backend APIs, DB schema, jobs, integrations, and infra are in place and validated.

- **Phase 2 – Mobile App implementation**
  - Build and test flows in this order:
    1. Auth + secure storage.
    2. Profile and children management.
    3. School/plan browsing and plan details.
    4. Subscription creation and Razorpay payment.
    5. Subscription management (view, pause/resume/cancel) and calendar.
    6. Orders/history and notifications.

- **Phase 3 – Admin Panel implementation**
  - Build and test flows in this order:
    1. Admin auth and layout.
    2. Schools, plans, and menus CRUD.
    3. Subscriptions and pause-request workflows.
    4. Deliveries management and exports.
    5. Orders, users, reports, and CMS (if enabled).

- **Phase 4 – End-to-end testing & release**
  - Combine flows: admin sets up data → parent subscribes and uses the service → admin operates deliveries and reviews reports.
  - Run functional, integration, performance, and basic security tests on a staging environment.
  - Prepare production deployment and app store releases using the steps in `TASKS/05_Testing_Deployment.md`.

---

### 5. How to go deeper

- **Developers**: Use this file to understand “who does what”, then follow:
  - `PROJECT_OVERVIEW.md` for product/timeline.
  - `LLD/*.md` for detailed design.
  - `TASKS/*.md` for step-by-step implementation.

- **QA**: Use this file as the big-picture map, then derive test cases from:
  - Parent and admin journeys above.
  - Detailed scenarios and acceptance criteria in `TASKS/03_Mobile_App_Development.md`, `TASKS/04_Admin_Panel_Development.md`, and `TASKS/05_Testing_Deployment.md`.
