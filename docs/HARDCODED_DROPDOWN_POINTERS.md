# Hardcoded Dropdowns: Dynamic Data Pointers

This document lists where hardcoded dropdown/menu options live and what to replace them with. Use it as a checklist when wiring dynamic data.

## Currency (Meal Plans)

- File: `apps/admin/src/pages/meal-plans/MealPlanCreatePage.tsx`
  - Current options: `INR (₹)`, `USD ($)`
  - Replace with: currency list from backend or config (e.g., `/settings/currencies`)
- File: `apps/admin/src/pages/meal-plans/MealPlanEditPage.tsx`
  - Current options: `INR (₹)`, `USD ($)`
  - Replace with: same dynamic currency list

## Status Filters (Lists)

- File: `apps/admin/src/pages/meal-plans/MealPlansListPage.tsx`
  - Current options: `Active`, `Inactive`
  - Replace with: backend-driven status list or enum mapping returned by API
- File: `apps/admin/src/pages/users/UsersListPage.tsx`
  - Current options: `Active`, `Inactive`
  - Replace with: backend-driven user status list or enum mapping returned by API
- File: `apps/admin/src/pages/schools/SchoolsListPage.tsx`
  - Current options: `Service Available`, `Service Unavailable`
  - Replace with: backend-driven availability statuses

## Day of Week (Menu Management)

- File: `apps/admin/src/pages/meal-plans/MenuManagementPage.tsx`
  - Current options: `Monday`–`Sunday` (constant array)
  - Replace with: dynamic list from backend or i18n source if locale-specific

## Sidebar Menu (Navigation)

- File: `apps/admin/src/layouts/MainLayout.tsx`
  - Current items: `Dashboard`, `Schools`, `Meal Plans`, `Subscriptions`, `Orders`, `Users`, `Pause Requests`, `Deliveries`, `Reports → Sales Report`, `Reports → Subscriptions Report`, `CMS`
  - Replace with: role/permission-based menu structure from backend (e.g., `/admin/menu`)

## User Dropdown Menu

- File: `apps/admin/src/layouts/MainLayout.tsx`
  - Current items: `Profile`, `Settings`, `Logout`
  - Replace with: dynamic actions from backend or feature flags

## Notes

- This list only covers **hardcoded** dropdown/menu options. Enum-driven dropdowns (e.g., `Object.values(SubscriptionStatus)`) are not included here unless they are meant to be backend-driven.
