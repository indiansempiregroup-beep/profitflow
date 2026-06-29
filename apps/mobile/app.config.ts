import { config } from 'dotenv';

config({ path: '../../.env' });

export default {
  expo: {
    name: 'ProfitFlow',
    slug: 'profitflow',
    scheme: 'profitflow',
    plugins: ['expo-router', 'expo-notifications'],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000',
    },
  },
};
