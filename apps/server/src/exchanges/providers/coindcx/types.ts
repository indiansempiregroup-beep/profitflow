export interface CoinDCXMarket {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  minQty: string;
  tickSize: string;
  isActive: boolean;
}

export interface CoinDCXTicker {
  symbol: string;
  lastPrice: string;
  volume: string;
  high: string;
  low: string;
  change: string;
  bid: string;
  ask: string;
}

export interface CoinDCXOrderBook {
  symbol: string;
  bids: Array<[string, string]>;
  asks: Array<[string, string]>;
}

export interface CoinDCXFee {
  symbol: string;
  makerFee: string;
  takerFee: string;
}

export interface CoinDCXExchangeInfo {
  name: string;
  markets: CoinDCXMarket[];
  serverTime: number;
}
