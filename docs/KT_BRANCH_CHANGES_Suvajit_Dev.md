# KT Branch Change Log: `Suvajit_Dev`

## 1. Branch Snapshot

- Branch: `Suvajit_Dev`
- Base branch: `origin/main`
- Base commit: `a2ec1b4395fe732baf5b6b47157c7e7f152ac140`
- Current HEAD: `b3fe77a36aaf39371fed692db1a7aa8563bb3b67`
- Total branch commits: `4`
- Aggregate diff vs base: `34 files changed, 7751 insertions(+), 2817 deletions(-)`

## 2. Commit Timeline (oldest -> newest)

| Date       | Commit    | Type     | Message                                              |
| ---------- | --------- | -------- | ---------------------------------------------------- |
| 2026-02-24 | `e2e7ff5` | fix      | auth lint and backend setup                          |
| 2026-03-04 | `687254d` | refactor | formatting + DTO improvements for schools/meal plans |
| 2026-03-04 | `78799fa` | feat     | user management pagination/filter enhancements       |
| 2026-03-06 | `b3fe77a` | feat     | admin API alignment + CMS slug routing               |

## 3. KT Highlights by Theme

### A. Backend setup and auth cleanup (`e2e7ff5`)

- Backend runtime/dev setup updated (`Dockerfile.dev`, `docker-compose.yml`, root/backend package config).
- Auth service lint and setup alignment updates.
- Prisma schema/seed updates and lockfile refresh.

### B. DTO and form contract hardening (`687254d`)

- School DTOs updated to improve backend validation and payload clarity.
- Meal plan controller/service refactored for cleaner request handling.
- Admin school create/edit UI adjusted to match revised DTO expectations.

### C. Admin user management enhancement (`78799fa`)

- Added paginated/filter-capable user listing in admin:
  - Frontend service sends `skip`, `take`, `isActive`, `role`, `search`.
  - Backend admin controller/service supports these filters and returns pagination metadata.

### D. Admin route alignment and contract fixes (`b3fe77a`)

- Frontend admin services aligned to backend routes and methods.
- Added/extended backend admin endpoints for orders, subscriptions, pause requests, deliveries export, sales export, recent activity.
- CMS switched to slug-based edit flow and service calls.
- Schools list filtering enhanced with `search` and `isServiceAvailable`.

## 4. API Delta (Admin Module)

### New/extended admin endpoints

- `GET /v1/admin/recent-activity`
- `POST /v1/admin/deliveries/mark-delivered`
- `GET /v1/admin/deliveries/export`
- `GET /v1/admin/orders`
- `GET /v1/admin/orders/:id`
- `GET /v1/admin/orders/export`
- `GET /v1/admin/subscriptions`
- `GET /v1/admin/subscriptions/:id`
- `GET /v1/admin/subscriptions/:id/schedule`
- `DELETE /v1/admin/subscriptions/:id`
- `GET /v1/admin/pause-requests`
- `GET /v1/admin/pause-requests/:id`
- `PATCH /v1/admin/pause-requests/:id/status`
- `GET /v1/admin/reports/sales/export`

### Key method/path corrections

- Delivery status update now uses `PATCH /admin/deliveries/:id/status?status=...`
- Change password uses `PATCH /auth/change-password` (not `POST`)
- Subscription cancel uses `DELETE` on admin subscription route
- Pause approve/reject uses status patch route

## 5. File-Specific Change Register

### IDE/Workspace

| File                    | Commit(s)            | What changed                                                                         |
| ----------------------- | -------------------- | ------------------------------------------------------------------------------------ |
| `.vscode/settings.json` | `687254d`, `78799fa` | Workspace settings cleanup/adjustment while refactoring and user-management updates. |

### Admin Frontend

| File                                                            | Commit(s) | What changed                                                                             |
| --------------------------------------------------------------- | --------- | ---------------------------------------------------------------------------------------- |
| `apps/admin/src/App.tsx`                                        | `b3fe77a` | CMS edit route moved to slug param (`/cms/:slug/edit`).                                  |
| `apps/admin/src/pages/cms/CMSEditorPage.tsx`                    | `b3fe77a` | Editor now reads slug from route and uses slug-based CMS service calls.                  |
| `apps/admin/src/pages/cms/CMSListPage.tsx`                      | `b3fe77a` | Publish/unpublish/edit/delete operations switched from id-driven to slug-driven actions. |
| `apps/admin/src/pages/deliveries/DeliveriesPage.tsx`            | `b3fe77a` | Delivery export/actions aligned to available backend behavior; UI cleanup done.          |
| `apps/admin/src/pages/schools/SchoolCreatePage.tsx`             | `687254d` | Form payload handling updated to match revised school DTO contract.                      |
| `apps/admin/src/pages/schools/SchoolEditPage.tsx`               | `687254d` | Edit form structure/field handling refactored to match updated DTO validation.           |
| `apps/admin/src/pages/subscriptions/SubscriptionDetailPage.tsx` | `b3fe77a` | Subscription cancel integration moved to updated admin endpoint contract.                |
| `apps/admin/src/pages/users/UsersListPage.tsx`                  | `78799fa` | Added pagination/filter-aware user list interactions.                                    |
| `apps/admin/src/services/adminService.ts`                       | `b3fe77a` | Delivery status call contract fixed; export/mark-delivered integrations aligned.         |
| `apps/admin/src/services/authService.ts`                        | `b3fe77a` | `changePassword` method switched to `PATCH`.                                             |
| `apps/admin/src/services/cmsService.ts`                         | `b3fe77a` | CMS service moved to slug-based fetch/update/delete/publish paths.                       |
| `apps/admin/src/services/orderService.ts`                       | `b3fe77a` | Admin order list/detail/export routes switched to `/admin/orders...`.                    |
| `apps/admin/src/services/pauseRequestService.ts`                | `b3fe77a` | Pause actions/list endpoints switched to admin routes and status patch flow.             |
| `apps/admin/src/services/subscriptionService.ts`                | `b3fe77a` | Subscription list/detail/schedule/cancel switched to admin routes and `DELETE` cancel.   |
| `apps/admin/src/services/userService.ts`                        | `78799fa` | Added skip/take/isActive-based admin user fetching with pagination response shape.       |

