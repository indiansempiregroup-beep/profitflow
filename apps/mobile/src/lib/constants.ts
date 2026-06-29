import Constants from 'expo-constants';
import { APP_NAME as SHARED_APP_NAME } from '@profitflow/shared';

export const APP_NAME = SHARED_APP_NAME;

const expoApiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl as string | undefined;

type ExpoManifestWithDebuggerHost = {
  debuggerHost?: unknown;
};

function getExpoDebuggerHostBaseUrl(): string | undefined {
  const manifest = Constants.manifest as ExpoManifestWithDebuggerHost | null;
  const expoConfig = Constants.expoConfig as ExpoManifestWithDebuggerHost | null;
  const debuggerHost = manifest?.debuggerHost ?? expoConfig?.debuggerHost;
  if (!debuggerHost || typeof debuggerHost !== 'string') {
    return undefined;
  }

  const hostname = debuggerHost.split(':')[0];
  if (!hostname) {
    return undefined;
  }

  // Determine port to use for API from environment or expo config.
  // Prefer explicit EXPO_PUBLIC_API_BASE_URL, then expoApiBaseUrl, then PORT, then 3000.
  let port = '3000';
  try {
    const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? expoApiBaseUrl;
    if (envUrl) {
      const parsed = new URL(envUrl);
      if (parsed.port) {
        port = parsed.port;
      } else {
        port = parsed.protocol === 'https:' ? '443' : '80';
      }
    } else if (process.env.PORT) {
      port = String(process.env.PORT);
    }
  } catch {
    // ignore and use default
  }

  return `http://${hostname}:${port}`;
}

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  expoApiBaseUrl ??
  getExpoDebuggerHostBaseUrl() ??
  'http://localhost:3000';

export const API_PREFIX = '/api';
export const TOKEN_KEY = 'profitflow_token';
