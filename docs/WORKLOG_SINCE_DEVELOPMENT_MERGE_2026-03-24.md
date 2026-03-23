# Worklog Since Last `development` Merge (Page-wise, Point-wise)

## 1. Scope & Baseline

- Baseline merge commit: `eec65e5` (2026-03-07) - _Merge branch 'development' into `Suvajit_Dev`_.
- Report window: 2026-03-07 to 2026-03-24.
- Includes:
- All commits from `eec65e5..HEAD` (10 commits).
- Current workspace changes till today (modified + untracked files).
- Snapshot metrics:
- Tracked files changed since baseline: `78`
- Pending modified files in working tree: `40`
- Pending untracked files in working tree: `21`

## 2. Commit Timeline Since Merge

- `d6957b2` (2026-03-07): Admin typing/lint fixes for dashboard/reports/order detail/subscriptions/user detail.
- `4663b2c` (2026-03-10): CMS preview flow added with route wiring; related service/type cleanup.
- `579b149` (2026-03-10): TypeScript config adjustment (`ignoreDeprecations` introduced).
- `ce95008` (2026-03-10): Table readability improvements (nowrap headers, better column behavior).
- `6e5ac16` (2026-03-10): TypeScript config rollback (`ignoreDeprecations` removed).
- `cfb684e` (2026-03-11): Additional table/title readability + scrollbar/ellipsis enhancements.
- `2c29f06` (2026-03-11): Meal plan list filter layout + table scroll usability improvements.
- `aaebfdb` (2026-03-12): School operating-days normalization/validation + subscription engine alignment.
- `d55d2e5` (2026-03-17): Major admin additions (Profile page, Settings page, placeholder image, upload service integration).
- `dcd1d0f` (2026-03-21): Reusable error handling component integration across core listing/report pages.

## 3. Admin Panel Work (Page-wise)

### 3.1 Global Layout & Navigation (`MainLayout`, `AuthLayout`, routes)

- Added/expanded protected routing flow and improved route wiring in `App.tsx`.
- Improved side menu behavior, menu stability, and auth-aware rendering.
- Added dynamic branding logo support in sidebar from settings (`/app-settings/branding`).
- Added favicon sync from branding setting for browser-tab logo reflection.
- Added profile-avatar preview modal behavior in header user area.
- Added CMS preview route integration.

### 3.2 Login Page (`/login`)

- UI/UX refinements for login layout and presentation.
- Better error-handling flow via interceptor/auth-store integration.
- Improved auth-state interactions for smoother login/refresh/logout behavior.

### 3.3 Dashboard (`/dashboard`)

- Table header readability improvements (`whitespace-nowrap`, ellipsis handling).
- Added loading skeleton and error states (`TableSkeleton`, `ErrorState`).
- Improved table scrolling responsiveness for constrained viewports.
- Typing/lint fixes and safer rendering paths for data widgets.

### 3.4 Schools List (`/schools`)

- Enhanced filter/search UX and consistency.
- Improved column formatting for readability and overflow control.
- Added loading/error fallbacks with retry support.
- Improved table horizontal scrolling behavior.

### 3.5 Meal Plans - List (`/meal-plans`)

- Migrated plan-type filtering from hardcoded enum to DB-driven `mealPlanTypeId`.
- Wired meal plan type dropdown options from `meal-plan-types` API.
- Improved filter panel usability and responsive table behavior.
- Added loading/error handling and improved list rendering resilience.

### 3.6 Meal Plans - Create (`/meal-plans/create`)

- Replaced hardcoded plan type with dynamic `mealPlanTypeId` selection.
- Added upload flow integration for meal plan images with placeholder fallback support.
- Improved form data typing and validation alignment with backend DTOs.

### 3.7 Meal Plans - Edit (`/meal-plans/:id/edit`)

- Added dynamic meal plan type selection with active/in-use compatibility.
- Improved image update flow and form reliability.
- Updated payload handling to match `mealPlanTypeId` based backend model.

### 3.8 Menu Management (`/meal-plans/:id/menu`)

