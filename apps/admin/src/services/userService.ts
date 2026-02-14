import api from '@/lib/axios';
import { ApiResponse, User, UserFilters, Student, Subscription, Order } from '@/types';

export const userService = {
  // Get all users
  getAll: async (filters?: UserFilters): Promise<User[]> => {
    const params = new URLSearchParams();
    if (filters?.role) params.append('role', filters.role);
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
    if (filters?.search) params.append('search', filters.search);
    
    const response = await api.get<ApiResponse<User[]>>(`/users?${params.toString()}`);
    return response.data.data;
  },

  // Get user by ID
  getById: async (id: string): Promise<User> => {
    const response = await api.get<ApiResponse<User>>(`/users/${id}`);
    return response.data.data;
  },

  // Get user's students
  getStudents: async (userId: string): Promise<Student[]> => {
    const response = await api.get<ApiResponse<Student[]>>(`/users/${userId}/students`);
    return response.data.data;
  },

  // Get user's subscriptions
  getSubscriptions: async (userId: string): Promise<Subscription[]> => {
    const response = await api.get<ApiResponse<Subscription[]>>(`/users/${userId}/subscriptions`);
    return response.data.data;
  },

  // Get user's orders
  getOrders: async (userId: string): Promise<Order[]> => {
    const response = await api.get<ApiResponse<Order[]>>(`/users/${userId}/orders`);
    return response.data.data;
  },

  // Activate/Deactivate user
  toggleActive: async (id: string, isActive: boolean): Promise<User> => {
    const response = await api.patch<ApiResponse<User>>(`/users/${id}`, { isActive });
    return response.data.data;
  },
};
