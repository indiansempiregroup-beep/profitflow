import type { Logger } from 'pino';
import type { Ticker, OrderBook, Fee } from '@profitflow/shared';
import { BaseExchangeProvider } from '../../base-exchange-provider.js';
import type { ExchangeConfig } from '../../types.js';
import type { RestClientTransport } from '../../transport/rest-client.js';
import { BinanceRestClient } from './rest-client.js';
import { BinanceWebSocketClient } from './websocket-client.js';
import { BinanceSymbolMapper } from './normalizers/symbol-mapper.js';
import { BinancePriceNormalizer } from './normalizers/price-normalizer.js';
import { BinanceApiError } from './errors.js';
import { ProviderError } from '@profitflow/shared';

export interface BinanceProviderConfig extends ExchangeConfig {
  apiKey?: string;
  apiSecret?: string;
  enableWebSocket?: boolean;
}

export class BinanceProvider extends BaseExchangeProvider {
  private readonly apiClient: BinanceRestClient;
  private readonly binanceWebsocketClient: BinanceWebSocketClient | null;
  private readonly symbolMapper: BinanceSymbolMapper;
  private readonly priceNormalizer: BinancePriceNormalizer;
  private availableMarkets: Map<string, { symbol: string; baseAsset: string; quoteAsset: string }> =
    new Map();
  private exchangeInfoFetched = false;

  constructor(
    private readonly logger: Logger,
    transport: RestClientTransport,
    config: BinanceProviderConfig = {},
  ) {
    super('BINANCE', config, undefined, undefined);

    this.apiClient = new BinanceRestClient(logger, transport, {
      baseUrl: config.baseUrl,
      timeoutMs: config.timeoutMs ?? 10000,
      maxRetries: config.maxRetries ?? 3,
      backoffBaseMs: config.backoffBaseMs ?? 100,
      rateLimitPerSecond: config.rateLimitPerSecond ?? 20,
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
    });

    this.binanceWebsocketClient = config.enableWebSocket
      ? new BinanceWebSocketClient(logger, {
          heartbeatIntervalMs: config.heartbeatIntervalMs ?? 30000,
          reconnectMaxAttempts: config.reconnectMaxAttempts ?? 5,
          reconnectBaseDelayMs: config.backoffBaseMs ?? 1000,
        })
      : null;

    this.symbolMapper = new BinanceSymbolMapper();
    this.priceNormalizer = new BinancePriceNormalizer();

    // Register common trading pairs
    this.registerCommonPairs();
  }

