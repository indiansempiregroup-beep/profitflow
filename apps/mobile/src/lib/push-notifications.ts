import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { registerPushToken } from './notifications';
import { useAuthStore } from '../store/auth-store';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function resolvePushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    return null;
  }

  const permissions = await Notifications.getPermissionsAsync();
  let finalStatus = permissions.status;

  if (finalStatus !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    finalStatus = requested.status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}

export function usePushNotifications() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const initialized = useAuthStore((state) => state.initialized);

  useEffect(() => {
    if (!initialized || !isAuthenticated) {
      return;
    }

    const register = async () => {
      try {
        const token = await resolvePushToken();
        if (!token) {
          return;
        }

        await registerPushToken(token, Platform.OS);
      } catch (error) {
        console.warn('[PushNotifications] registration failed', error);
      }
    };

    void register();
  }, [initialized, isAuthenticated]);
}
