import { Slot, useSegments, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProviders } from '../src/components/ui/AppProviders';
import { NavigationShell } from '../src/components/ui/NavigationShell';
import { useEffect } from 'react';
import { useAuthStore } from '../src/store/auth-store';
import { LoadingView } from '../src/components/ui/LoadingView';
import { ErrorBoundary } from '../src/components/ui/ErrorBoundary';
import { ConnectivityBanner } from '../src/components/ui/ConnectivityBanner';
import { useConnectivity } from '../src/components/ui/OfflineMonitor';

const AUTH_ROUTES = ['login', 'register', 'welcome'];

export default function RootLayout() {
  const segments = useSegments();
  const router = useRouter();
  const isAuthRoute = AUTH_ROUTES.includes(segments[0] ?? '');
  const initialized = useAuthStore((state) => state.initialized);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const loading = useAuthStore((state) => state.loading);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const { isOffline } = useConnectivity();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!initialized) return;
    if (isAuthenticated && isAuthRoute) {
      router.replace('/dashboard');
    } else if (!isAuthenticated && !isAuthRoute) {
      router.replace('/welcome');
    }
  }, [initialized, isAuthenticated, isAuthRoute, router]);

  if (!initialized || loading) {
    return (
      <AppProviders>
        <StatusBar style="light" />
        <LoadingView label="Checking authentication…" />
      </AppProviders>
    );
  }

  return (
    <AppProviders>
      <StatusBar style="light" />
      <ErrorBoundary>
        <ConnectivityBanner isOffline={isOffline} />
        {isAuthRoute ? <Slot /> : <NavigationShell><Slot /></NavigationShell>}
      </ErrorBoundary>
    </AppProviders>
  );
}
