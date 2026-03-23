import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Important: let browser set multipart boundary for FormData uploads.
    // Keeping default JSON content-type here causes backend to miss uploaded file.
    if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

// Response interceptor - handle errors and token refresh
api.interceptors.response.use(
  response => {
    // Return the data directly for convenience
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const requestUrl = originalRequest?.url || '';
    const isAuthRequest =
      requestUrl.includes('/auth/login') || requestUrl.includes('/auth/refresh');

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
      originalRequest._retry = true;

      const refreshToken = useAuthStore.getState().refreshToken;

      if (refreshToken) {
        try {
          // Try to refresh the token
          const response = await axios.post<{
            data: { accessToken?: string; refreshToken?: string };
          }>(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const accessToken = response.data?.data?.accessToken;
          const newRefreshToken = response.data?.data?.refreshToken;
          if (!accessToken) {
            throw new Error('Invalid refresh token response');
          }

          // Update tokens in store
          useAuthStore.getState().setTokens(accessToken, newRefreshToken);

          // Retry the original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout user
          useAuthStore.getState().logout();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, logout
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }

    // Handle other errors
    const errorMessage =
      (error.response?.data as { message?: string })?.message ||
      error.message ||
      'An unexpected error occurred';

    return Promise.reject(new Error(errorMessage));
  },
);

export default api;
