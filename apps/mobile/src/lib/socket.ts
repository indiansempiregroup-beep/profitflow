import { useEffect, useRef } from 'react';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, TOKEN_KEY } from './constants';

export type DashboardSocketMessage =
  | { type: 'dashboard.connected'; payload: { opportunityCount: number } }
  | { type: 'opportunity.validated'; payload: { id: string; symbol: string } }
  | { type: 'dashboard.error'; payload: { message: string } };

const toWebSocketUrl = (baseUrl: string) => baseUrl.replace(/^http/, 'ws');

export const useDashboardSocket = (onMessage: (message: DashboardSocketMessage) => void) => {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let cancelled = false;
    let reconnectAttempts = 0;

    const connect = async () => {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!token || cancelled) {
        return;
      }

      const url = `${toWebSocketUrl(API_BASE_URL)}/api/ws/dashboard?token=${encodeURIComponent(token)}`;
      const socket = new WebSocket(url);
      socketRef.current = socket;

      socket.onopen = () => {
        reconnectAttempts = 0;
        console.log('[DashboardSocket] connected', url);
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as DashboardSocketMessage;
          onMessage(message);
        } catch (error) {
          console.warn('[DashboardSocket] invalid payload', error);
        }
      };

      socket.onerror = (event) => {
        console.warn('[DashboardSocket] error', event);
      };

      socket.onclose = () => {
        console.log('[DashboardSocket] disconnected');
        if (!cancelled) {
          reconnectAttempts += 1;
          const delay = Math.min(30000, 2000 * reconnectAttempts);
          setTimeout(() => {
            if (!cancelled) {
              void connect();
            }
          }, delay);
        }
      };
    };

    void connect();

    return () => {
      cancelled = true;
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [onMessage]);
};
