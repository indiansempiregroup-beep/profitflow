import type { Logger } from 'pino';
import type { Fee, OrderBook, Ticker } from '@profitflow/shared';
import { ProviderError } from '@profitflow/shared';
import { BaseExchangeProvider } from '../../base-exchange-provider.js';
import type { ExchangeConfig } from '../../types.js';
import type { RestClientTransport } from '../../transport/rest-client.js';
import { CoinDCXRestClient } from './rest-client.js';
import { CoinDCXPriceNormalizer } from './normalizers/price-normalizer.js';
import { CoinDCXSymbolMapper } from './normalizers/symbol-mapper.js';
import { CoinDCXApiError } from './errors.js';
import { CoinDCXWebSocketClient } from './websocket-client.js';

export interface CoinDCXProviderConfig extends ExchangeConfig {
  apiKey?: string;
  apiSecret?: string;
  enableWebSocket?: boolean;
}

export class CoinDCXProvider extends BaseExchangeProvider {
  private readonly apiClient: CoinDCXRestClient;
  private readonly coinDcXWebsocketClient: CoinDCXWebSocketClient | null;
  private readonly priceNormalizer = new CoinDCXPriceNormalizer();
  private readonly symbolMapper = new CoinDCXSymbolMapper();
  private availableMarkets = new Map<
    string,
    { symbol: string; baseAsset: string; quoteAsset: string }
  >();
  private exchangeInfoFetched = false;

  constructor(
    private readonly logger: Logger,
    transport: RestClientTransport,
    config: CoinDCXProviderConfig = {},
  ) {
    super('COINDCX', config, undefined, undefined);

    this.apiClient = new CoinDCXRestClient(logger, transport, {
      baseUrl: config.baseUrl,
      timeoutMs: config.timeoutMs ?? 10000,
      maxRetries: config.maxRetries ?? 3,
      backoffBaseMs: config.backoffBaseMs ?? 100,
      rateLimitPerSecond: config.rateLimitPerSecond ?? 5,
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
    });

    this.coinDcXWebsocketClient = config.enableWebSocket
      ? new CoinDCXWebSocketClient(logger, {
          heartbeatIntervalMs: config.heartbeatIntervalMs ?? 30000,
          reconnectMaxAttempts: config.reconnectMaxAttempts ?? 5,
          reconnectBaseDelayMs: config.backoffBaseMs ?? 1000,
        })
      : null;
  }

