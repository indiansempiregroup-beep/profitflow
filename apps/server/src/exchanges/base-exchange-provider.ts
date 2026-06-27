import type { ExchangeConfig, ExchangeConnectionState, MarketSnapshot } from './types.js';
import type { RestClientTransport } from './transport/rest-client.js';
import type { WebSocketClient } from './transport/websocket-client.js';
import { InMemoryCache } from './cache.js';
import { ReconnectStrategy } from './reconnect-strategy.js';

export interface FeeCalculator {
  calculateFee(symbol: string, side: string, amount: number, price: number): number;
}

export interface LiquidityCalculator {
  estimateLiquidity(symbol: string, bids: number, asks: number): number;
}

export interface ExchangeProvider {
  readonly name: string;
  readonly config: ExchangeConfig;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  getMarketData(symbol: string): Promise<MarketSnapshot>;
  getConnectionState(): ExchangeConnectionState;
  getFeeCalculator?(): FeeCalculator | undefined;
  getLiquidityCalculator?(): LiquidityCalculator | undefined;
}

export abstract class BaseExchangeProvider implements ExchangeProvider {
  protected readonly cache = new InMemoryCache();
  protected readonly reconnectStrategy = new ReconnectStrategy();
  protected connectionState: ExchangeConnectionState = {
    connected: false,
    reconnectAttempts: 0,
  };

  constructor(
    public readonly name: string,
    public readonly config: ExchangeConfig,
    protected readonly restClient?: RestClientTransport,
    protected readonly websocketClient?: WebSocketClient,
  ) {}

  async connect(): Promise<void> {
    this.connectionState.connected = true;
    this.connectionState.reconnectAttempts = 0;
  }

  async disconnect(): Promise<void> {
    this.connectionState.connected = false;
  }

  async getMarketData(symbol: string): Promise<MarketSnapshot> {
    return {
      symbol,
      price: 0,
      source: this.name,
      receivedAt: new Date().toISOString(),
    };
  }

  getConnectionState(): ExchangeConnectionState {
    return { ...this.connectionState };
  }

  getFeeCalculator(): FeeCalculator | undefined {
    return undefined;
  }

  getLiquidityCalculator(): LiquidityCalculator | undefined {
    return undefined;
  }

  protected markError(error: unknown): void {
    this.connectionState.connected = false;
    this.connectionState.lastError = error instanceof Error ? error.message : 'Unknown error';
  }

  protected markHeartbeat(): void {
    this.connectionState.lastHeartbeatAt = new Date().toISOString();
  }

  protected async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let attempt = 0;
    while (true) {
      try {
        return await operation();
      } catch (error) {
        if (attempt >= (this.config.maxRetries ?? 2)) {
          throw error;
        }
        const delay = this.reconnectStrategy.nextDelay(attempt);
        await this.delay(delay);
        attempt += 1;
      }
    }
  }

  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
