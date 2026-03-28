import { Spin } from 'antd';
import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';

// Lazy load pages for better performance
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const SchoolsListPage = lazy(() => import('./pages/schools/SchoolsListPage'));
const SchoolCreatePage = lazy(() => import('./pages/schools/SchoolCreatePage'));
const SchoolEditPage = lazy(() => import('./pages/schools/SchoolEditPage'));
const MealPlansListPage = lazy(() => import('./pages/meal-plans/MealPlansListPage'));
const MealPlanCreatePage = lazy(() => import('./pages/meal-plans/MealPlanCreatePage'));
const MealPlanEditPage = lazy(() => import('./pages/meal-plans/MealPlanEditPage'));
const MenuManagementPage = lazy(() => import('./pages/meal-plans/MenuManagementPage'));
const SubscriptionsListPage = lazy(() => import('./pages/subscriptions/SubscriptionsListPage'));
const SubscriptionDetailPage = lazy(() => import('./pages/subscriptions/SubscriptionDetailPage'));
const OrdersListPage = lazy(() => import('./pages/orders/OrdersListPage'));
const OrderDetailPage = lazy(() => import('./pages/orders/OrderDetailPage'));
const UsersListPage = lazy(() => import('./pages/users/UsersListPage'));
const UserDetailPage = lazy(() => import('./pages/users/UserDetailPage'));
const PauseRequestsPage = lazy(() => import('./pages/pause-requests/PauseRequestsPage'));
const DeliveriesPage = lazy(() => import('./pages/deliveries/DeliveriesPage'));
const SalesReportPage = lazy(() => import('./pages/reports/SalesReportPage'));
const SubscriptionsReportPage = lazy(() => import('./pages/reports/SubscriptionsReportPage'));
const CMSListPage = lazy(() => import('./pages/cms/CMSListPage'));
const CMSEditorPage = lazy(() => import('./pages/cms/CMSEditorPage'));
const CMSPreviewPage = lazy(() => import('./pages/cms/CMSPreviewPage'));
const ProfilePage = lazy(() => import('./pages/profile/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/settings/SettingsPage'));

// Loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Spin size="large" tip="Loading..." />
  </div>
);

type HorizontalScrollHost = {
  scrollWidth: number;
  clientWidth: number;
  scrollLeft: number;
};

const asHorizontalScrollHost = (value: unknown): HorizontalScrollHost | null => {
  if (!value || typeof value !== 'object') return null;

  if (!('scrollWidth' in value) || !('clientWidth' in value) || !('scrollLeft' in value)) {
    return null;
  }

  const candidate = value as {
    scrollWidth?: unknown;
    clientWidth?: unknown;
    scrollLeft?: unknown;
  };

  if (
    typeof candidate.scrollWidth !== 'number' ||
    typeof candidate.clientWidth !== 'number' ||
    typeof candidate.scrollLeft !== 'number'
  ) {
    return null;
  }

  return value as HorizontalScrollHost;
};

const findHorizontalScrollHost = (eventTarget: unknown): HorizontalScrollHost | null => {
  if (
    !eventTarget ||
    typeof eventTarget !== 'object' ||
    !('closest' in eventTarget) ||
    typeof (eventTarget as { closest?: unknown }).closest !== 'function'
  ) {
    return null;
  }

  const closestScrollable = (eventTarget as { closest: (selector: string) => unknown }).closest(
    '.ant-table-content, .ant-table-body, .table-scrollbar',
  );
  return asHorizontalScrollHost(closestScrollable);
};

type WheelLikeEvent = {
  target?: unknown;
  deltaX?: unknown;
  deltaY?: unknown;
  preventDefault?: () => void;
};

type SmoothScrollState = {
  target: number;
  current: number;
  rafId: number | null;
};

const HORIZONTAL_SCROLL_EASING = 0.14;
const HORIZONTAL_SCROLL_STOP_THRESHOLD = 0.2;
const HORIZONTAL_SCROLL_WHEEL_SCALE = 0.75;
const HORIZONTAL_SCROLL_MAX_WHEEL_DELTA = 72;

const smoothScrollStates = new WeakMap<object, SmoothScrollState>();

