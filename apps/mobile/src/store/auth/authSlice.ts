import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AuthTokens, AuthUser } from '../../api/auth/authApi.types';
import {
  bootstrapAuth,
  forgotPassword,
  login,
  logout,
  register,
  resetPassword,
  sendOtp,
  verifyOtp,
} from './authThunks';

interface AuthState {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  bootstrapLoading: boolean;
  loginLoading: boolean;
  registerLoading: boolean;
  sendOtpLoading: boolean;
  verifyOtpLoading: boolean;
  forgotPasswordLoading: boolean;
  resetPasswordLoading: boolean;
  loginError: string | null;
  registerError: string | null;
  otpError: string | null;
  forgotPasswordError: string | null;
  resetPasswordError: string | null;
  forgotPasswordSuccessMessage: string | null;
  resetPasswordSuccessMessage: string | null;
  otpPhone: string | null;
  otpExpiresAt: number | null;
}

const initialState: AuthState = {
  user: null,
  tokens: null,
  isAuthenticated: false,
  bootstrapLoading: true,
  loginLoading: false,
  registerLoading: false,
  sendOtpLoading: false,
  verifyOtpLoading: false,
  forgotPasswordLoading: false,
  resetPasswordLoading: false,
  loginError: null,
  registerError: null,
  otpError: null,
  forgotPasswordError: null,
  resetPasswordError: null,
  forgotPasswordSuccessMessage: null,
  resetPasswordSuccessMessage: null,
  otpPhone: null,
  otpExpiresAt: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthErrors: state => {
      state.loginError = null;
      state.registerError = null;
      state.otpError = null;
      state.forgotPasswordError = null;
      state.resetPasswordError = null;
    },
    clearAuthMessages: state => {
      state.forgotPasswordSuccessMessage = null;
      state.resetPasswordSuccessMessage = null;
    },
    setOtpExpiry: (state, action: PayloadAction<number>) => {
      state.otpExpiresAt = action.payload;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(bootstrapAuth.pending, state => {
        state.bootstrapLoading = true;
      })
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        state.bootstrapLoading = false;
        state.tokens = action.payload;
        state.isAuthenticated = Boolean(action.payload?.accessToken);
      })
      .addCase(bootstrapAuth.rejected, state => {
        state.bootstrapLoading = false;
        state.tokens = null;
        state.isAuthenticated = false;
      });

    builder
      .addCase(login.pending, state => {
        state.loginLoading = true;
        state.loginError = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loginLoading = false;
        state.user = action.payload.user;
        state.tokens = action.payload.tokens;
        state.isAuthenticated = true;
      })
      .addCase(login.rejected, (state, action) => {
        state.loginLoading = false;
        state.loginError = action.payload ?? 'Login failed';
      });

    builder
      .addCase(register.pending, state => {
        state.registerLoading = true;
        state.registerError = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.registerLoading = false;
        state.user = action.payload.user;
        state.tokens = action.payload.tokens;
        state.isAuthenticated = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.registerLoading = false;
        state.registerError = action.payload ?? 'Registration failed';
      });

    builder
      .addCase(sendOtp.pending, state => {
        state.sendOtpLoading = true;
        state.otpError = null;
      })
      .addCase(sendOtp.fulfilled, (state, action) => {
        state.sendOtpLoading = false;
        state.otpPhone = action.payload.phone;
        state.otpExpiresAt = Date.now() + action.payload.expiresIn * 1000;
      })
      .addCase(sendOtp.rejected, (state, action) => {
        state.sendOtpLoading = false;
        state.otpError = action.payload ?? 'Failed to send OTP';
      });

    builder
      .addCase(verifyOtp.pending, state => {
        state.verifyOtpLoading = true;
        state.otpError = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.verifyOtpLoading = false;
        state.user = action.payload.user;
        state.tokens = action.payload.tokens;
        state.isAuthenticated = true;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.verifyOtpLoading = false;
        state.otpError = action.payload ?? 'OTP verification failed';
      });

    builder
      .addCase(forgotPassword.pending, state => {
        state.forgotPasswordLoading = true;
        state.forgotPasswordError = null;
        state.forgotPasswordSuccessMessage = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.forgotPasswordLoading = false;
        state.forgotPasswordSuccessMessage = action.payload.message;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.forgotPasswordLoading = false;
        state.forgotPasswordError = action.payload ?? 'Failed to request password reset';
      });

    builder
      .addCase(resetPassword.pending, state => {
        state.resetPasswordLoading = true;
        state.resetPasswordError = null;
        state.resetPasswordSuccessMessage = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.resetPasswordLoading = false;
        state.resetPasswordSuccessMessage = action.payload.message;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.resetPasswordLoading = false;
        state.resetPasswordError = action.payload ?? 'Failed to reset password';
      });

    builder.addCase(logout.fulfilled, state => {
      state.user = null;
      state.tokens = null;
      state.isAuthenticated = false;
      state.otpPhone = null;
      state.otpExpiresAt = null;
      state.loginError = null;
      state.registerError = null;
      state.otpError = null;
      state.forgotPasswordError = null;
      state.resetPasswordError = null;
      state.forgotPasswordSuccessMessage = null;
      state.resetPasswordSuccessMessage = null;
    });
  },
});

export const { clearAuthErrors, clearAuthMessages, setOtpExpiry } = authSlice.actions;
export const authReducer = authSlice.reducer;
