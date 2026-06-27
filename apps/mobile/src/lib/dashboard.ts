import { useQuery } from '@tanstack/react-query';
import { fetcher, CACHE_KEYS } from './api';
import type { ValidatedOpportunity } from '@profitflow/shared';

export type ProviderHealthStatus = 'healthy' | 'degraded' | 'stale' | 'down';

export interface ProviderHealth {
  provider: string;
  status: ProviderHealthStatus;
  lastHeartbeatAt?: string;
  lastMarketUpdateAt?: string;
  connectionStatus: boolean;
  consecutiveFailures: number;
  averageLatencyMs: number;
}

export interface DashboardResponse {
  overallStatus: ProviderHealthStatus;
  connectedExchanges: string[];
  opportunities: ValidatedOpportunity[];
  providers: ProviderHealth[];
}

export const fetchDashboard = async (): Promise<DashboardResponse> =>
  fetcher<DashboardResponse>('/dashboard', undefined, CACHE_KEYS.dashboard);

export const useDashboard = () =>
  useQuery<DashboardResponse, Error>({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
    staleTime: 30_000,
    refetchOnReconnect: true,
    refetchInterval: 30_000,
  });
