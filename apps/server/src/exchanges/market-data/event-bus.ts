export type AggregatorEventType =
  | 'ticker.updated'
  | 'orderbook.updated'
  | 'provider.connected'
  | 'provider.disconnected'
  | 'provider.error'
  | 'provider.stale'
  | 'scanner.opportunity.created'
  | 'scanner.opportunity.updated'
  | 'scanner.opportunity.expired'
  | 'scanner.opportunity.validated'
  | 'scanner.opportunity.validation.expired'
  | 'scanner.opportunity.ranked';

export interface AggregatorEvent<TPayload = unknown> {
  type: AggregatorEventType;
  provider: string;
  symbol: string;
  canonicalSymbol: string;
  timestamp: string;
  payload: TPayload;
}

export type AggregatorEventListener<TPayload = unknown> = (event: AggregatorEvent<TPayload>) => void;

export class InternalEventBus {
  private readonly listeners = new Map<AggregatorEventType, Set<AggregatorEventListener>>();

  subscribe<TPayload = unknown>(type: AggregatorEventType, listener: AggregatorEventListener<TPayload>): () => void {
    let bucket = this.listeners.get(type);
    if (!bucket) {
      bucket = new Set();
      this.listeners.set(type, bucket);
    }

    bucket.add(listener as AggregatorEventListener);

    return () => {
      bucket?.delete(listener as AggregatorEventListener);
    };
  }

  publish<TPayload = unknown>(event: AggregatorEvent<TPayload>): void {
    const bucket = this.listeners.get(event.type);
    if (!bucket) {
      return;
    }

    for (const listener of Array.from(bucket)) {
      listener(event);
    }
  }
}
