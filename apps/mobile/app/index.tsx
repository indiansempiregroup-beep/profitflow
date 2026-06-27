import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/auth-store';
import type { AuthState } from '../src/store/auth-store';

export default function HomeRedirect() {
  const router = useRouter();
  const { initialized, isAuthenticated } = useAuthStore((state: AuthState) => ({
    initialized: state.initialized,
    isAuthenticated: state.isAuthenticated,
  }));

  useEffect(() => {
    if (!initialized) return;
    router.replace(isAuthenticated ? '/dashboard' : '/welcome');
  }, [initialized, isAuthenticated, router]);

  return null;
}
