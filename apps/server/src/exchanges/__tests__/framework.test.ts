import { describe, expect, it } from 'vitest';
import { BaseExchangeProvider } from '../base-exchange-provider.js';
import { ExchangeFactory } from '../factory.js';
import { ExchangeManager } from '../manager.js';
import { ExchangeRegistry } from '../registry.js';
import { DefaultConnectionHealthService } from '../services/connection-health-service.js';
import { DefaultMarketDataService } from '../services/market-data-service.js';
import { PriceNormalizer } from '../normalizers/price-normalizer.js';
import { SymbolMapper } from '../normalizers/symbol-mapper.js';
import { ReconnectStrategy } from '../reconnect-strategy.js';
import { InMemoryCache } from '../cache.js';

class StubProvider extends BaseExchangeProvider {
  constructor() {
    super('stub', { name: 'stub' });
  }
}

describe('exchange integration framework', () => {
  it('registers and creates providers through the registry and factory', async () => {
    const registry = new ExchangeRegistry();
    const provider = new StubProvider();
    registry.register(provider);

    const factory = new ExchangeFactory(registry);
    const created = factory.create('stub');

    expect(created.name).toBe('stub');
    await created.connect();
    expect(created.getConnectionState().connected).toBe(true);
  });

  it('manages provider lifecycle and normalizes market data', async () => {
    const registry = new ExchangeRegistry();
    registry.register(new StubProvider());

    const manager = new ExchangeManager(new ExchangeFactory(registry));
    await manager.connect('stub');
    expect(manager.get('stub')?.getConnectionState().connected).toBe(true);

    const mapper = new SymbolMapper();
    mapper.register('btc', 'btc');
    const normalizer = new PriceNormalizer();
    const service = new DefaultMarketDataService(normalizer, mapper);

    const price = await service.getPrice('btc');
    expect(price).toBeGreaterThan(0);

    await manager.disconnect('stub');
    expect(manager.get('stub')).toBeUndefined();
  });

  it('evaluates health and reconnect behavior', () => {
    const health = new DefaultConnectionHealthService();
    expect(health.evaluate({ connected: true, reconnectAttempts: 0 })).toBe('healthy');
    expect(health.evaluate({ connected: true, reconnectAttempts: 2 })).toBe('degraded');
    expect(health.evaluate({ connected: false, reconnectAttempts: 0 })).toBe('down');

    const strategy = new ReconnectStrategy(100, 1000, 2);
    expect(strategy.nextDelay(0)).toBe(100);
    expect(strategy.nextDelay(2)).toBe(400);

    const cache = new InMemoryCache();
    cache.set('foo', 'bar', 1000);
    expect(cache.get('foo')).toBe('bar');
  });
});