  async connect(): Promise<void> {
    this.logger.info('Connecting to Binance provider');

    try {
      // Verify API connectivity
      await this.apiClient.ping();
      this.logger.debug('Binance API ping successful');

      // Fetch exchange info once
      if (!this.exchangeInfoFetched) {
        await this.loadExchangeInfo();
      }

      // Connect WebSocket if enabled
      if (this.binanceWebsocketClient) {
        try {
          await this.binanceWebsocketClient.connect();
          this.logger.info('Binance WebSocket connected');
        } catch (error) {
          this.logger.warn({ error }, 'WebSocket connection failed (non-blocking)');
          // Don't fail provider connection if WebSocket fails
        }
        this.binanceWebsocketClient.on('error', (err) => {
          this.logger.warn({ err }, 'WebSocket error emitted');
          this.markError(err);
        });

        this.binanceWebsocketClient.on('connected', () => {
          this.logger.info('Binance WebSocket event: connected');
        });

        this.binanceWebsocketClient.on('disconnected', () => {
          this.logger.warn('Binance WebSocket event: disconnected');
        });
      }

      this.connectionState.connected = true;
      this.connectionState.reconnectAttempts = 0;
      this.logger.info('Binance provider connected successfully');
    } catch (error) {
      this.markError(error);
      this.logger.error({ error }, 'Failed to connect to Binance provider');
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.logger.info('Disconnecting from Binance provider');

    try {
      if (this.binanceWebsocketClient) {
        await this.binanceWebsocketClient.disconnect();
        this.logger.debug('Binance WebSocket disconnected');
      }

      this.connectionState.connected = false;
      this.logger.info('Binance provider disconnected successfully');
    } catch (error) {
      this.logger.error({ error }, 'Error during Binance provider disconnect');
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
    this.logger.debug({ symbol }, 'Fetching ticker from Binance');

    try {
      const binanceSymbol = this.symbolMapper.toBinance(symbol);
      const binanceTicker = await this.apiClient.getTicker(binanceSymbol);
      const ticker = this.priceNormalizer.normalizeTicker(binanceTicker, symbol);

      this.cache.set(`ticker:${symbol}`, ticker, 5000); // Cache for 5 seconds
      this.markHeartbeat();

      return ticker;
    } catch (error) {
      this.markError(error);
      this.logger.error({ symbol, error }, 'Failed to fetch ticker from Binance');
      if (error instanceof BinanceApiError) {
        throw new ProviderError('Failed to fetch ticker from provider');
      }
      throw error;
    }
  }

  async getTickers(): Promise<Ticker[]> {
    this.logger.debug('Fetching all tickers from Binance');

    try {
      const binanceTickers = await this.apiClient.getTickers();
      const tickers = binanceTickers
        .filter((bt) => this.availableMarkets.has(bt.symbol))
        .map((bt) => {
          const symbol = this.symbolMapper.fromBinance(bt.symbol);
          return this.priceNormalizer.normalizeTicker(bt, symbol);
        });

      this.cache.set('tickers:all', tickers, 5000);
      this.markHeartbeat();

      this.logger.debug({ count: tickers.length }, 'Successfully fetched all tickers');

      return tickers;
    } catch (error) {
      this.markError(error);
      this.logger.error({ error }, 'Failed to fetch all tickers from Binance');
      if (error instanceof BinanceApiError) {
        throw new ProviderError('Failed to fetch tickers from provider');
      }
      throw error;
    }
  }

  async getOrderBook(symbol: string, limit: number = 20): Promise<OrderBook> {
    this.logger.debug({ symbol, limit }, 'Fetching order book from Binance');

    try {
      const binanceSymbol = this.symbolMapper.toBinance(symbol);
      const binanceOrderBook = await this.apiClient.getOrderBook(binanceSymbol, limit);
      const orderBook = this.priceNormalizer.normalizeOrderBook(binanceOrderBook, symbol);

      this.cache.set(`orderbook:${symbol}`, orderBook, 1000); // Cache for 1 second
      this.markHeartbeat();

      return orderBook;
    } catch (error) {
      this.markError(error);
      this.logger.error({ symbol, error }, 'Failed to fetch order book from Binance');
      if (error instanceof BinanceApiError) {
        throw new ProviderError('Failed to fetch order book from provider');
      }
      throw error;
    }
  }

  async getTradingFees(): Promise<Fee[]> {
    this.logger.debug('Fetching trading fees from Binance');

    try {
      const accountTradeList = await this.apiClient.getTradingFees();
      const fees = accountTradeList.tradeFees
        .filter((tf) => this.availableMarkets.has(tf.symbol))
        .map((tf) => {
          const symbol = this.symbolMapper.fromBinance(tf.symbol);
          return this.priceNormalizer.normalizeFee(tf, symbol);
        });

      this.cache.set('fees:all', fees, 3600000); // Cache for 1 hour
      this.markHeartbeat();

      this.logger.debug({ count: fees.length }, 'Successfully fetched trading fees');

      return fees;
    } catch (error) {
      this.markError(error);
      this.logger.error({ error }, 'Failed to fetch trading fees from Binance');
      if (error instanceof BinanceApiError) {
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
      name: 'Binance',
      timezone: 'UTC',
      serverTime: Date.now(),
      symbolCount: this.availableMarkets.size,
    };
  }

  getWebSocketClient(): BinanceWebSocketClient | null {
    return this.binanceWebsocketClient;
  }

  private async loadExchangeInfo(): Promise<void> {
    this.logger.debug('Loading exchange info from Binance');

    try {
      const exchangeInfo = await this.apiClient.getExchangeInfo();

      this.availableMarkets.clear();

      for (const symbol of exchangeInfo.symbols) {
        // Only include active trading pairs
        if (symbol.status === 'TRADING') {
          this.availableMarkets.set(symbol.symbol, {
            symbol: symbol.symbol,
            baseAsset: symbol.baseAsset,
            quoteAsset: symbol.quoteAsset,
          });

          const canonical = this.createCanonicalSymbol(symbol.baseAsset, symbol.quoteAsset);
          this.symbolMapper.register(symbol.symbol, canonical);
        }
      }

      this.exchangeInfoFetched = true;
      this.logger.info(
        { symbolCount: this.availableMarkets.size },
        'Exchange info loaded successfully',
      );
    } catch (error) {
      this.logger.error({ error }, 'Failed to load exchange info from Binance');
      throw error;
    }
  }

  private registerCommonPairs(): void {
    // Register common trading pairs
    const commonPairs = [
      ['BTCUSDT', 'BTC/USDT'],
      ['ETHUSDT', 'ETH/USDT'],
      ['BNBUSDT', 'BNB/USDT'],
      ['ADAUSDT', 'ADA/USDT'],
      ['DOGEUSDT', 'DOGE/USDT'],
      ['LINKUSDT', 'LINK/USDT'],
      ['LTCUSDT', 'LTC/USDT'],
      ['XRPUSDT', 'XRP/USDT'],
      ['BCHUSDT', 'BCH/USDT'],
      ['ETCUSDT', 'ETC/USDT'],
    ];

    for (const [binance, canonical] of commonPairs) {
      this.symbolMapper.register(binance, canonical);
    }
  }

  private createCanonicalSymbol(baseAsset: string, quoteAsset: string): string {
    return `${baseAsset.toUpperCase()}/${quoteAsset.toUpperCase()}`;
  }
}
