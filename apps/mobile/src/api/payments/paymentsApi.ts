import { apiRequest } from '../client/apiClient';
import {
  CreatePaymentIntentPayload,
  PaymentIntent,
  VerifyPaymentPayload,
  VerifyPaymentResponse,
} from './paymentsApi.types';

const normalizeSubscriptionId = (value: string) => value.trim();

export const paymentsApi = {
  createPaymentIntent: async (payload: CreatePaymentIntentPayload): Promise<PaymentIntent> =>
    apiRequest<PaymentIntent>('/payments/create-intent', {
      method: 'POST',
      requiresAuth: true,
      body: JSON.stringify({
        subscriptionId: normalizeSubscriptionId(payload.subscriptionId),
      }),
    }),

  verifyPayment: async (payload: VerifyPaymentPayload): Promise<VerifyPaymentResponse> =>
    apiRequest<VerifyPaymentResponse>('/payments/verify', {
      method: 'POST',
      requiresAuth: true,
      body: JSON.stringify(payload),
    }),
};
