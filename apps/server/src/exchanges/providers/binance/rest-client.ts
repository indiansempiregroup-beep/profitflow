import { createHmac } from 'node:crypto';
import type { RestClientTransport, RestRequestOptions, RestResponse } from '../../transport/rest-client.js';
import type { RestClientOptions } from '../../transport/rest-client.js';
import { RestClient } from '../../transport/rest-client.js';
import type { Logger } from 'pino';
import type {
  BinanceExchangeInfo,
  BinanceTicker,
  BinanceOrderBook,
  BinanceAccountTradeList,
} from './types.js';
import { BinanceApiError } from './errors.js';

export interface BinanceRestClientOptions extends RestClientOptions {
  apiKey?: string;
  apiSecret?: string;
}

export class BinanceRequestSigner {
  constructor(
    private readonly apiKey?: string,
    private readonly apiSecret?: string,
  ) {}

  sign(request: RestRequestOptions): RestRequestOptions {
    if (!this.apiKey || !this.apiSecret) {
      return request;
    }

    const headers = {
      ...request.headers,
      'X-MBX-APIKEY': this.apiKey,
    };

    return {
      ...request,
      headers,
    };
  }
}

export class BinanceRestClient {
  private readonly client: RestClient;
  private readonly baseUrl = 'https://api.binance.com';

  constructor(
    private readonly logger: Logger,
    transport: RestClientTransport,
    options: BinanceRestClientOptions = {},
  ) {
    const signer = new BinanceRequestSigner(options.apiKey, options.apiSecret);

    this.client = new RestClient(transport, {
      baseUrl: options.baseUrl ?? this.baseUrl,
      timeoutMs: options.timeoutMs ?? 10000,
      maxRetries: options.maxRetries ?? 3,
      backoffBaseMs: options.backoffBaseMs ?? 100,
      rateLimitPerSecond: options.rateLimitPerSecond ?? 20, // Binance: 1200 req/min = 20 req/sec
      middleware: options.middleware,
      interceptors: options.interceptors,
      signer,
    });
  }

  async getExchangeInfo(): Promise<BinanceExchangeInfo> {
    this.logger.debug('Fetching exchange info from Binance');

    try {
      const data = await this.client.request<BinanceExchangeInfo>({
        path: '/api/v3/exchangeInfo',
        method: 'GET',
      });

      this.logger.info(
        { symbolCount: data.symbols.length },
        'Successfully fetched exchange info from Binance',
      );

      return data;
    } catch (error) {
      this.logger.error({ error }, 'Failed to fetch exchange info from Binance');
      throw new BinanceApiError('Failed to fetch exchange info', error as unknown);
    }
  }

  async getTicker(symbol: string): Promise<BinanceTicker> {
    this.logger.debug({ symbol }, 'Fetching ticker from Binance');

    try {
      const data = await this.client.request<BinanceTicker>({
        path: '/api/v3/ticker/24hr',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      this.logger.debug({ symbol, price: data.lastPrice }, 'Successfully fetched ticker from Binance');

      return data;
    } catch (error) {
      this.logger.warn({ symbol, error }, 'Failed to fetch ticker from Binance');
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BinanceApiError(message.includes('API Error') ? message : `Failed to fetch ticker for ${symbol}`, error as unknown);
    }
  }

  async getTickers(): Promise<BinanceTicker[]> {
    this.logger.debug('Fetching all tickers from Binance');

    try {
      const data = await this.client.request<BinanceTicker[]>({
        path: '/api/v3/ticker/24hr',
        method: 'GET',
      });

      this.logger.info({ count: data.length }, 'Successfully fetched all tickers from Binance');

      return data;
    } catch (error) {
      this.logger.error({ error }, 'Failed to fetch all tickers from Binance');
      throw new BinanceApiError('Failed to fetch all tickers', error as unknown);
    }
  }

  async getOrderBook(symbol: string, limit: number = 20): Promise<BinanceOrderBook> {
    this.logger.debug({ symbol, limit }, 'Fetching order book from Binance');

    try {
      const data = await this.client.request<BinanceOrderBook>({
        path: '/api/v3/depth',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      this.logger.debug(
        { symbol, bidCount: data.bids.length, askCount: data.asks.length },
        'Successfully fetched order book from Binance',
      );

      return data;
    } catch (error) {
      this.logger.warn({ symbol, error }, 'Failed to fetch order book from Binance');
      throw new BinanceApiError(`Failed to fetch order book for ${symbol}`, error as unknown);
    }
  }

  async getTradingFees(): Promise<BinanceAccountTradeList> {
    this.logger.debug('Fetching trading fees from Binance');

    try {
      const data = await this.client.request<BinanceAccountTradeList>({
        path: '/sapi/v1/asset/tradeFee',
        method: 'GET',
      });

      this.logger.info(
        { feeCount: data.tradeFees.length },
        'Successfully fetched trading fees from Binance',
      );

      return data;
    } catch (error) {
      this.logger.error({ error }, 'Failed to fetch trading fees from Binance');
      throw new BinanceApiError('Failed to fetch trading fees', error as unknown);
    }
  }

  async ping(): Promise<void> {
    this.logger.debug('Pinging Binance API');

    try {
      await this.client.request<Record<string, unknown>>({
        path: '/api/v3/ping',
        method: 'GET',
      });

      this.logger.debug('Binance API ping successful');
    } catch (error) {
      this.logger.error({ error }, 'Binance API ping failed');
      throw new BinanceApiError('Binance API ping failed', error as unknown);
    }
  }
}
