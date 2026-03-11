import api from '@/lib/axios';
import { ApiResponse, User, UserFilters, Student, Subscription, Order } from '@/types';

interface AdminUsersListData {
  users: User[];
  pagination: {
    total: number;
    skip: number;
    take: number;
    pages: number;
  };
}

export const userService = {
  // Get all users
  getAll: async (
    filters?: UserFilters,
    skip: number = 0,
    take: number = 20,
  ): Promise<AdminUsersListData> => {
    const params = new globalThis.URLSearchParams();
    if (filters?.role) params.append('role', filters.role);
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
    if (filters?.search) params.append('search', filters.search);
    params.append('skip', String(skip));
    params.append('take', String(take));

    const response = await api.get<ApiResponse<AdminUsersListData>>(
      `/admin/users?${params.toString()}`,
    );
    return response.data.data;
  },

  // Get user by ID
  getById: async (id: string): Promise<User> => {
    const response = await api.get<ApiResponse<User>>(`/admin/users/${id}`);
    return response.data.data;
  },

  // Get user's students
  getStudents: async (userId: string): Promise<Student[]> => {
    const response = await api.get<ApiResponse<Student[]>>(`/admin/users/${userId}/students`);
    return response.data.data;
  },

  // Get user's subscriptions
  getSubscriptions: async (userId: string): Promise<Subscription[]> => {
    const response = await api.get<ApiResponse<Subscription[]>>(
      `/admin/users/${userId}/subscriptions`,
    );
    return response.data.data;
  },

  // Get user's orders
  getOrders: async (userId: string): Promise<Order[]> => {
    const response = await api.get<ApiResponse<Order[]>>(`/admin/users/${userId}/orders`);
    return response.data.data;
  },

  // Activate/Deactivate user
  toggleActive: async (id: string): Promise<User> => {
    // Backend toggles status; no payload needed
    const response = await api.patch<ApiResponse<User>>(`/admin/users/${id}/toggle-status`);
    return response.data.data;
  },
};
