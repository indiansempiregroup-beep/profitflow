import { describe, expect, it } from 'vitest';

import { MarketType, TradeSide } from '@profitflow/shared';
import { MockExchangeProvider } from './mock-exchange-provider.js';

describe('mock exchange provider', () => {
  it('returns a ticker and accepts a mock order', async () => {
    const provider = new MockExchangeProvider();

    const connected = await provider.connect();
    expect(connected.ok).toBe(true);

    const ticker = await provider.getTicker('btcusdt');
    expect(ticker.ok).toBe(true);
    if (ticker.ok) {
      expect(ticker.value.symbol).toBe('BTCUSDT');
      expect(ticker.value.price).toBeGreaterThan(0);
    }

    const order = await provider.placeOrder('ethusdt', TradeSide.BUY, 1, 3200, MarketType.SPOT);
    expect(order.ok).toBe(true);
    if (order.ok) {
      expect(order.value).toMatchObject({
        symbol: 'ETHUSDT',
        side: TradeSide.BUY,
        quantity: 1,
      });
    }
  });
});
