export class ReconnectStrategy {
  constructor(
    private readonly baseDelayMs = 250,
    private readonly maxDelayMs = 30000,
    private readonly multiplier = 2,
  ) {}

  nextDelay(attempt: number): number {
    if (attempt <= 0) {
      return this.baseDelayMs;
    }

    return Math.min(this.maxDelayMs, this.baseDelayMs * this.multiplier ** attempt);
  }
}
