const DEFAULT_QUOTE = 'USDT';

export const normalizeMarketQuoteSymbol = (symbol: string): string => {
  const trimmed = symbol.trim().toUpperCase();
  if (!trimmed) {
    return trimmed;
  }

  if (trimmed.includes('/')) {
    return trimmed;
  }

  if (/^[A-Z]{2,5}[A-Z0-9]+$/.test(trimmed)) {
    if (trimmed.length <= 5) {
      return `${trimmed}/${DEFAULT_QUOTE}`;
    }
    return trimmed;
  }

  if (/^[A-Z0-9]+$/.test(trimmed)) {
    return `${trimmed}/${DEFAULT_QUOTE}`;
  }

  return trimmed;
};
