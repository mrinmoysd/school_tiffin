import api from '@/lib/axios';
import { ApiResponse, Subscription, SubscriptionFilters, SubscriptionDay } from '@/types';

export const subscriptionService = {
  // Get all subscriptions
  getAll: async (filters?: SubscriptionFilters): Promise<Subscription[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.schoolId) params.append('schoolId', filters.schoolId);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    
    const response = await api.get<ApiResponse<Subscription[]>>(`/subscriptions?${params.toString()}`);
    return response.data.data;
  },

  // Get subscription by ID
  getById: async (id: string): Promise<Subscription> => {
    const response = await api.get<ApiResponse<Subscription>>(`/subscriptions/${id}`);
    return response.data.data;
  },

  // Get subscription schedule
  getSchedule: async (id: string): Promise<SubscriptionDay[]> => {
    const response = await api.get<ApiResponse<SubscriptionDay[]>>(`/subscriptions/${id}/schedule`);
    return response.data.data;
  },

  // Cancel subscription
  cancel: async (id: string, reason?: string): Promise<Subscription> => {
    const response = await api.post<ApiResponse<Subscription>>(`/subscriptions/${id}/cancel`, { reason });
    return response.data.data;
  },
};
