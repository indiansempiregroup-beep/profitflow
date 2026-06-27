import { describe, expect, it } from 'vitest';

import {
  ExchangeName,
  MarketType,
  TradeSide,
  ValidationError,
  err,
  ok,
} from '../index';

describe('shared domain contracts', () => {
  it('exports the domain enums and helpers', () => {
    expect(ExchangeName.MOCK).toBe('MOCK');
    expect(MarketType.SPOT).toBe('SPOT');
    expect(TradeSide.BUY).toBe('BUY');

    expect(ok('ready')).toEqual({ ok: true, value: 'ready' });
    expect(err(new ValidationError('invalid'))).toEqual({
      ok: false,
      error: new ValidationError('invalid'),
    });
  });
});