  async connect(): Promise<void> {
    this.logger.info('Connecting to CoinDCX provider');

    try {
      await this.apiClient.ping();
      if (!this.exchangeInfoFetched) {
        await this.loadExchangeInfo();
      }

      if (this.coinDcXWebsocketClient) {
        try {
          await this.coinDcXWebsocketClient.connect();
          this.logger.info('CoinDCX WebSocket connected');
        } catch (error) {
          this.logger.warn({ error }, 'CoinDCX WebSocket connection failed (non-blocking)');
        }
        this.coinDcXWebsocketClient.on('error', (err) => {
          this.logger.warn({ err }, 'CoinDCX WebSocket error emitted');
          this.markError(err);
        });

        this.coinDcXWebsocketClient.on('disconnected', () => {
          this.logger.warn('CoinDCX WebSocket event: disconnected');
        });
      }

      this.connectionState.connected = true;
      this.connectionState.reconnectAttempts = 0;
      this.logger.info('CoinDCX provider connected successfully');
    } catch (error) {
      this.markError(error);
      this.logger.error({ error }, 'Failed to connect to CoinDCX provider');
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.logger.info('Disconnecting from CoinDCX provider');

    try {
      if (this.coinDcXWebsocketClient) {
        await this.coinDcXWebsocketClient.disconnect();
        this.logger.debug('CoinDCX WebSocket disconnected');
      }

      this.connectionState.connected = false;
      this.logger.info('CoinDCX provider disconnected successfully');
    } catch (error) {
      this.logger.error({ error }, 'Error during CoinDCX provider disconnect');
      throw error;
    }
  }

  async getMarkets(): Promise<Array<{ symbol: string; baseAsset: string; quoteAsset: string }>> {
    if (!this.exchangeInfoFetched) {
      await this.loadExchangeInfo();
    }

    return Array.from(this.availableMarkets.values());
  }

  async getTicker(symbol: string): Promise<Ticker> {
    this.logger.debug({ symbol }, 'Fetching ticker from CoinDCX');

    try {
      const coinDcXSymbol = this.symbolMapper.toCoinDCX(symbol);
      const ticker = await this.apiClient.getTicker(coinDcXSymbol);
      const normalized = this.priceNormalizer.normalizeTicker(ticker, symbol);

      this.cache.set(`ticker:${symbol}`, normalized, 5000);
      this.markHeartbeat();
      return normalized;
    } catch (error) {
      this.markError(error);
      this.logger.error({ symbol, error }, 'Failed to fetch ticker from CoinDCX');
      if (error instanceof CoinDCXApiError) {
        throw new ProviderError('Failed to fetch ticker from provider');
      }
      throw error;
    }
  }

  async getTickers(): Promise<Ticker[]> {
    this.logger.debug('Fetching all tickers from CoinDCX');

    try {
      const tickers = await this.apiClient.getTickers();
      const normalized = tickers
        .filter((ticker) => this.availableMarkets.has(ticker.symbol ?? ticker.market ?? ''))
        .map((ticker) => {
          const symbol = this.symbolMapper.fromCoinDCX(ticker.symbol ?? ticker.market ?? '');
          return this.priceNormalizer.normalizeTicker(ticker, symbol);
        });

      this.cache.set('tickers:all', normalized, 5000);
      this.markHeartbeat();
      return normalized;
    } catch (error) {
      this.markError(error);
      this.logger.error({ error }, 'Failed to fetch all tickers from CoinDCX');
      if (error instanceof CoinDCXApiError) {
        throw new ProviderError('Failed to fetch tickers from provider');
      }
      throw error;
    }
  }

  async getOrderBook(symbol: string, limit: number = 20): Promise<OrderBook> {
    this.logger.debug({ symbol, limit }, 'Fetching order book from CoinDCX');

    try {
      const coinDcXSymbol = this.symbolMapper.toCoinDCX(symbol);
      const orderBook = await this.apiClient.getOrderBook(coinDcXSymbol, limit);
      const normalized = this.priceNormalizer.normalizeOrderBook(orderBook, symbol);

      this.cache.set(`orderbook:${symbol}`, normalized, 1000);
      this.markHeartbeat();
      return normalized;
    } catch (error) {
      this.markError(error);
      this.logger.error({ symbol, error }, 'Failed to fetch order book from CoinDCX');
      if (error instanceof CoinDCXApiError) {
        throw new ProviderError('Failed to fetch order book from provider');
      }
      throw error;
    }
  }

  async getTradingFees(): Promise<Fee[]> {
    this.logger.debug('Fetching trading fees from CoinDCX');

    try {
      const fees = await this.apiClient.getTradingFees();
      const normalized = fees
        .filter((fee) => this.availableMarkets.has(fee.symbol))
        .map((fee) => {
          const symbol = this.symbolMapper.fromCoinDCX(fee.symbol);
          return this.priceNormalizer.normalizeFee(fee, symbol);
        });

      this.cache.set('fees:all', normalized, 3600000);
      this.markHeartbeat();
      return normalized;
    } catch (error) {
      this.markError(error);
      this.logger.error({ error }, 'Failed to fetch trading fees from CoinDCX');
      if (error instanceof CoinDCXApiError) {
        throw new ProviderError('Failed to fetch trading fees from provider');
      }
      throw error;
    }
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
      name: 'CoinDCX',
      timezone: 'UTC',
      serverTime: Date.now(),
      symbolCount: this.availableMarkets.size,
    };
  }

  private async loadExchangeInfo(): Promise<void> {
    this.logger.debug('Loading exchange info from CoinDCX');

    try {
      const exchangeInfo = await this.apiClient.getExchangeInfo();
      this.availableMarkets.clear();

      for (const market of exchangeInfo.markets) {
        const baseAsset = market.baseAsset ?? market.target_currency_short_name;
        const quoteAsset = market.quoteAsset ?? market.base_currency_short_name;
        const isActive = market.isActive ?? market.status !== 'inactive';

        if (isActive && baseAsset && quoteAsset) {
          this.availableMarkets.set(market.symbol, {
            symbol: market.symbol,
            baseAsset,
            quoteAsset,
          });

          const canonical = this.createCanonicalSymbol(baseAsset, quoteAsset);
          this.symbolMapper.register(market.symbol, canonical);
        }
      }

      this.exchangeInfoFetched = true;
      this.logger.info(
        { symbolCount: this.availableMarkets.size },
        'Exchange info loaded successfully',
      );
    } catch (error) {
      this.logger.error({ error }, 'Failed to load exchange info from CoinDCX');
      throw error;
    }
  }

  getWebSocketClient(): CoinDCXWebSocketClient | null {
    return this.coinDcXWebsocketClient;
  }

  private createCanonicalSymbol(baseAsset: string, quoteAsset: string): string {
    return `${baseAsset.toUpperCase()}/${quoteAsset.toUpperCase()}`;
  }
}
