import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetcher } from './api';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  data?: Record<string, unknown>;
  createdAt: string;
}

export interface NotificationsResponse {
  success: boolean;
  notifications: AppNotification[];
}

export const fetchNotifications = async (): Promise<NotificationsResponse> =>
  fetcher<NotificationsResponse>('/notifications');

export const markNotificationRead = async (notificationId: string) =>
  fetcher<{ success: boolean }>(`/notifications/${notificationId}/read`, { method: 'POST' });

export const markAllNotificationsRead = async () =>
  fetcher<{ success: boolean }>('/notifications/read-all', { method: 'POST' });

export const registerPushToken = async (token: string, platform: string) =>
  fetcher<{ success: boolean }>('/push-tokens', {
    method: 'POST',
    body: JSON.stringify({ token, platform }),
  });

export const useNotifications = () =>
  useQuery<NotificationsResponse, Error>({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
};
