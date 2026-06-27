export interface ExchangeMetric {
  name: string;
  value: number;
  tags?: Record<string, string>;
}

export class ExchangeTelemetry {
  private readonly metrics: ExchangeMetric[] = [];

  record(metric: ExchangeMetric): void {
    this.metrics.push(metric);
  }

  snapshot(): ExchangeMetric[] {
    return [...this.metrics];
  }
}
