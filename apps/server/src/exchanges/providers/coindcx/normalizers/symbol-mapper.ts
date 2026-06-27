export class CoinDCXSymbolMapper {
  private readonly coinDcXToCanonical = new Map<string, string>();
  private readonly canonicalToCoinDCX = new Map<string, string>();

  register(coinDcXSymbol: string, canonicalSymbol: string): void {
    const normalizedCoinDCX = coinDcXSymbol.trim().toUpperCase();
    const normalizedCanonical = canonicalSymbol.trim().toUpperCase();

    this.coinDcXToCanonical.set(normalizedCoinDCX, normalizedCanonical);
    this.canonicalToCoinDCX.set(normalizedCanonical, normalizedCoinDCX);
  }

  fromCoinDCX(symbol: string): string {
    const normalized = symbol.trim().toUpperCase();
    return this.coinDcXToCanonical.get(normalized) ?? normalized;
  }

  toCoinDCX(symbol: string): string {
    const normalized = symbol.trim().toUpperCase();
    return this.canonicalToCoinDCX.get(normalized) ?? normalized;
  }
}
