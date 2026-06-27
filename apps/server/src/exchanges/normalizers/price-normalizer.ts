export class PriceNormalizer {
  normalize(symbol: string, price: number): number {
    if (!Number.isFinite(price)) {
      throw new Error('Price must be a finite number');
    }

    return Number(price.toFixed(8));
  }

  normalizeSymbol(symbol: string): string {
    return symbol.trim().toUpperCase();
  }
}
