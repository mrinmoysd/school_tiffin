import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Spin } from 'antd';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import PrivateRoute from './components/PrivateRoute';

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

function App() {
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
