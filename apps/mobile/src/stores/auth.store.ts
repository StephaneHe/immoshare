import { create } from 'zustand';
import { api, ApiError } from '@/services/api';

/**
 * User type matching backend UserDto from auth.service.ts.
 * Backend stores a single `name` field, not firstName/lastName.
 */
type User = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  avatarUrl: string | null;
  role: string;
  agencyId: string | null;
  locale: string;
  emailVerified: boolean;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type RegisterData = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

type AuthState = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  init: async () => {
    try {
      await api.init();
      if (api.getAccessToken()) {
        const resp = await api.get<{ user: User }>('/api/v1/auth/me');
        // /auth/me may return { user: ... } or the user directly
        const user = 'user' in resp ? resp.user : resp as unknown as User;
        set({ user, isAuthenticated: true, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      await api.clearTokens();
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.post<{ user: User; accessToken: string; refreshToken: string }>(
        '/api/v1/auth/login',
        { email, password },
        { skipAuth: true },
      );
      await api.setTokens(data.accessToken, data.refreshToken);
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Login failed';
      set({ error: message, isLoading: false });
    }
  },

  register: async ({ firstName, lastName, email, password }) => {
    set({ isLoading: true, error: null });
    try {
      // Backend RegisterDto expects: name, email, password, role, locale
      // Combine firstName + lastName into single name field
      const payload = {
        email,
        password,
        name: `${firstName} ${lastName}`.trim(),
        role: 'agent' as const,
        locale: 'en' as const,
      };
      const result = await api.post<{ user: User; accessToken: string; refreshToken: string }>(
        '/api/v1/auth/register',
        payload,
        { skipAuth: true },
      );
      await api.setTokens(result.accessToken, result.refreshToken);
      set({ user: result.user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Registration failed';
      set({ error: message, isLoading: false });
    }
  },

  logout: async () => {
    try {
      await api.post('/api/v1/auth/logout');
    } catch {
      // Ignore logout API errors
    }
    await api.clearTokens();
    set({ user: null, isAuthenticated: false, error: null });
  },

  clearError: () => set({ error: null }),
}));
