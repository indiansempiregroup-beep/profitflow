import { useQuery } from '@tanstack/react-query';
import { fetcher } from './api';

export interface ExchangeBalance {
  asset: string;
  free: number;
  locked: number;
  total: number;
}

export interface ExchangeBalanceSnapshot {
  exchangeName: string;
  balances: ExchangeBalance[];
  fetchedAt: string;
  error?: string;
}

export interface PaperTradeSummary {
  id: string;
  symbol: string;
  buyExchange: string;
  sellExchange: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  estimatedProfit: number;
  realizedProfit?: number;
  status: string;
  openedAt: string;
  closedAt?: string;
}

export interface PortfolioResponse {
  success: boolean;
  connectedExchanges: string[];
  exchangeBalances: ExchangeBalanceSnapshot[];
  paperTrades: {
    open: PaperTradeSummary[];
    closed: PaperTradeSummary[];
  };
  summary: {
    connectedExchangeCount: number;
    openPaperTradeCount: number;
    totalEstimatedProfit: number;
    totalRealizedProfit: number;
  };
}

export const fetchPortfolio = async (): Promise<PortfolioResponse> =>
  fetcher<PortfolioResponse>('/portfolio');

export const usePortfolio = () =>
  useQuery<PortfolioResponse, Error>({
    queryKey: ['portfolio'],
    queryFn: fetchPortfolio,
    staleTime: 30_000,
    refetchOnReconnect: true,
    refetchInterval: 60_000,
  });
