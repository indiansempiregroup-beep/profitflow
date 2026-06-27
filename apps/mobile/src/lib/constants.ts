import Constants from 'expo-constants';
import { APP_NAME as SHARED_APP_NAME } from '@profitflow/shared';

export const APP_NAME = SHARED_APP_NAME;
const expoApiBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl as string | undefined;
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? expoApiBaseUrl ?? 'http://localhost:3000';
export const API_PREFIX = '/api';
export const TOKEN_KEY = 'profitflow_token';
