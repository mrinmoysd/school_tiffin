import { useAuthStore } from '@/stores/authStore';
import { Spin } from 'antd';
import { Navigate, Outlet } from 'react-router-dom';

const AuthLayout = () => {
  const { isAuthenticated, accessToken, hasHydrated } = useAuthStore(state => ({
    isAuthenticated: state.isAuthenticated,
    accessToken: state.accessToken,
    hasHydrated: state.hasHydrated,
  }));
  const hasToken = typeof accessToken === 'string' && accessToken.trim().length > 0;

  if (!hasHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  // If already authenticated, redirect to dashboard
  if (isAuthenticated && hasToken) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="login-bg flex items-center justify-center p-4">
      <Outlet />
    </div>
  );
};

export default AuthLayout;
