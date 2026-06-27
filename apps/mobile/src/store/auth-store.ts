import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { saveToken, clearToken, fetcher } from '../lib/api';
import { TOKEN_KEY } from '../lib/constants';

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
      const res = await fetcher('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (res && (res as any).success && (res as any).token) {
        const token = (res as any).token as string;
        await saveToken(token);
        set({ isAuthenticated: true, initialized: true, userName: (res as any).user?.email, token, loading: false, error: null });
        return true;
      }

      set({ error: (res as any)?.error?.message ?? 'Invalid response from server', loading: false });
      return false;
    } catch (err: any) {
      set({ error: err?.message ?? 'Login failed', loading: false });
      return false;
    }
  },
  signUp: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const res = await fetcher('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (res && (res as any).success && (res as any).token) {
        const token = (res as any).token as string;
        await saveToken(token);
        set({ isAuthenticated: true, initialized: true, userName: (res as any).user?.email, token, loading: false, error: null });
        return true;
      }

      set({ error: (res as any)?.error?.message ?? 'Invalid response from server', loading: false });
      return false;
    } catch (err: any) {
      const message = err?.message ?? 'Registration failed';
      set({ error: message, loading: false });
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
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!token) {
        set({ initialized: true, loading: false });
        return;
      }

      const me = await fetcher('/auth/me');
      if (me && (me as any).user) {
        set({ token, isAuthenticated: true, userName: (me as any).user?.email, initialized: true, loading: false });
        return;
      }
    } catch {
      await clearToken();
    }

    set({ initialized: true, isAuthenticated: false, userName: undefined, token: undefined, loading: false });
  },
}));
