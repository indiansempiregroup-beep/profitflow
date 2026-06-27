import type { ExchangeConnectionState } from '../types.js';

export interface ConnectionHealthService {
  evaluate(state: ExchangeConnectionState): 'healthy' | 'degraded' | 'down';
}

export class DefaultConnectionHealthService implements ConnectionHealthService {
  evaluate(state: ExchangeConnectionState): 'healthy' | 'degraded' | 'down' {
    if (!state.connected) {
      return 'down';
    }

    if (state.reconnectAttempts > 0) {
      return 'degraded';
    }

    return 'healthy';
  }
}
