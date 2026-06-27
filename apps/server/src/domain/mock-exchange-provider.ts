import {
  type ExchangeProvider,
  type Fee,
  type OrderBook,
  type Ticker,
  type Wallet,
  ExchangeName,
  MarketType,
  TradeSide,
  type Result,
  ok,
  err,
  ProviderError,
  BaseService,
} from '@profitflow/shared';

export class MockExchangeProvider extends BaseService implements ExchangeProvider {
  readonly name = ExchangeName.MOCK;

  async connect(): Promise<Result<void>> {
    return ok(undefined);
  }

  async disconnect(): Promise<Result<void>> {
    return ok(undefined);
  }

  async getTicker(symbol: string, marketType: MarketType = MarketType.SPOT): Promise<Result<Ticker>> {
    const normalized = symbol.toUpperCase();
    const basePrice = this.getBasePrice(normalized);
    const price = this.withNoise(basePrice, 0.01);

    return ok({
      id: `${this.name}-${normalized}-ticker`,
      exchange: this.name,
      symbol: normalized,
      price,
      volume24h: 1200000 + Math.round(Math.random() * 300000),
      change24h: this.withNoise(0.012, 0.005),
      generatedAt: new Date().toISOString(),
    });
  }

  async getOrderBook(symbol: string, marketType: MarketType = MarketType.SPOT): Promise<Result<OrderBook>> {
    const normalized = symbol.toUpperCase();
    const midPrice = this.getBasePrice(normalized);

    return ok({
      id: `${this.name}-${normalized}-orderbook`,
      exchange: this.name,
      symbol: normalized,
      bids: [
        { price: midPrice * 0.999, quantity: 12.4 },
        { price: midPrice * 0.998, quantity: 8.1 },
      ],
      asks: [
        { price: midPrice * 1.001, quantity: 9.8 },
        { price: midPrice * 1.002, quantity: 7.2 },
      ],
      generatedAt: new Date().toISOString(),
    });
  }

  async getFees(symbol: string, marketType: MarketType = MarketType.SPOT): Promise<Result<Fee>> {
    const normalized = symbol.toUpperCase();
    return ok({
      id: `${this.name}-${normalized}-fees`,
      exchange: this.name,
      symbol: normalized,
      makerFee: 0.001,
      takerFee: 0.002,
      updatedAt: new Date().toISOString(),
    });
  }

  async getWallets(): Promise<Result<Wallet[]>> {
    return ok([
      {
        id: `${this.name}-wallet-1`,
        ownerId: 'mock-owner',
        currency: 'USD',
        balance: 50000,
        availableBalance: 50000,
        createdAt: new Date().toISOString(),
      },
    ]);
  }

  async placeOrder(
    symbol: string,
    side: TradeSide,
    quantity: number,
    price?: number,
    marketType: MarketType = MarketType.SPOT,
  ): Promise<Result<unknown>> {
    if (!symbol || quantity <= 0) {
      return err(new ProviderError('Invalid order parameters'));
    }

    if (marketType !== MarketType.SPOT) {
      return err(new ProviderError('Mock provider only supports spot orders'));
    }

    return ok({
      exchange: this.name,
      symbol: symbol.toUpperCase(),
      side,
      quantity,
      price: price ?? this.getBasePrice(symbol.toUpperCase()),
      createdAt: new Date().toISOString(),
    });
  }

  private getBasePrice(symbol: string): number {
    const map: Record<string, number> = {
      BTCUSDT: 65000,
      ETHUSDT: 3200,
      SOLUSDT: 150,
      XRPUSDT: 0.52,
    };

    return map[symbol] ?? 100;
  }

  private withNoise(base: number, magnitude: number): number {
    const noise = (Math.random() - 0.5) * magnitude * base;
    return Number((base + noise).toFixed(2));
  }
}
