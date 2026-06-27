export interface ExchangeMetricsCollector {
  increment(name: string, tags?: Record<string, string>): void;
  gauge(name: string, value: number, tags?: Record<string, string>): void;
}

export class NoopExchangeMetrics implements ExchangeMetricsCollector {
  increment(): void {}
  gauge(): void {}
}