- Enhanced type display to prefer relation-based meal plan type display name.
- Improved table usability (scrolling/ellipsis/title readability).
- Strengthened error/loading states and edit/delete flow robustness.

### 3.9 Subscriptions List (`/subscriptions`)

- Improved search/filter/date-range interactions.
- Improved table readability and overflow handling with tooltip/ellipsis behavior.
- Added structured loading and error-state handling.

### 3.10 Subscription Detail (`/subscriptions/:id`)

- Minor UX/data rendering improvements and consistency updates with overall admin style.

### 3.11 Orders List (`/orders`)

- Better filter behavior and CSV export flow stability.
- Improved table readability with nowrap headers + overflow handling.
- Added loading skeleton and reusable error-state integration.

### 3.12 Order Detail (`/orders/:id`)

- Added dynamic tax percentage label in summary (`Tax (x%)`).
- Continued display of subtotal/tax/final amount using order financial fields.
- Typing/readability updates and UI consistency improvements.

### 3.13 Users List (`/users`)

- Improved filter/search/role-status control UX.
- Improved column readability and table responsiveness.
- Added loading skeleton + error state integration.

### 3.14 User Detail (`/users/:id`)

- Added student image column rendering in student grid.
- Improved student/subscription/order tab sections and table display.
- Email verification badge rendering improvements in user profile card.

### 3.15 Pause Requests (`/pause-requests`)

- Improved filter/search/date-range behavior and table readability.
- Added loading/error reusable components.
- Improved action flow resilience and table scrolling behavior.

### 3.16 Deliveries (`/deliveries`)

- Improved table structure/headers for readability.
- Added error/skeleton states and better overflow behavior.
- Improved export and summary card consistency.

### 3.17 Sales Report (`/reports/sales`)

- Improved report filter behavior and export wiring.
- Added reusable error-state handling.
- Updated report data usage to align with final amount (tax-inclusive revenue).

### 3.18 Subscriptions Report (`/reports/subscriptions`)

- Improved filter controls and report table rendering.
- Added reusable error-state patterns and responsive scroll handling.

### 3.19 CMS List (`/cms`) and CMS Editor (`/cms/create`, `/cms/:slug/edit`)

- Added CMS preview workflow integration.
- Improved editor/list behavior and data handling.
- Continued sanitization and safer payload processing.

### 3.20 CMS Preview (`/cms/:slug/preview`)

- New page added for previewing CMS content before/after publishing.

### 3.21 Profile (`/profile`) - New & Expanded

- Added dedicated profile details page and update flow.
- Added **Update Details** modal with name and phone edit support.
- Added user image upload/update/remove flow with cleanup of replaced assets.
- Removed redundant rows from UI where requested in iterations.
- Added verified badge behavior near email field.
- Added image preview support in profile views.

### 3.22 Settings (`/settings`) - New & Expanded

- Added central **Meal Plan Types** management section (collapsible).
- Added **Tax Settings** section for global tax percentage (collapsible).
- Added **Branding Settings** section for global app logo update/remove (collapsible).
- Logo updates now reflect in admin sidebar logo and browser tab icon via shared setting.
- Settings architecture moved from placeholder state to operational control panel.

## 4. Shared Admin Components & Services

### 4.1 Components

- Added reusable `ErrorState` component and integrated across list/report pages.
- Added reusable `TableSkeleton` component for consistent loading UX.
- Added CMS visual builder components (`VisualPageBuilder`, `visualBuilder`) in current workspace.

### 4.2 Services

- Added `uploadService` for image upload/delete integration.
- Added `mealPlanTypeService` for CRUD on centralized meal plan types.
- Added `appSettingService` for tax + branding setting APIs.
- Updated `mealPlanService`, `userService`, `adminService`, `orderService` to align with backend model/API changes.

### 4.3 Types & Store

- Expanded admin types for:
- `mealPlanTypeId` and `MealPlanTypeMaster` relations.
- `TaxSetting` and `BrandingSetting`.
- user/student `profileImageUrl`.
- Improved auth store handling and API error handling behavior.

## 5. Backend Work (Module-wise)

### 5.1 Database Schema & Seed

