import type { Ticker, OrderBook, Fee } from '@profitflow/shared';
import type { BinanceTicker, BinanceOrderBook, BinanceTradeFee } from '../types.js';
import { ExchangeName } from '@profitflow/shared';

export class BinancePriceNormalizer {
  private readonly maxDecimals = 8;

  /**
   * Normalize a price to a consistent decimal format
   */
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

  /**
   * Normalize a volume/quantity to a consistent decimal format
   */
  normalizeVolume(volume: string | number): number {
    return this.normalizePrice(volume);
  }

  /**
   * Normalize a percentage
   */
  normalizePercent(percent: string | number): number {
    const value = this.normalizePrice(percent);
    return Number((value / 100).toFixed(this.maxDecimals));
  }

  /**
   * Convert Binance ticker to domain Ticker model
   */
  normalizeTicker(binanceTicker: BinanceTicker, symbol: string): Ticker {
    const price = this.normalizePrice(binanceTicker.lastPrice);
    const volume = this.normalizeVolume(binanceTicker.volume);
    const change24h = this.normalizePercent(binanceTicker.priceChangePercent);

    return {
      id: `${ExchangeName.BINANCE}:${symbol}:${Date.now()}`,
      exchange: ExchangeName.BINANCE,
      symbol,
      price,
      volume24h: volume,
      change24h,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Convert Binance order book to domain OrderBook model
   */
  normalizeOrderBook(binanceOrderBook: BinanceOrderBook, symbol: string): OrderBook {
    const bids = binanceOrderBook.bids
      .slice(0, 20) // Limit to 20 levels
      .map(([price, quantity]) => ({
        price: this.normalizePrice(price),
        quantity: this.normalizeVolume(quantity),
      }))
      .filter((b) => b.quantity > 0);

    const asks = binanceOrderBook.asks
      .slice(0, 20)
      .map(([price, quantity]) => ({
        price: this.normalizePrice(price),
        quantity: this.normalizeVolume(quantity),
      }))
      .filter((a) => a.quantity > 0);

    return {
      id: `${ExchangeName.BINANCE}:${symbol}:${Date.now()}`,
      exchange: ExchangeName.BINANCE,
      symbol,
      bids,
      asks,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Convert Binance trade fee to domain Fee model
   */
  normalizeFee(binanceFee: BinanceTradeFee, symbol: string): Fee {
    const makerFee = this.normalizePercent(binanceFee.makerCommission);
    const takerFee = this.normalizePercent(binanceFee.takerCommission);

    return {
      id: `${ExchangeName.BINANCE}:${symbol}:${Date.now()}`,
      exchange: ExchangeName.BINANCE,
      symbol,
      makerFee,
      takerFee,
      updatedAt: new Date().toISOString(),
    };
  }

  private normalize(value: number): number {
    return Number(value.toFixed(this.maxDecimals));
  }
}
