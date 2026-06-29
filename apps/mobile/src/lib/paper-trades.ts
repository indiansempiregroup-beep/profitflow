import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetcher } from './api';

export interface PaperTrade {
  id: string;
  opportunityId?: string | null;
  symbol: string;
  buyExchange: string;
  sellExchange: string;
  buyPrice: number;
  sellPrice: number;
  quantity: number;
  estimatedProfit: number;
  realizedProfit?: number | null;
  status: string;
  openedAt: string;
  closedAt?: string;
}

export interface CreatePaperTradePayload {
  opportunityId?: string;
  symbol: string;
  buyExchange: string;
  sellExchange: string;
  buyPrice: number;
  sellPrice: number;
  quantity?: number;
  estimatedProfit: number;
}

export interface PaperTradesResponse {
  success: boolean;
  trades: PaperTrade[];
}

export const fetchPaperTrades = async (): Promise<PaperTradesResponse> =>
  fetcher<PaperTradesResponse>('/paper-trades');

export const createPaperTrade = async (payload: CreatePaperTradePayload) =>
  fetcher<{ success: boolean; trade: PaperTrade }>('/paper-trades', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const closePaperTrade = async (tradeId: string, realizedProfit: number) =>
  fetcher<{ success: boolean; trade: PaperTrade }>(`/paper-trades/${tradeId}/close`, {
    method: 'POST',
    body: JSON.stringify({ realizedProfit }),
  });

export const usePaperTrades = () =>
  useQuery<PaperTradesResponse, Error>({
    queryKey: ['paper-trades'],
    queryFn: fetchPaperTrades,
    staleTime: 15_000,
  });

export const useCreatePaperTrade = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPaperTrade,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paper-trades'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useClosePaperTrade = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tradeId, realizedProfit }: { tradeId: string; realizedProfit: number }) =>
      closePaperTrade(tradeId, realizedProfit),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paper-trades'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};
