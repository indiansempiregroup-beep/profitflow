import type { FastifyInstance } from 'fastify';
import { BinanceProvider } from '@/exchanges/providers/binance/provider.js';
import { CoinDCXProvider } from '@/exchanges/providers/coindcx/provider.js';
import { BybitProvider } from '@/exchanges/providers/bybit/provider.js';
import { OKXProvider } from '@/exchanges/providers/okx/provider.js';
import { FetchTransport } from '@/exchanges/transport/fetch-transport.js';
import { InternalEventBus } from '@/exchanges/market-data/event-bus.js';
import { NormalizedMarketStore } from '@/exchanges/market-data/store.js';
import { ProviderHealthMonitor } from '@/exchanges/market-data/health-monitor.js';
import { StaleDataDetector } from '@/exchanges/market-data/stale-detector.js';
import { MarketDataAggregator } from '@/exchanges/market-data/aggregator.js';
import { OpportunityEngine } from '@/arbitrage/opportunity-engine.js';
import { persistValidatedOpportunity } from '@/arbitrage/opportunity-persistence.js';
import { prisma } from '@/database/client.js';
import { notifyAllUsers } from '@/services/notification-service.js';
import type { BaseExchangeProvider } from '@/exchanges/base-exchange-provider.js';
import type { ValidatedOpportunity } from '@profitflow/shared';

export interface RuntimeServices {
  opportunityEngine: OpportunityEngine;
  marketDataAggregator: MarketDataAggregator;
  providers: BaseExchangeProvider[];
  stop: () => Promise<void>;
}

interface MarketAwareProvider extends BaseExchangeProvider {
  getMarkets?(): Promise<Array<{ symbol: string; baseAsset: string; quoteAsset: string }>>;
}

const extractCanonicalSymbols = (
  markets: Array<{ baseAsset: string; quoteAsset: string }>,
): string[] =>
  Array.from(
    new Set(
      markets
        .map((market) => `${market.baseAsset.toUpperCase()}/${market.quoteAsset.toUpperCase()}`)
        .filter(Boolean),
    ),
  );

const intersectSymbols = (symbolSets: string[][]): string[] => {
  if (symbolSets.length === 0) {
    return [];
  }

  const [first, ...rest] = symbolSets;
  const shared = new Set(first.map((symbol) => symbol.toUpperCase()));

  for (const symbols of rest) {
    const normalized = symbols.map((entry) => entry.toUpperCase());
    for (const symbol of Array.from(shared)) {
      if (!normalized.includes(symbol)) {
        shared.delete(symbol);
      }
    }
  }

  return Array.from(shared).sort();
};

const STARTUP_SYMBOL_LIMIT = Number(process.env.STARTUP_SYMBOL_LIMIT ?? 10);
const PRIORITY_SYMBOLS = [
  'BTC/USDT',
  'ETH/USDT',
  'SOL/USDT',
  'XRP/USDT',
  'BNB/USDT',
  'DOGE/USDT',
  'ADA/USDT',
  'AVAX/USDT',
  'LINK/USDT',
  'LTC/USDT',
];

const prioritizeSymbols = (symbols: string[]): string[] => {
  const available = new Set(symbols.map((symbol) => symbol.toUpperCase()));
  const priority = PRIORITY_SYMBOLS.filter((symbol) => available.has(symbol));
  const rest = symbols.filter((symbol) => !priority.includes(symbol.toUpperCase()));
  return [...priority, ...rest];
};

const resolveStartupSymbols = (commonSymbols: string[], providerSymbols: string[]): string[] => {
  if (commonSymbols.length > 0) {
    return prioritizeSymbols(commonSymbols).slice(0, STARTUP_SYMBOL_LIMIT);
  }

  return prioritizeSymbols(providerSymbols).slice(0, STARTUP_SYMBOL_LIMIT);
};

