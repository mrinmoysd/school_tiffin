import { apiRequest } from '../client/apiClient';
import { ApiClientError } from '../client/apiClient';
import {
  CancelSubscriptionResponse,
  CreatePauseRequestPayload,
  CreateSubscriptionPayload,
  PauseRequestResponse,
  Subscription,
  SubscriptionDetails,
  SubscriptionScheduleDay,
  SubscriptionStatus,
} from './subscriptionsApi.types';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const normalizeStartDate = (value: string) => {
  const trimmed = value.trim();
  const candidate = trimmed.includes('T') ? trimmed.slice(0, 10) : trimmed;

  if (!DATE_REGEX.test(candidate)) {
    throw new ApiClientError('Invalid start date format. Expected YYYY-MM-DD.');
  }

  return candidate;
};

const normalizeNumberOfDays = (value: number) => {
  const parsed = Math.trunc(Number(value));

  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 365) {
    throw new ApiClientError('Invalid number of days. It must be between 1 and 365.');
  }

  return parsed;
};

const normalizeCreatePayload = (payload: CreateSubscriptionPayload): CreateSubscriptionPayload => ({
  studentId: payload.studentId.trim(),
  mealPlanId: payload.mealPlanId.trim(),
  startDate: normalizeStartDate(payload.startDate),
  numberOfDays: normalizeNumberOfDays(payload.numberOfDays),
});

const normalizePausePayload = (payload: CreatePauseRequestPayload): CreatePauseRequestPayload => ({
  subscriptionId: payload.subscriptionId.trim(),
  startDate: normalizeStartDate(payload.startDate),
  endDate: normalizeStartDate(payload.endDate),
  reason: payload.reason?.trim(),
});

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
      body: JSON.stringify(normalizeCreatePayload(payload)),
    }),

  getSubscriptionSchedule: async (subscriptionId: string): Promise<SubscriptionScheduleDay[]> =>
    apiRequest<SubscriptionScheduleDay[]>(`/subscriptions/${subscriptionId}/schedule`, {
      method: 'GET',
      requiresAuth: true,
    }),

  getSubscriptionById: async (subscriptionId: string): Promise<SubscriptionDetails> =>
    apiRequest<SubscriptionDetails>(`/subscriptions/${subscriptionId}`, {
      method: 'GET',
      requiresAuth: true,
    }),

  cancelSubscription: async (subscriptionId: string): Promise<CancelSubscriptionResponse> =>
    apiRequest<CancelSubscriptionResponse>(`/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
      requiresAuth: true,
    }),

  createPauseRequest: async (payload: CreatePauseRequestPayload): Promise<PauseRequestResponse> =>
    apiRequest<PauseRequestResponse>('/pause-requests', {
      method: 'POST',
      requiresAuth: true,
      body: JSON.stringify(normalizePausePayload(payload)),
    }),
};
