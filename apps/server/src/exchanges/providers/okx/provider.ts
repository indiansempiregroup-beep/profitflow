import type { Logger } from 'pino';
import type { Fee, OrderBook, Ticker } from '@profitflow/shared';
import { ProviderError } from '@profitflow/shared';
import { BaseExchangeProvider } from '../../base-exchange-provider.js';
import type { ExchangeConfig } from '../../types.js';
import type { RestClientTransport } from '../../transport/rest-client.js';
import { ExchangeName } from '@profitflow/shared';

export interface OKXProviderConfig extends ExchangeConfig {
  apiKey?: string;
  apiSecret?: string;
  enableWebSocket?: boolean;
}

interface OKXTickerResponse {
  data?: Array<{
    instId?: string;
    last?: string;
    vol24h?: string;
    ts?: string;
  }>;
}

interface OKXInstrument {
  instId?: string;
  baseCcy?: string;
  quoteCcy?: string;
}

export class OKXProvider extends BaseExchangeProvider {
  private availableMarkets = new Map<
    string,
    { symbol: string; baseAsset: string; quoteAsset: string }
  >();
  private exchangeInfoFetched = false;

  constructor(
    private readonly logger: Logger,
    transport: RestClientTransport,
    config: OKXProviderConfig = {},
  ) {
    super('OKX', config, transport);
  }

  async connect(): Promise<void> {
    this.logger.info('Connecting to OKX provider');
    try {
      await this.loadExchangeInfo();
      this.connectionState.connected = true;
      this.connectionState.reconnectAttempts = 0;
      this.logger.info('OKX provider connected successfully');
    } catch (error) {
      this.markError(error);
      this.logger.error({ error }, 'Failed to connect to OKX provider');
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.connectionState.connected = false;
  }

  async getMarkets(): Promise<Array<{ symbol: string; baseAsset: string; quoteAsset: string }>> {
    if (!this.exchangeInfoFetched) {
      await this.loadExchangeInfo();
    }

    return Array.from(this.availableMarkets.values());
  }

  async getTicker(symbol: string): Promise<Ticker> {
    this.logger.debug({ symbol }, 'Fetching ticker from OKX');

    try {
      const okxSymbol = this.toOKXSymbol(symbol);
      const response = await this.restClient?.request<OKXTickerResponse>({
        path: `/api/v5/market/ticker?instId=${encodeURIComponent(okxSymbol)}`,
        method: 'GET',
      });

      const payload = (response as { data?: OKXTickerResponse } | undefined)?.data?.data?.[0];
      const price = Number(payload?.last ?? 0);
      if (!Number.isFinite(price) || price <= 0) {
        throw new ProviderError('Failed to fetch ticker from provider');
      }

      const ticker: Ticker = {
        id: `${ExchangeName.OKX}:${symbol}:${Date.now()}`,
        exchange: ExchangeName.OKX,
        symbol,
        price,
        volume24h: Number(payload?.vol24h ?? 0),
        change24h: 0,
        generatedAt: new Date().toISOString(),
      };

      this.cache.set(`ticker:${symbol}`, ticker, 5000);
      this.markHeartbeat();
      return ticker;
    } catch (error) {
      this.markError(error);
      this.logger.error({ symbol, error }, 'Failed to fetch ticker from OKX');
      throw error;
    }
  }

  async getTickers(): Promise<Ticker[]> {
    return [];
  }

  async getOrderBook(symbol: string, limit: number = 20): Promise<OrderBook> {
    this.logger.debug({ symbol, limit }, 'Fetching order book from OKX');
    return {
      id: `${ExchangeName.OKX}:${symbol}:${Date.now()}`,
      exchange: ExchangeName.OKX,
      symbol,
      bids: [],
      asks: [],
      generatedAt: new Date().toISOString(),
    };
  }

  async getTradingFees(): Promise<Fee[]> {
    return [];
  }

  async getExchangeInfo(): Promise<{
    name: string;
    timezone: string;
    serverTime: number;
    symbolCount: number;
  }> {
    if (!this.exchangeInfoFetched) {
      await this.loadExchangeInfo();
    }

    return {
      name: 'OKX',
      timezone: 'UTC',
      serverTime: Date.now(),
      symbolCount: this.availableMarkets.size,
    };
  }

  private async loadExchangeInfo(): Promise<void> {
    this.logger.debug('Loading exchange info from OKX');

    try {
      const response = await this.restClient?.request<{ data?: OKXInstrument[] }>({
        path: '/api/v5/public/instruments?instType=SPOT',
        method: 'GET',
      });

      this.availableMarkets.clear();
      for (const instrument of response?.data?.data ?? []) {
        const baseAsset = instrument.baseCcy;
        const quoteAsset = instrument.quoteCcy;
        if (baseAsset && quoteAsset) {
          const symbol = `${baseAsset.toUpperCase()}/${quoteAsset.toUpperCase()}`;
          this.availableMarkets.set(instrument.instId ?? symbol, {
            symbol: instrument.instId ?? symbol,
            baseAsset: baseAsset.toUpperCase(),
            quoteAsset: quoteAsset.toUpperCase(),
          });
        }
      }

      this.exchangeInfoFetched = true;
    } catch (error) {
      this.logger.error({ error }, 'Failed to load exchange info from OKX');
      throw error;
    }
  }

  private toOKXSymbol(symbol: string): string {
    return symbol.replace('/', '-').toUpperCase();
  }
}
