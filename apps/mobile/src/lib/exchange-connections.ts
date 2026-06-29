import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetcher } from './api';

export type SupportedExchangeName = 'Binance' | 'CoinDCX' | 'Bybit' | 'OKX';

export interface ExchangeConnectionPayload {
  exchangeName: SupportedExchangeName;
  apiKey: string;
  secretKey: string;
  passphrase?: string;
}

export interface ExchangeConnectionResponse {
  success: boolean;
  message?: string;
  connection?: {
    id: string;
    exchangeName: string;
  };
  error?: {
    code?: string;
    message?: string;
  };
}

export const testExchangeConnection = async (
  payload: ExchangeConnectionPayload,
): Promise<ExchangeConnectionResponse> =>
  fetcher<ExchangeConnectionResponse>('/exchange-connections/test', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const saveExchangeConnection = async (
  payload: ExchangeConnectionPayload,
): Promise<ExchangeConnectionResponse> =>
  fetcher<ExchangeConnectionResponse>('/exchange-connections', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const useTestExchangeConnection = () =>
  useMutation<ExchangeConnectionResponse, Error, ExchangeConnectionPayload>({
    mutationFn: testExchangeConnection,
  });

export const useSaveExchangeConnection = () => {
  const queryClient = useQueryClient();

  return useMutation<ExchangeConnectionResponse, Error, ExchangeConnectionPayload>({
    mutationFn: saveExchangeConnection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });
};
