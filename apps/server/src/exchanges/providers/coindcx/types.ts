export interface CoinDCXMarket {
  symbol: string;
  baseAsset?: string;
  quoteAsset?: string;
  base_currency_short_name?: string;
  target_currency_short_name?: string;
  minQty?: string;
  tickSize?: string;
  isActive?: boolean;
  status?: string;
}

export interface CoinDCXTicker {
  symbol?: string;
  market?: string;
  lastPrice?: string;
  last_price?: string;
  volume: string;
  high?: string;
  low?: string;
  change?: string;
  change_24_hour?: string;
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
