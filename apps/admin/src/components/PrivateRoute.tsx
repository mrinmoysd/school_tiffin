import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { UserRole } from '@/types';
import { Spin } from 'antd';
import { useEffect, useState } from 'react';

const PrivateRoute = () => {
  const { isAuthenticated, user, accessToken } = useAuthStore();
  const location = useLocation();
  const [isHydrated, setIsHydrated] = useState(false);

  // Wait for Zustand to hydrate from localStorage
  useEffect(() => {
    // Small delay to ensure store is hydrated
    const timer = setTimeout(() => {
      setIsHydrated(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Show loading while hydrating
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }

  console.log('[PrivateRoute] isAuthenticated:', isAuthenticated, 'accessToken:', accessToken ? 'Present' : 'Missing');

  // Check if user is authenticated
  if (!isAuthenticated || !accessToken) {
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
