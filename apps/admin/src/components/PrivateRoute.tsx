import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/types';
import { Spin } from 'antd';

const PrivateRoute = () => {
  const { isAuthenticated, user, accessToken, hasHydrated } = useAuthStore(state => ({
    isAuthenticated: state.isAuthenticated,
    user: state.user,
    accessToken: state.accessToken,
    hasHydrated: state.hasHydrated,
  }));
  const location = useLocation();
  const hasToken = typeof accessToken === 'string' && accessToken.trim().length > 0;

  // Show loading while hydrating
  if (!hasHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated || !hasToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has admin role
  if (user && user.role !== UserRole.ADMIN && user.role !== UserRole.SCHOOL_ADMIN) {
    // Redirect non-admin users
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
