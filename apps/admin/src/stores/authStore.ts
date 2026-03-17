import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { User, UserRole } from '@/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  rememberMe: boolean;

  // Actions
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  login: (user: User, accessToken: string, refreshToken: string, rememberMe?: boolean) => void;
  logout: () => void;
  isAdmin: () => boolean;
}

const authStorage = {
  getItem: (name: string) => {
    return sessionStorage.getItem(name) ?? localStorage.getItem(name);
  },
  setItem: (name: string, value: string) => {
    try {
      const parsed = JSON.parse(value) as { state?: { rememberMe?: boolean } };
      const remember = parsed?.state?.rememberMe !== false;
      if (remember) {
        localStorage.setItem(name, value);
        sessionStorage.removeItem(name);
      } else {
        sessionStorage.setItem(name, value);
        localStorage.removeItem(name);
      }
    } catch {
      localStorage.setItem(name, value);
    }
  },
  removeItem: (name: string) => {
    localStorage.removeItem(name);
    sessionStorage.removeItem(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      rememberMe: true,

      setUser: user => set({ user }),

      setTokens: (accessToken, refreshToken) =>
        set({ accessToken, refreshToken, isAuthenticated: true }),

      login: (user, accessToken, refreshToken, rememberMe = true) =>
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          rememberMe,
        }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
          rememberMe: true,
        }),

      isAdmin: () => {
        const user = get().user;
        return user?.role === UserRole.ADMIN || user?.role === UserRole.SCHOOL_ADMIN;
      },
    }),
    {
      name: 'admin-auth-storage',
      storage: createJSONStorage(() => authStorage),
      partialize: state => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        rememberMe: state.rememberMe,
      }),
    },
  ),
);
