import { create } from 'zustand';
import { saveToken, clearToken, fetcher } from '../lib/api';
import { TOKEN_KEY } from '../lib/constants';
import { getStoredItem } from '../lib/secure-storage';

export interface AuthState {
  isAuthenticated: boolean;
  initialized: boolean;
  userName?: string;
  token?: string;
  loading: boolean;
  error?: string | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<boolean>;
  initializeAuth: () => Promise<void>;
}

interface AuthUser {
  id: string;
  email: string;
}

interface AuthSuccessResponse {
  success: true;
  token: string;
  user: AuthUser;
}

interface AuthErrorResponse {
  success: false;
  error?: {
    message?: string;
  };
}

interface MeResponse {
  success: boolean;
  user?: AuthUser;
}

type AuthResponse = AuthSuccessResponse | AuthErrorResponse;

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  initialized: false,
  userName: undefined,
  token: undefined,
  loading: false,
  error: null,
  signIn: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const res = await fetcher<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (res.success) {
        const token = res.token;
        await saveToken(token);
        set({
          isAuthenticated: true,
          initialized: true,
          userName: res.user.email,
          token,
          loading: false,
          error: null,
        });
        return true;
      }

      set({ error: res.error?.message ?? 'Invalid response from server', loading: false });
      return false;
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Login failed'), loading: false });
      return false;
    }
  },
  signUp: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const res = await fetcher<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (res.success) {
        const token = res.token;
        await saveToken(token);
        set({
          isAuthenticated: true,
          initialized: true,
          userName: res.user.email,
          token,
          loading: false,
          error: null,
        });
        return true;
      }

      set({ error: res.error?.message ?? 'Invalid response from server', loading: false });
      return false;
    } catch (error: unknown) {
      set({ error: getErrorMessage(error, 'Registration failed'), loading: false });
      return false;
    }
  },
  signOut: async () => {
    await clearToken();
    set({ isAuthenticated: false, userName: undefined, token: undefined });
  },
  initializeAuth: async () => {
    set({ loading: true });
    try {
      const token = await getStoredItem(TOKEN_KEY);
      if (!token) {
        set({ initialized: true, loading: false });
        return;
      }

      const me = await fetcher<MeResponse>('/auth/me');
      if (me.user) {
        set({
          token,
          isAuthenticated: true,
          userName: me.user.email,
          initialized: true,
          loading: false,
        });
        return;
      }
    } catch {
      await clearToken();
    }

    set({
      initialized: true,
      isAuthenticated: false,
      userName: undefined,
      token: undefined,
      loading: false,
    });
  },
}));
