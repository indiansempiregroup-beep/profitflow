import type { Logger } from 'pino';
import { RestClient } from '../../transport/rest-client.js';
import type { RestClientOptions, RestClientTransport } from '../../transport/rest-client.js';
import { CoinDCXApiError } from './errors.js';
import type { CoinDCXExchangeInfo, CoinDCXFee, CoinDCXMarket, CoinDCXOrderBook, CoinDCXTicker } from './types.js';

export interface CoinDCXRestClientOptions extends RestClientOptions {
  apiKey?: string;
  apiSecret?: string;
}

export class CoinDCXRestClient {
  private readonly client: RestClient;
  private readonly baseUrl = 'https://api.coindcx.com';

  constructor(
    private readonly logger: Logger,
    transport: RestClientTransport,
    options: CoinDCXRestClientOptions = {},
  ) {
    this.client = new RestClient(transport, {
      baseUrl: options.baseUrl ?? this.baseUrl,
      timeoutMs: options.timeoutMs ?? 10000,
      maxRetries: options.maxRetries ?? 3,
      backoffBaseMs: options.backoffBaseMs ?? 100,
      rateLimitPerSecond: options.rateLimitPerSecond ?? 5,
      middleware: options.middleware,
      interceptors: options.interceptors,
    });
  }

  async getMarkets(): Promise<CoinDCXMarket[]> {
    this.logger.debug('Fetching markets from CoinDCX');

    try {
      const data = await this.client.request<CoinDCXMarket[]>({
        path: '/v1/markets',
        method: 'GET',
      });

      this.logger.info({ count: data.length }, 'Successfully fetched markets from CoinDCX');
      return data;
    } catch (error) {
      this.logger.error({ error }, 'Failed to fetch markets from CoinDCX');
      throw new CoinDCXApiError('Failed to fetch CoinDCX markets', error as unknown);
    }
  }

  async getTicker(symbol: string): Promise<CoinDCXTicker> {
    this.logger.debug({ symbol }, 'Fetching ticker from CoinDCX');

    try {
      const data = await this.client.request<CoinDCXTicker>({
        path: `/v1/ticker/${symbol}`,
        method: 'GET',
      });

      this.logger.debug({ symbol, price: data.lastPrice }, 'Successfully fetched ticker from CoinDCX');
      return data;
    } catch (error) {
      this.logger.warn({ symbol, error }, 'Failed to fetch ticker from CoinDCX');
      throw new CoinDCXApiError(`Failed to fetch CoinDCX ticker for ${symbol}`, error as unknown);
    }
  }

  async getTickers(): Promise<CoinDCXTicker[]> {
    this.logger.debug('Fetching all tickers from CoinDCX');

    try {
      const data = await this.client.request<CoinDCXTicker[]>({
        path: '/v1/tickers',
        method: 'GET',
      });

      this.logger.info({ count: data.length }, 'Successfully fetched tickers from CoinDCX');
      return data;
    } catch (error) {
      this.logger.error({ error }, 'Failed to fetch CoinDCX tickers');
      throw new CoinDCXApiError('Failed to fetch CoinDCX tickers', error as unknown);
    }
  }

  async getOrderBook(symbol: string, limit: number = 20): Promise<CoinDCXOrderBook> {
    this.logger.debug({ symbol, limit }, 'Fetching order book from CoinDCX');

    try {
      const path = limit > 0 ? `/v1/orderbook/${symbol}?limit=${limit}` : `/v1/orderbook/${symbol}`;
      const data = await this.client.request<CoinDCXOrderBook>({
        path,
        method: 'GET',
      });

      this.logger.debug(
        { symbol, bidCount: data.bids.length, askCount: data.asks.length },
        'Successfully fetched order book from CoinDCX',
      );
      return data;
    } catch (error) {
      this.logger.warn({ symbol, error }, 'Failed to fetch order book from CoinDCX');
      throw new CoinDCXApiError(`Failed to fetch CoinDCX order book for ${symbol}`, error as unknown);
    }
  }

  async getTradingFees(): Promise<CoinDCXFee[]> {
    this.logger.debug('Fetching trading fees from CoinDCX');

    try {
      const data = await this.client.request<CoinDCXFee[]>({
        path: '/v1/fees',
        method: 'GET',
      });

      this.logger.info({ feeCount: data.length }, 'Successfully fetched trading fees from CoinDCX');
      return data;
    } catch (error) {
      this.logger.error({ error }, 'Failed to fetch CoinDCX trading fees');
      throw new CoinDCXApiError('Failed to fetch CoinDCX trading fees', error as unknown);
    }
  }

  async getExchangeInfo(): Promise<CoinDCXExchangeInfo> {
    this.logger.debug('Fetching exchange info from CoinDCX');

    try {
      const markets = await this.getMarkets();
      return {
        name: 'CoinDCX',
        markets,
        serverTime: Date.now(),
      };
    } catch (error) {
      this.logger.error({ error }, 'Failed to fetch exchange info from CoinDCX');
      throw new CoinDCXApiError('Failed to fetch CoinDCX exchange info', error as unknown);
    }
  }

  async ping(): Promise<void> {
    this.logger.debug('Pinging CoinDCX API');

    try {
      await this.client.request<Record<string, unknown>>({
        path: '/v1/markets',
        method: 'GET',
      });
      this.logger.debug('CoinDCX API ping successful');
    } catch (error) {
      this.logger.error({ error }, 'CoinDCX API ping failed');
      throw new CoinDCXApiError('CoinDCX API ping failed', error as unknown);
    }
  }
}
