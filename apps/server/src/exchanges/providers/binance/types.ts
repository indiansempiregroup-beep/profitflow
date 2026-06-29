export interface BinanceSymbol {
  symbol: string;
  status: string;
  baseAsset: string;
  quoteAsset: string;
  baseAssetPrecision: number;
  quotePrecision: number;
  orderTypes: string[];
  icebergAllowed: boolean;
  filters: BinanceFilter[];
  permissions: string[];
  defaultAccountPermissions: string[];
}

export interface BinanceFilter {
  filterType: string;
  [key: string]: unknown;
}

export interface BinanceExchangeInfo {
  timezone: string;
  serverTime: number;
  symbols: BinanceSymbol[];
}

export interface BinanceTicker {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  prevClosePrice: string;
  lastPrice: string;
  lastQty: string;
  bidPrice: string;
  bidQty: string;
  askPrice: string;
  askQty: string;
  openPrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteAssetVolume: string;
  openTime: number;
  closeTime: number;
  firstId: number;
  lastId: number;
  count: number;
}

export interface BinanceOrderBook {
  bids: Array<[string, string]>;
  asks: Array<[string, string]>;
  lastUpdateId: number;
}

export interface BinanceTradeFee {
  symbol: string;
  makerCommission: string;
  takerCommission: string;
}

export interface BinanceAccountTradeList {
  tradeFees: BinanceTradeFee[];
  makerCommission: number;
  takerCommission: number;
  buyerCommission: number;
  sellerCommission: number;
}

export interface BinanceKlineData {
  [0]: number; // openTime
  [1]: string; // open
  [2]: string; // high
  [3]: string; // low
  [4]: string; // close
  [5]: string; // volume
  [6]: number; // closeTime
  [7]: string; // quoteAssetVolume
  [8]: number; // numberOfTrades
  [9]: string; // takerBuyBaseAssetVolume
  [10]: string; // takerBuyQuoteAssetVolume
  [11]: string; // ignore
}

export interface BinanceWebSocketMessage {
  e: string; // event type
  E: number; // event time
  s?: string; // symbol
  [key: string]: unknown;
}

export interface BinanceWebSocketTickerData extends BinanceWebSocketMessage {
  e: '24hrTicker';
  s: string;
  c: string; // close price
  v: string; // total traded base asset volume
  h: string; // high price
  l: string; // low price
  p: string; // price change
  P: string; // price change percent
}

export interface BinanceWebSocketDepthData extends BinanceWebSocketMessage {
  e: 'depthUpdate';
  s: string;
  U: number; // first update id
  u: number; // final update id
  b: Array<[string, string]>; // bids
  a: Array<[string, string]>; // asks
}
