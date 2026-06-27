export class BinanceSymbolMapper {
  private readonly binanceToCanonical = new Map<string, string>();
  private readonly canonicalToBinance = new Map<string, string>();

  /**
   * Register a mapping from Binance symbol format to canonical format
   * Example: BTCUSDT -> BTC/USDT
   */
  register(binanceSymbol: string, canonicalSymbol: string): void {
    const normalizedBinance = binanceSymbol.trim().toUpperCase();
    const normalizedCanonical = canonicalSymbol.trim().toUpperCase();

    this.binanceToCanonical.set(normalizedBinance, normalizedCanonical);
    this.canonicalToBinance.set(normalizedCanonical, normalizedBinance);
  }

  /**
   * Convert Binance symbol format to canonical format
   */
  fromBinance(symbol: string): string {
    const normalized = symbol.trim().toUpperCase();
    return this.binanceToCanonical.get(normalized) ?? normalized;
  }

  /**
   * Convert canonical symbol format to Binance format
   */
  toBinance(symbol: string): string {
    const normalized = symbol.trim().toUpperCase();
    return this.canonicalToBinance.get(normalized) ?? normalized;
  }

  /**
   * Extract base and quote from Binance symbol
   * Example: BTCUSDT -> { base: 'BTC', quote: 'USDT' }
   */
  extractPair(symbol: string): { base: string; quote: string } | null {
    const normalized = symbol.trim().toUpperCase();

    // Common quote currencies (longest first for proper extraction)
    const quotes = ['USDT', 'BUSD', 'USDC', 'TUSD', 'USDP', 'USD', 'EUR', 'GBP', 'BNB', 'BTC', 'ETH'];

    for (const quote of quotes) {
      if (normalized.endsWith(quote)) {
        const base = normalized.slice(0, -quote.length);
        if (base.length > 0) {
          return { base, quote };
        }
      }
    }

    return null;
  }
}
