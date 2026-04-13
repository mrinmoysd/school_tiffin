import { apiRequest } from '../client/apiClient';
import {
  AuthResponse,
  AuthUser,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  MessageResponse,
  RegisterRequest,
  ResetPasswordRequest,
  SendOtpRequest,
  SendOtpResponse,
  VerifyOtpRequest,
} from './authApi.types';
import { resolveNameParts, splitFullName } from '../../utils/name';

type RawAuthUser = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  profileImageUrl?: string | null;
  maxStudents?: number | null;
  role: string;
};

type RawAuthResponse = {
  user: RawAuthUser;
  tokens: AuthResponse['tokens'];
};

const mapAuthUser = (user: RawAuthUser): AuthUser => {
  const nameParts = resolveNameParts(user);

  return {
    id: user.id,
    email: user.email,
    firstName: nameParts.firstName || null,
    lastName: nameParts.lastName || null,
    fullName: nameParts.fullName,
    profileImageUrl: user.profileImageUrl ?? null,
    maxStudents: typeof user.maxStudents === 'number' ? user.maxStudents : null,
    role: user.role,
  };
};

const mapAuthResponse = (response: RawAuthResponse): AuthResponse => ({
  user: mapAuthUser(response.user),
  tokens: response.tokens,
});

export const authApi = {
  login: async (payload: LoginRequest): Promise<AuthResponse> => {
    const response = await apiRequest<RawAuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return mapAuthResponse(response);
  },

  register: async (payload: RegisterRequest): Promise<AuthResponse> => {
    const explicitFirstName = payload.firstName?.trim();
    const explicitLastName = payload.lastName?.trim();
    const splitName = splitFullName(payload.fullName);
    const firstName = explicitFirstName || splitName.firstName;
    const lastName = explicitLastName || splitName.lastName;

    const response = await apiRequest<RawAuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: payload.email,
        phone: payload.phone,
        password: payload.password,
        ...(firstName ? { firstName } : {}),
        ...(lastName ? { lastName } : {}),
      }),
    });

    return mapAuthResponse(response);
  },

  sendOtp: async (payload: SendOtpRequest): Promise<SendOtpResponse> =>
    apiRequest<SendOtpResponse>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  verifyOtp: async (payload: VerifyOtpRequest): Promise<AuthResponse> => {
    const response = await apiRequest<RawAuthResponse>('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return mapAuthResponse(response);
  },

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

  changePassword: async (payload: ChangePasswordRequest): Promise<MessageResponse> =>
    apiRequest<MessageResponse>('/auth/change-password', {
      method: 'PATCH',
      requiresAuth: true,
      body: JSON.stringify(payload),
    }),
};
