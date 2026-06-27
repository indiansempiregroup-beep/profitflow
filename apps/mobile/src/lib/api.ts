import { API_BASE_URL, API_PREFIX } from './constants';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'profitflow_token';
const DASHBOARD_CACHE_KEY = 'profitflow_dashboard_cache';
const PROFILE_CACHE_KEY = 'profitflow_profile_cache';

async function saveCache<T>(key: string, data: T): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, JSON.stringify(data));
  } catch {
    // Best effort only; offline fallback should not fail the app.
  }
}

async function getCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await SecureStore.getItemAsync(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function fetcher<T>(path: string, init?: RequestInit, cacheKey?: string): Promise<T> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const response = await fetch(`${API_BASE_URL}${API_PREFIX}${path}`, {
      headers,
      ...init,
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${body}`);
    }

    const data = (await response.json()) as T;
    if (cacheKey) {
      await saveCache(cacheKey, data);
    }
    return data;
  } catch (error) {
    if (cacheKey) {
      const cached = await getCache<T>(cacheKey);
      if (cached) {
        return cached;
      }
    }
    throw error;
  }
}

export async function saveToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export const CACHE_KEYS = {
  dashboard: DASHBOARD_CACHE_KEY,
  profile: PROFILE_CACHE_KEY,
};
