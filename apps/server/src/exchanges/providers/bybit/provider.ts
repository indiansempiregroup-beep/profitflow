import type { Logger } from 'pino';
import type { Fee, OrderBook, Ticker } from '@profitflow/shared';
import { ProviderError } from '@profitflow/shared';
import { BaseExchangeProvider } from '../../base-exchange-provider.js';
import type { ExchangeConfig } from '../../types.js';
import type { RestClientTransport } from '../../transport/rest-client.js';
import { ExchangeName } from '@profitflow/shared';

export interface BybitProviderConfig extends ExchangeConfig {
  apiKey?: string;
  apiSecret?: string;
  enableWebSocket?: boolean;
}

interface BybitInstrument {
  symbol?: string;
  baseCoin?: string;
  quoteCoin?: string;
}

interface BybitTickerResponse {
  result?: {
    list?: Array<{
      symbol?: string;
      lastPrice?: string;
      bid1Price?: string;
      ask1Price?: string;
      turnOver24h?: string;
      price24hPcnt?: string;
    }>;
  };
}

export class BybitProvider extends BaseExchangeProvider {
  private availableMarkets = new Map<
    string,
    { symbol: string; baseAsset: string; quoteAsset: string }
  >();
  private exchangeInfoFetched = false;

  constructor(
    private readonly logger: Logger,
    transport: RestClientTransport,
    config: BybitProviderConfig = {},
  ) {
    super('BYBIT', config, transport);
  }

  async connect(): Promise<void> {
    this.logger.info('Connecting to Bybit provider');
    try {
      await this.loadExchangeInfo();
      this.connectionState.connected = true;
      this.connectionState.reconnectAttempts = 0;
      this.logger.info('Bybit provider connected successfully');
    } catch (error) {
      this.markError(error);
      this.logger.error({ error }, 'Failed to connect to Bybit provider');
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
    this.logger.debug({ symbol }, 'Fetching ticker from Bybit');

    try {
      const bybitSymbol = this.toBybitSymbol(symbol);
      const response = await this.restClient?.request<BybitTickerResponse>({
        path: `/v5/market/tickers?category=spot&symbol=${encodeURIComponent(bybitSymbol)}`,
        method: 'GET',
      });

      const payload = (response as { data?: BybitTickerResponse } | undefined)?.data?.result
        ?.list?.[0];
      const price = Number(payload?.lastPrice ?? 0);
      if (!Number.isFinite(price) || price <= 0) {
        throw new ProviderError('Failed to fetch ticker from provider');
      }

      const ticker: Ticker = {
        id: `${ExchangeName.BYBIT}:${symbol}:${Date.now()}`,
        exchange: ExchangeName.BYBIT,
        symbol,
        price,
        volume24h: Number(payload?.turnOver24h ?? 0),
        change24h: Number(payload?.price24hPcnt ?? 0),
        generatedAt: new Date().toISOString(),
      };

      this.cache.set(`ticker:${symbol}`, ticker, 5000);
      this.markHeartbeat();
      return ticker;
    } catch (error) {
      this.markError(error);
      this.logger.error({ symbol, error }, 'Failed to fetch ticker from Bybit');
      throw error;
    }
  }

  async getTickers(): Promise<Ticker[]> {
    return [];
  }

  async getOrderBook(symbol: string, limit: number = 20): Promise<OrderBook> {
    this.logger.debug({ symbol, limit }, 'Fetching order book from Bybit');
    return {
      id: `${ExchangeName.BYBIT}:${symbol}:${Date.now()}`,
      exchange: ExchangeName.BYBIT,
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
      name: 'Bybit',
      timezone: 'UTC',
      serverTime: Date.now(),
      symbolCount: this.availableMarkets.size,
    };
  }

  private async loadExchangeInfo(): Promise<void> {
    this.logger.debug('Loading exchange info from Bybit');

    try {
      const response = await this.restClient?.request<{ result?: { list?: BybitInstrument[] } }>({
        path: '/v5/market/instruments-info?category=spot',
        method: 'GET',
      });

      this.availableMarkets.clear();
      for (const instrument of response?.data?.result?.list ?? []) {
        const baseAsset = instrument.baseCoin;
        const quoteAsset = instrument.quoteCoin;
        if (baseAsset && quoteAsset) {
          const symbol = `${baseAsset.toUpperCase()}/${quoteAsset.toUpperCase()}`;
          this.availableMarkets.set(instrument.symbol ?? symbol, {
            symbol: instrument.symbol ?? symbol,
            baseAsset: baseAsset.toUpperCase(),
            quoteAsset: quoteAsset.toUpperCase(),
          });
        }
      }

      this.exchangeInfoFetched = true;
    } catch (error) {
      this.logger.error({ error }, 'Failed to load exchange info from Bybit');
      throw error;
    }
  }

  private toBybitSymbol(symbol: string): string {
    return symbol.replace('/', '').toUpperCase();
  }
}
