export class SymbolMapper {
  private readonly aliasMap = new Map<string, string>();

  register(alias: string, canonical: string): void {
    this.aliasMap.set(alias.toLowerCase(), canonical.toUpperCase());
  }

  map(symbol: string): string {
    const normalized = symbol.trim().toUpperCase();
    return this.aliasMap.get(normalized.toLowerCase()) ?? normalized;
  }
}
