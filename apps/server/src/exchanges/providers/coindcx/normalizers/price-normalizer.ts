import type { Fee, OrderBook, Ticker } from '@profitflow/shared';
import { ExchangeName } from '@profitflow/shared';
import type { CoinDCXFee, CoinDCXOrderBook, CoinDCXTicker } from '../types.js';

export class CoinDCXPriceNormalizer {
  private readonly maxDecimals = 8;

  normalizePrice(price: string | number): number {
    if (typeof price === 'string') {
      const parsed = parseFloat(price);
      if (!Number.isFinite(parsed)) {
        throw new Error(`Invalid price format: ${price}`);
      }
      return this.normalize(parsed);
    }

    if (!Number.isFinite(price)) {
      throw new Error(`Invalid price: ${price}`);
    }

    return this.normalize(price);
  }

  normalizeVolume(volume: string | number): number {
    return this.normalizePrice(volume);
  }

  normalizePercent(percent: string | number): number {
    const value = this.normalizePrice(percent);
    return Number((value / 100).toFixed(this.maxDecimals));
  }

  normalizeTicker(ticker: CoinDCXTicker, symbol: string): Ticker {
    return {
      id: `${ExchangeName.COINDCX}:${symbol}:${Date.now()}`,
      exchange: ExchangeName.COINDCX,
      symbol,
      price: this.normalizePrice(ticker.lastPrice),
      volume24h: this.normalizeVolume(ticker.volume),
      change24h: this.normalizePercent(ticker.change),
      generatedAt: new Date().toISOString(),
    };
  }

  normalizeOrderBook(orderBook: CoinDCXOrderBook, symbol: string): OrderBook {
    const bids = orderBook.bids
      .slice(0, 20)
      .map(([price, quantity]) => ({
        price: this.normalizePrice(price),
        quantity: this.normalizeVolume(quantity),
      }))
      .filter((item) => item.quantity > 0);

    const asks = orderBook.asks
      .slice(0, 20)
      .map(([price, quantity]) => ({
        price: this.normalizePrice(price),
        quantity: this.normalizeVolume(quantity),
      }))
      .filter((item) => item.quantity > 0);

    return {
      id: `${ExchangeName.COINDCX}:${symbol}:${Date.now()}`,
      exchange: ExchangeName.COINDCX,
      symbol,
      bids,
      asks,
      generatedAt: new Date().toISOString(),
    };
  }

  normalizeFee(fee: CoinDCXFee, symbol: string): Fee {
    return {
      id: `${ExchangeName.COINDCX}:${symbol}:${Date.now()}`,
      exchange: ExchangeName.COINDCX,
      symbol,
      makerFee: this.normalizePercent(fee.makerFee),
      takerFee: this.normalizePercent(fee.takerFee),
      updatedAt: new Date().toISOString(),
    };
  }

  private normalize(value: number): number {
    return Number(value.toFixed(this.maxDecimals));
  }
}
