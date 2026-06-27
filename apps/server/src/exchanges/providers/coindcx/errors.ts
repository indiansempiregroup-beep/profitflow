export class CoinDCXError extends Error {
  public readonly cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'CoinDCXError';
    this.cause = cause;
  }
}

export class CoinDCXApiError extends CoinDCXError {
  public readonly status?: number | string;

  constructor(message: string, cause?: unknown, status?: number | string) {
    super(message, cause);
    this.name = 'CoinDCXApiError';
    this.status = status;
  }
}