function App() {
  useEffect(() => {
    const animateToTarget = (scrollHost: HorizontalScrollHost) => {
      const key = scrollHost as object;
      const state = smoothScrollStates.get(key);
      if (!state) return;

      const maxScrollLeft = Math.max(scrollHost.scrollWidth - scrollHost.clientWidth, 0);
      state.target = Math.min(Math.max(state.target, 0), maxScrollLeft);
      state.current += (state.target - state.current) * HORIZONTAL_SCROLL_EASING;

      if (Math.abs(state.target - state.current) < HORIZONTAL_SCROLL_STOP_THRESHOLD) {
        state.current = state.target;
      }

      scrollHost.scrollLeft = state.current;

      if (Math.abs(state.target - state.current) < HORIZONTAL_SCROLL_STOP_THRESHOLD) {
        state.rafId = null;
        return;
      }

      state.rafId = window.requestAnimationFrame(() => {
        animateToTarget(scrollHost);
      });
    };

    const handleWheel = (event: unknown) => {
      if (!event || typeof event !== 'object') return;

      const wheelLike = event as WheelLikeEvent;
      if (
        typeof wheelLike.deltaX !== 'number' ||
        typeof wheelLike.deltaY !== 'number' ||
        typeof wheelLike.preventDefault !== 'function'
      ) {
        return;
      }

      const scrollHost = findHorizontalScrollHost(wheelLike.target);
      if (!scrollHost) return;

      const hasHorizontalOverflow = scrollHost.scrollWidth - scrollHost.clientWidth > 1;
      if (!hasHorizontalOverflow) return;

      const delta =
        Math.abs(wheelLike.deltaX) > Math.abs(wheelLike.deltaY)
          ? wheelLike.deltaX
          : wheelLike.deltaY;
      if (delta === 0) return;

      const key = scrollHost as unknown as object;
      const existingState = smoothScrollStates.get(key);
      const state = existingState || {
        target: scrollHost.scrollLeft,
        current: scrollHost.scrollLeft,
        rafId: null,
      };

      const maxScrollLeft = Math.max(scrollHost.scrollWidth - scrollHost.clientWidth, 0);
      const limitedDelta =
        Math.sign(delta) * Math.min(Math.abs(delta), HORIZONTAL_SCROLL_MAX_WHEEL_DELTA);
      const adjustedDelta = limitedDelta * HORIZONTAL_SCROLL_WHEEL_SCALE;
      state.target = Math.min(Math.max(state.target + adjustedDelta, 0), maxScrollLeft);

      if (!existingState) {
        smoothScrollStates.set(key, state);
      }

      if (state.rafId === null) {
        state.current = scrollHost.scrollLeft;
        state.rafId = window.requestAnimationFrame(() => {
          animateToTarget(scrollHost);
        });
      }

      wheelLike.preventDefault();
    };

    const wheelListener = (event: unknown) => {
      handleWheel(event);
    };

    document.addEventListener('wheel', wheelListener, { passive: false });
    return () => {
      document.removeEventListener('wheel', wheelListener);
    };
  }, []);

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Auth routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Protected routes */}
          <Route element={<PrivateRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />

              {/* Schools */}
              <Route path="/schools" element={<SchoolsListPage />} />
              <Route path="/schools/create" element={<SchoolCreatePage />} />
              <Route path="/schools/:id/edit" element={<SchoolEditPage />} />

              {/* Meal Plans */}
              <Route path="/meal-plans" element={<MealPlansListPage />} />
              <Route path="/meal-plans/create" element={<MealPlanCreatePage />} />
              <Route path="/meal-plans/:id/edit" element={<MealPlanEditPage />} />
              <Route path="/meal-plans/:id/menu" element={<MenuManagementPage />} />

              {/* Subscriptions */}
              <Route path="/subscriptions" element={<SubscriptionsListPage />} />
              <Route path="/subscriptions/:id" element={<SubscriptionDetailPage />} />

              {/* Orders */}
              <Route path="/orders" element={<OrdersListPage />} />
              <Route path="/orders/:id" element={<OrderDetailPage />} />

              {/* Users */}
              <Route path="/users" element={<UsersListPage />} />
              <Route path="/users/:id" element={<UserDetailPage />} />

              {/* Pause Requests */}
              <Route path="/pause-requests" element={<PauseRequestsPage />} />

              {/* Deliveries */}
              <Route path="/deliveries" element={<DeliveriesPage />} />

              {/* Reports */}
              <Route path="/reports/sales" element={<SalesReportPage />} />
              <Route path="/reports/subscriptions" element={<SubscriptionsReportPage />} />

              {/* CMS */}
              <Route path="/cms" element={<CMSListPage />} />
              <Route path="/cms/create" element={<CMSEditorPage />} />
              <Route path="/cms/:slug/edit" element={<CMSEditorPage />} />
              <Route path="/cms/:slug/preview" element={<CMSPreviewPage />} />

              {/* Account */}
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
