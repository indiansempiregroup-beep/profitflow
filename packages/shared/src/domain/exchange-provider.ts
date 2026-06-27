import type { ExchangeName, MarketType, TradeSide } from './enums';
import type { Fee, OrderBook, Ticker, Wallet } from './models';
import type { Result } from './result';

export interface ExchangeProvider {
  readonly name: ExchangeName;
  connect(): Promise<Result<void>>;
  disconnect(): Promise<Result<void>>;
  getTicker(symbol: string, marketType?: MarketType): Promise<Result<Ticker>>;
  getOrderBook(symbol: string, marketType?: MarketType): Promise<Result<OrderBook>>;
  getFees(symbol: string, marketType?: MarketType): Promise<Result<Fee>>;
  getWallets(): Promise<Result<Wallet[]>>;
  placeOrder(
    symbol: string,
    side: TradeSide,
    quantity: number,
    price?: number,
    marketType?: MarketType,
  ): Promise<Result<unknown>>;
}
