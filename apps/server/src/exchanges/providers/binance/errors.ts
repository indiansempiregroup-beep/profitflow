export class BinanceError extends Error {
  public readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'BinanceError';
    this.cause = cause;
  }
}

export class BinanceApiError extends BinanceError {
  public readonly status?: number | string;
  constructor(message: string, cause?: unknown, status?: number | string) {
    super(message, cause);
    this.name = 'BinanceApiError';
    this.status = status;
  }
}

export class BinanceWebSocketError extends BinanceError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'BinanceWebSocketError';
  }
}
