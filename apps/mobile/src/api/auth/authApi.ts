import { apiRequest } from '../client/apiClient';
import {
  AuthResponse,
  ForgotPasswordRequest,
  LoginRequest,
  MessageResponse,
  RegisterRequest,
  ResetPasswordRequest,
  SendOtpRequest,
  SendOtpResponse,
  VerifyOtpRequest,
} from './authApi.types';

export const authApi = {
  login: async (payload: LoginRequest): Promise<AuthResponse> =>
    apiRequest<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  register: async (payload: RegisterRequest): Promise<AuthResponse> =>
    apiRequest<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  sendOtp: async (payload: SendOtpRequest): Promise<SendOtpResponse> =>
    apiRequest<SendOtpResponse>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  verifyOtp: async (payload: VerifyOtpRequest): Promise<AuthResponse> =>
    apiRequest<AuthResponse>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  forgotPassword: async (payload: ForgotPasswordRequest): Promise<MessageResponse> =>
    apiRequest<MessageResponse>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  resetPassword: async (payload: ResetPasswordRequest): Promise<MessageResponse> =>
    apiRequest<MessageResponse>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