const discoverProviderSymbols = async (provider: MarketAwareProvider): Promise<string[]> => {
  if (!provider.getMarkets) {
    return [];
  }

  const markets = await provider.getMarkets();
  return extractCanonicalSymbols(markets);
};

export const initializeRuntime = async (app: FastifyInstance): Promise<RuntimeServices> => {
  const logger = app.log;
  // Fastify's logger shape may not exactly match pino's Logger type used across
  // providers; cast to `pino.Logger` to satisfy typings.
  const pinoLogger = logger as unknown as import('pino').Logger;
  const transport = new FetchTransport();
  const eventBus = new InternalEventBus();
  const store = new NormalizedMarketStore();
  const healthMonitor = new ProviderHealthMonitor();
  const staleDetector = new StaleDataDetector(5000);

  const opportunityEngine = new OpportunityEngine({
    eventBus,
    store,
    healthMonitor,
    staleDetector,
  });

  const marketDataAggregator = new MarketDataAggregator({
    eventBus,
    store,
    healthMonitor,
    staleDetector,
  });

  const providers: BaseExchangeProvider[] = [
    new BinanceProvider(pinoLogger, transport, { enableWebSocket: false }),
    new CoinDCXProvider(pinoLogger, transport, { enableWebSocket: false }),
    new BybitProvider(pinoLogger, transport, { enableWebSocket: false }),
    new OKXProvider(pinoLogger, transport, { enableWebSocket: false }),
  ];

  const symbolSets: string[][] = [];

  for (const provider of providers) {
    try {
      logger.info({ provider: provider.name }, 'Connecting provider to discover available markets');
      await provider.connect();
      const symbols = await discoverProviderSymbols(provider as MarketAwareProvider);
      symbolSets.push(symbols);
      logger.info(
        { provider: provider.name, symbols: symbols.slice(0, 10) },
        'Discovered provider symbols',
      );
    } catch (error) {
      logger.warn(
        { provider: provider.name, error },
        'Failed to discover provider markets during startup',
      );
      symbolSets.push([]);
    }
  }

  const commonSymbols = intersectSymbols(symbolSets);
  logger.info(
    { commonCount: commonSymbols.length, commonSymbols },
    'Computed common startup symbols',
  );

  for (const provider of providers) {
    const providerSymbols = resolveStartupSymbols(commonSymbols, symbolSets.shift() ?? []);
    marketDataAggregator.registerProvider(provider, providerSymbols);
  }

  opportunityEngine.start();

  for (const provider of providers) {
    try {
      await marketDataAggregator.startProvider(provider.name);
    } catch (error) {
      logger.warn(
        { provider: provider.name, error },
        'Provider startup failed while fetching initial market data',
      );
    }
  }

  eventBus.subscribe('scanner.opportunity.validated', async (event) => {
    const opportunity = event.payload as ValidatedOpportunity;
    try {
      await persistValidatedOpportunity(opportunity);
      await notifyAllUsers(prisma, {
        title: 'New arbitrage opportunity',
        body: `${opportunity.symbol}: ${opportunity.spreadPercentage.toFixed(2)}% spread between ${opportunity.buyExchange} and ${opportunity.sellExchange}.`,
        type: 'Scanner',
        data: {
          opportunityId: opportunity.id,
          symbol: opportunity.symbol,
          spreadPercentage: opportunity.spreadPercentage,
        },
      });
    } catch (error) {
      logger.error({ error, opportunity }, 'Failed to persist validated opportunity');
    }
  });

  const stop = async (): Promise<void> => {
    logger.info('Stopping runtime services');
    opportunityEngine.stop();

    for (const provider of providers) {
      try {
        await marketDataAggregator.stopProvider(provider.name);
      } catch (error) {
        logger.warn(
          { provider: provider.name, error },
          'Provider disconnect failed during shutdown',
        );
      }
    }
  };

  return {
    opportunityEngine,
    marketDataAggregator,
    providers,
    stop,
  };
};
