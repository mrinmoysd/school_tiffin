import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  AuthResponse,
  AuthTokens,
  ForgotPasswordRequest,
  LoginRequest,
  MessageResponse,
  RegisterRequest,
  ResetPasswordRequest,
  SendOtpResponse,
  VerifyOtpRequest,
} from '../../api/auth/authApi.types';
import { ApiClientError } from '../../api/client/apiClient';
import { authService } from '../../business/auth';

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
};

interface LoginPayload extends LoginRequest {
  rememberMe: boolean;
}

export const bootstrapAuth = createAsyncThunk<AuthTokens | null>('auth/bootstrap', async () => {
  try {
    return await authService.bootstrapSession();
  } catch {
    return null;
  }
});

export const login = createAsyncThunk<AuthResponse, LoginPayload, { rejectValue: string }>(
  'auth/login',
  async ({ rememberMe: _rememberMe, ...payload }, thunkApi) => {
    try {
      return await authService.login(payload);
    } catch (error) {
      return thunkApi.rejectWithValue(getErrorMessage(error, 'Login failed'));
    }
  },
);

export const register = createAsyncThunk<AuthResponse, RegisterRequest, { rejectValue: string }>(
  'auth/register',
  async (payload, thunkApi) => {
    try {
      return await authService.register(payload);
    } catch (error) {
      return thunkApi.rejectWithValue(getErrorMessage(error, 'Registration failed'));
    }
  },
);

export const sendOtp = createAsyncThunk<
  SendOtpResponse & { phone: string },
  { phone: string },
  { rejectValue: string }
>('auth/sendOtp', async ({ phone }, thunkApi) => {
  try {
    const response = await authService.sendOtp({ phone });
    return {
      ...response,
      phone,
    };
  } catch (error) {
    return thunkApi.rejectWithValue(getErrorMessage(error, 'Failed to send OTP'));
  }
});

export const verifyOtp = createAsyncThunk<AuthResponse, VerifyOtpRequest, { rejectValue: string }>(
  'auth/verifyOtp',
  async (payload, thunkApi) => {
    try {
      return await authService.verifyOtp(payload);
    } catch (error) {
      return thunkApi.rejectWithValue(getErrorMessage(error, 'OTP verification failed'));
    }
  },
);

export const forgotPassword = createAsyncThunk<
  MessageResponse,
  ForgotPasswordRequest,
  { rejectValue: string }
>('auth/forgotPassword', async (payload, thunkApi) => {
  try {
    return await authService.forgotPassword(payload);
  } catch (error) {
    return thunkApi.rejectWithValue(getErrorMessage(error, 'Failed to request password reset'));
  }
});

export const resetPassword = createAsyncThunk<
  MessageResponse,
  ResetPasswordRequest,
  { rejectValue: string }
>('auth/resetPassword', async (payload, thunkApi) => {
  try {
    return await authService.resetPassword(payload);
  } catch (error) {
    return thunkApi.rejectWithValue(getErrorMessage(error, 'Failed to reset password'));
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
});
