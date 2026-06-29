export interface ExchangeConfig {
  name?: string;
  baseUrl?: string;
  timeoutMs?: number;
  maxRetries?: number;
  backoffBaseMs?: number;
  rateLimitPerSecond?: number;
  heartbeatIntervalMs?: number;
  reconnectMaxAttempts?: number;
}

export interface ExchangeConnectionState {
  connected: boolean;
  reconnectAttempts: number;
  lastError?: string;
  lastHeartbeatAt?: string;
}

export interface MarketSnapshot {
  symbol: string;
  price: number;
  source: string;
  receivedAt: string;
}
