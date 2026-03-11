import { apiRequest } from '../client/apiClient';
import {
  CreateSubscriptionPayload,
  Subscription,
  SubscriptionScheduleDay,
  SubscriptionStatus,
} from './subscriptionsApi.types';

export const subscriptionsApi = {
  getSubscriptions: async (status?: SubscriptionStatus): Promise<Subscription[]> => {
    const query = status ? `?status=${encodeURIComponent(status)}` : '';

    return apiRequest<Subscription[]>(`/subscriptions${query}`, {
      method: 'GET',
      requiresAuth: true,
    });
  },

  createSubscription: async (payload: CreateSubscriptionPayload): Promise<Subscription> =>
    apiRequest<Subscription>('/subscriptions', {
      method: 'POST',
      requiresAuth: true,
      body: JSON.stringify(payload),
    }),

  getSubscriptionSchedule: async (subscriptionId: string): Promise<SubscriptionScheduleDay[]> =>
    apiRequest<SubscriptionScheduleDay[]>(`/subscriptions/${subscriptionId}/schedule`, {
      method: 'GET',
      requiresAuth: true,
    }),
};