- Added `profile_image_url` support on `users` and `students`.
- Migrated meal plans from enum plan type to relational `meal_plan_type_id`.
- Added `meal_plan_types` master table.
- Added `app_settings` table for centralized config values.
- Seed updated for:
- default meal plan type masters (`BREAKFAST`, `LUNCH`, `SNACK`, `COMBO`).
- default app settings keys (`TAX_PERCENTAGE`, `APP_LOGO_URL`).

### 5.2 New Backend Module: Meal Plan Types

- Added full module: controller/service/dto/module.
- Added admin CRUD + public fetch endpoints.
- Added validations for code uniqueness, normalization, active/deleted behavior.
- Added safe delete rule when in-use by meal plans.

### 5.3 New Backend Module: App Settings

- Added app settings service/controller/module.
- Added public/admin tax endpoints:
- `GET /v1/app-settings/tax`
- `PATCH /v1/app-settings/tax`
- Added public/admin branding endpoints:
- `GET /v1/app-settings/branding`
- `PATCH /v1/app-settings/branding`
- Used app setting keys for global behavior (`TAX_PERCENTAGE`, `APP_LOGO_URL`).

### 5.4 Meal Plans / Menu Items

- DTOs/services updated to use `mealPlanTypeId` relation-based model.
- Service/controller updates to support centralized type master usage.
- Menu item DTO/service sanitization and validation improvements.

### 5.5 Orders / Payments / Revenue

- Order creation now fetches global tax from app settings.
- Order financial calculation updated to:
- `amount` (subtotal)
- `taxAmount`
- `finalAmount`
- Payment intent and transaction recording shifted to `finalAmount`.
- Admin revenue/reporting logic shifted to `finalAmount` for tax-inclusive totals.

### 5.6 Users / Students / Uploads

- User update flow supports `profileImageUrl`.
- Student create/update flow supports `profileImageUrl`.
- Upload service strengthened:
- broader MIME/extension handling for image uploads.
- content-signature checks and stricter validation paths.
- better resilience for octet-stream cases.

### 5.7 Schools / Subscription Engine

- Added operating-days normalization/validation in schools service.
- Subscription engine aligned with normalized operating-day behavior.

### 5.8 Auth / Sanitization / CMS

- Auth controller/service refinements.
- Sanitization pipe/util improvements for safer payload handling.
- CMS service + update DTO adjustments for editor/preview flow compatibility.

## 6. Migration Inventory Added in Current Workspace

- `20260324000100_add_user_profile_image`:
- Adds `users.profile_image_url` column.
- `20260324000200_add_student_profile_image`:
- Adds `students.profile_image_url` column.
- `20260324000300_add_meal_plan_type_master_table`:
- Creates `meal_plan_types`, seeds defaults, backfills `meal_plans.meal_plan_type_id`, drops legacy enum column.
- `20260324000400_add_app_settings_table`:
- Creates `app_settings` and seeds `TAX_PERCENTAGE`.

## 7. Infra / Tooling / Docs

- `docker-compose.yml` updates applied during this period.
- `pnpm-lock.yaml` updated due dependency/workspace changes.
- Added/updated documentation and status files:
- `TASKS/04_Admin_Panel_Development_Status.md`
- `docs/HARDCODED_DROPDOWN_POINTERS.md`

## 8. Today’s Workspace Status (Not Yet Merged)

- App branding is now centrally manageable from settings and reflected in admin layout.
- Profile and student image flows are integrated with upload/delete behavior.
- Central meal plan type + app settings architecture is active in both backend and admin.
- Tax-setting and revenue propagation changes are implemented in backend services and admin views.
- Pending local changes still need final review, commit, and merge process.

## 9. File Grouping (Quick Reference)

- Frontend pages/components/services touched: `apps/admin/src/**` (profile, settings, meal plans, orders, users, reports, dashboard, cms, shared components).
- Backend modules/services touched: `apps/backend/src/**` (app-settings, meal-plan-types, meal-plans, orders, payments, users, students, uploads, admin, schools, sanitization).
- Database touched: `apps/backend/prisma/schema.prisma`, `apps/backend/prisma/seed.ts`, `apps/backend/prisma/migrations/**`.
