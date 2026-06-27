import type { ExchangeName, MarketType, TradeSide } from './enums';

export interface Opportunity {
  id: string;
  symbol: string;
  marketType: MarketType;
  buyExchange: ExchangeName;
  sellExchange: ExchangeName;
  buyPrice: number;
  sellPrice: number;
  spread: number;
  spreadPercentage: number;
  estimatedProfit: number;
  detectedAt: string;
  sourceDataTimestamp: string;
}

export interface Wallet {
  id: string;
  ownerId: string;
  currency: string;
  balance: number;
  availableBalance: number;
  createdAt: string;
}

export interface OrderBook {
  id: string;
  exchange: ExchangeName;
  symbol: string;
  bids: Array<{ price: number; quantity: number }>;
  asks: Array<{ price: number; quantity: number }>;
  generatedAt: string;
}

export interface Ticker {
  id: string;
  exchange: ExchangeName;
  symbol: string;
  price: number;
  volume24h: number;
  change24h: number;
  generatedAt: string;
}

export interface Fee {
  id: string;
  exchange: ExchangeName;
  symbol: string;
  makerFee: number;
  takerFee: number;
  updatedAt: string;
}

export interface NetworkFeeEstimate {
  asset: string;
  amount: number;
  currency: string;
}

export interface FeeAnalysis {
  buyFee: number;
  sellFee: number;
  totalTradingFees: number;
  networkFee: NetworkFeeEstimate;
  totalFees: number;
}

export interface LiquidityScore {
  score: number;
  details: string;
}

export interface SlippageEstimate {
  amount: number;
  percentage: number;
  details: string;
}

export interface ValidatedOpportunity extends Opportunity {
  feeAnalysis: FeeAnalysis;
  liquidityScore: LiquidityScore;
  slippageEstimate: SlippageEstimate;
  confidence: number;
  validatedAt: string;
}
