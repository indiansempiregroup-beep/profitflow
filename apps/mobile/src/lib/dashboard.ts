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
  marketDataCount?: number;
  monitoredSymbolCount?: number;
  marketSnapshots?: MarketSnapshot[];
}

export interface MarketSnapshot {
  exchange: string;
  symbol: string;
  bid: number;
  ask: number;
  price: number;
  lastUpdateAt?: string;
  healthStatus: ProviderHealthStatus;
}

export interface MarketQuote {
  exchange: string;
  symbol: string;
  bid: number;
  ask: number;
  price: number;
  lastUpdateAt?: string;
  healthStatus: ProviderHealthStatus;
}

export interface MarketQuoteResponse {
  success: boolean;
  symbol: string;
  quotes: MarketQuote[];
}

export const fetchDashboard = async (): Promise<DashboardResponse> =>
  fetcher<DashboardResponse>('/dashboard', undefined, CACHE_KEYS.dashboard);

export const fetchMarketQuote = async (symbol: string): Promise<MarketQuoteResponse> =>
  fetcher<MarketQuoteResponse>(`/market-quote?symbol=${encodeURIComponent(symbol)}`);

export const useDashboard = () =>
  useQuery<DashboardResponse, Error>({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
    staleTime: 30_000,
    refetchOnReconnect: true,
    refetchInterval: 30_000,
  });

export const useMarketQuote = (symbol?: string) =>
  useQuery<MarketQuoteResponse, Error>({
    queryKey: ['market-quote', symbol],
    queryFn: () => fetchMarketQuote(symbol ?? ''),
    enabled: Boolean(symbol?.trim()),
    staleTime: 15_000,
    refetchOnReconnect: true,
    refetchInterval: 15_000,
  });
