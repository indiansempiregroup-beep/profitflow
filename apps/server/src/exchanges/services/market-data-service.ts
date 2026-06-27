import { PriceNormalizer } from '../normalizers/price-normalizer.js';
import { SymbolMapper } from '../normalizers/symbol-mapper.js';
import { InMemoryCache } from '../cache.js';

export interface MarketDataService {
  getPrice(symbol: string): Promise<number>;
}

export class DefaultMarketDataService implements MarketDataService {
  constructor(
    private readonly priceNormalizer: PriceNormalizer,
    private readonly symbolMapper: SymbolMapper,
    private readonly cache: InMemoryCache = new InMemoryCache(),
  ) {}

  async getPrice(symbol: string): Promise<number> {
    const mapped = this.symbolMapper.map(symbol);
    const cacheKey = `price:${mapped}`;
    const cached = this.cache.get<number>(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const price = 100 + Math.round(Math.random() * 1000);
    const normalized = this.priceNormalizer.normalize(mapped, price);
    this.cache.set(cacheKey, normalized, 60000);
    return normalized;
  }
}
