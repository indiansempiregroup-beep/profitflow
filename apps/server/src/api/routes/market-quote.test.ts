import { describe, expect, it } from 'vitest';
import { normalizeMarketQuoteSymbol } from './market-quote-utils.js';

describe('normalizeMarketQuoteSymbol', () => {
  it('adds a default quote currency when a bare base asset is provided', () => {
    expect(normalizeMarketQuoteSymbol('btc')).toBe('BTC/USDT');
    expect(normalizeMarketQuoteSymbol('eth')).toBe('ETH/USDT');
  });

  it('preserves existing canonical symbols and exchange-style pairs', () => {
    expect(normalizeMarketQuoteSymbol('BTC/USDT')).toBe('BTC/USDT');
    expect(normalizeMarketQuoteSymbol('BTCUSDT')).toBe('BTCUSDT');
  });
});
