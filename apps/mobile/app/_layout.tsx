import { Slot, usePathname, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProviders } from '../src/components/ui/AppProviders';
import { NavigationShell } from '../src/components/ui/NavigationShell';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../src/store/auth-store';
import { LoadingView } from '../src/components/ui/LoadingView';
import { ErrorBoundary } from '../src/components/ui/ErrorBoundary';
import { ConnectivityBanner } from '../src/components/ui/ConnectivityBanner';
import { useConnectivity } from '../src/components/ui/OfflineMonitor';
import { usePushNotifications } from '../src/lib/push-notifications';

const AUTH_ROUTES = [
  'login',
  'register',
  'welcome',
  'forgot-password',
  'verify-email',
  'auth-success',
];

export default function RootLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const routeName = pathname.split('/').filter(Boolean)[0] ?? '';
  const isAuthRoute = AUTH_ROUTES.includes(routeName);
  const initialized = useAuthStore((state) => state.initialized);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const loading = useAuthStore((state) => state.loading);
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const { isOffline } = useConnectivity();
  usePushNotifications();

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!mounted || !initialized || loading) return;

    const currentRoute = pathname || '/';

    if (isAuthenticated && isAuthRoute) {
      if (currentRoute !== '/dashboard') {
        router.replace('/dashboard');
      }
      return;
    }

    if (!isAuthenticated && !isAuthRoute) {
      if (currentRoute !== '/welcome') {
        router.replace('/welcome');
      }
    }
  }, [initialized, isAuthenticated, isAuthRoute, router, mounted, pathname, loading]);

  if (!initialized) {
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
        {isAuthRoute ? (
          <Slot />
        ) : (
          <NavigationShell>
            <Slot />
          </NavigationShell>
        )}
      </ErrorBoundary>
    </AppProviders>
  );
}
