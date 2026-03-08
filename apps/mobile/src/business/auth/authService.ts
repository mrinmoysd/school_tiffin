import { authApi } from '../../api/auth';
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
} from '../../api/auth/authApi.types';
import { tokenStorage } from './tokenStorage';

export const authService = {
  bootstrapSession: async () => tokenStorage.getTokens(),

  login: async (payload: LoginRequest): Promise<AuthResponse> => {
    const response = await authApi.login(payload);
    await tokenStorage.saveTokens(response.tokens);
    return response;
  },

  register: async (payload: RegisterRequest): Promise<AuthResponse> => {
    const response = await authApi.register(payload);
    await tokenStorage.saveTokens(response.tokens);
    return response;
  },

  sendOtp: async (payload: SendOtpRequest): Promise<SendOtpResponse> => authApi.sendOtp(payload),

  verifyOtp: async (payload: VerifyOtpRequest): Promise<AuthResponse> => {
    const response = await authApi.verifyOtp(payload);
    await tokenStorage.saveTokens(response.tokens);
    return response;
  },

  forgotPassword: async (payload: ForgotPasswordRequest): Promise<MessageResponse> =>
    authApi.forgotPassword(payload),

  resetPassword: async (payload: ResetPasswordRequest): Promise<MessageResponse> =>
    authApi.resetPassword(payload),

  logout: async (): Promise<void> => {
    await tokenStorage.clearTokens();
  },
};
