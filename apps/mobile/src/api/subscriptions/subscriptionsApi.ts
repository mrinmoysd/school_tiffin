import { apiRequest } from '../client/apiClient';
import { Subscription, SubscriptionStatus } from './subscriptionsApi.types';

export const subscriptionsApi = {
  getSubscriptions: async (status?: SubscriptionStatus): Promise<Subscription[]> => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';

    return apiRequest<Subscription[]>(`/subscriptions${query}`, {
      method: 'GET',
      requiresAuth: true,
    });
  },
};