### Backend API and Domain

| File                                                   | Commit(s)            | What changed                                                                                                                                       |
| ------------------------------------------------------ | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/backend/src/admin/admin.controller.ts`           | `78799fa`, `b3fe77a` | Added pagination-aware user APIs first; then expanded with deliveries/orders/subscriptions/pause-requests/report export/recent-activity endpoints. |
| `apps/backend/src/admin/admin.service.ts`              | `78799fa`, `b3fe77a` | Added user pagination/filter logic; later implemented admin data services for exports, orders, subscriptions, pause requests, and recent activity. |
| `apps/backend/src/app.controller.ts`                   | `e2e7ff5`            | Minor setup/lint-alignment changes.                                                                                                                |
| `apps/backend/src/auth/auth.service.ts`                | `e2e7ff5`            | Auth service cleanup and lint/setup alignment.                                                                                                     |
| `apps/backend/src/main.ts`                             | `e2e7ff5`            | Bootstrap/config alignment updates.                                                                                                                |
| `apps/backend/src/meal-plans/meal-plans.controller.ts` | `687254d`            | Refactored request handling/structure for meal-plan APIs.                                                                                          |
| `apps/backend/src/meal-plans/meal-plans.service.ts`    | `687254d`            | Service-side updates to support refactored meal-plan request/validation behavior.                                                                  |
| `apps/backend/src/schools/dto/create-school.dto.ts`    | `687254d`            | DTO validation/shape improvements for school creation.                                                                                             |
| `apps/backend/src/schools/dto/update-school.dto.ts`    | `687254d`            | DTO validation/shape improvements for school updates.                                                                                              |
| `apps/backend/src/schools/schools.controller.ts`       | `b3fe77a`            | Added parsing/support for `search` and `isServiceAvailable` filters on schools listing.                                                            |
| `apps/backend/src/schools/schools.service.ts`          | `b3fe77a`            | Implemented schools filtering logic and cache key update for new query dimensions.                                                                 |

### Infra/Config/Dependencies

| File                                | Commit(s) | What changed                                             |
| ----------------------------------- | --------- | -------------------------------------------------------- |
| `apps/backend/Dockerfile.dev`       | `e2e7ff5` | Backend dev container setup adjustments.                 |
| `apps/backend/package.json`         | `e2e7ff5` | Backend dependency/script alignment for setup/lint flow. |
| `apps/backend/prisma/schema.prisma` | `e2e7ff5` | Prisma schema setup adjustment(s).                       |
| `apps/backend/prisma/seed.ts`       | `e2e7ff5` | Seed script aligned with setup/schema changes.           |
| `docker-compose.yml`                | `e2e7ff5` | Compose setup revised for backend/dev environment flow.  |
| `package.json`                      | `e2e7ff5` | Root-level setup script/dependency cleanup.              |
| `pnpm-lock.yaml`                    | `e2e7ff5` | Lockfile refresh due dependency/setup updates.           |

## 6. KT Handover Notes (What to Explain in Session)

- Why admin frontend had route drift from backend and how it was normalized.
- Why CMS moved to slug-based routing and where it impacts navigation/edit/publish.
- How admin-specific list/detail endpoints differ from parent-scoped endpoints.
- How schools filtering now works (`city`, `search`, `isServiceAvailable`) and cache implications.
- Export endpoints behavior (deliveries/orders/sales CSV generation path in admin service).

## 7. Quick Verification Checklist for KT Demo

- Admin login works and token refresh behavior is unchanged.
- Users page: pagination + role/search/isActive filters return expected results.
- CMS list/edit/publish flows work via slug routes.
- Deliveries page: mark delivered + export call succeeds.
- Orders/Subcriptions/Pause Requests pages load using new admin routes.
- Sales report export endpoint returns downloadable CSV.

## 8. Post-KT Stability Update (2026-03-07)

- Problem observed repeatedly: commit hook failures for long/non-conventional commit messages.
- Permanent fix implemented: commit message auto-normalization before commitlint validation.

### Files added/updated for fix

| File                              | Change                                                                                                      |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `.husky/commit-msg`               | Added pre-commitlint step to run message normalizer script before `commitlint --edit`.                      |
| `scripts/normalize-commit-msg.js` | New utility that auto-corrects commit messages to conventional format and wraps lines for commitlint rules. |

### Behavior after fix

- Non-conventional headers are auto-converted to valid type-prefixed format.
- Overlong headers are trimmed safely; overflow details move to body.
- Body lines are wrapped to avoid line-length violations.
- Commitlint remains active and validates normalized output.

---

Generated/updated for branch KT on: 2026-03-07
