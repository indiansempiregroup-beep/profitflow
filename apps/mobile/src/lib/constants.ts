import { APP_NAME as SHARED_APP_NAME } from '@profitflow/shared';

export const APP_NAME = SHARED_APP_NAME;
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
