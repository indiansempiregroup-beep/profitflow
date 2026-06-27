export interface ProviderHealthSnapshot {
  provider: string;
  status: 'healthy' | 'degraded' | 'stale' | 'down';
  lastHeartbeatAt?: string;
  lastMarketUpdateAt?: string;
  connectionStatus: boolean;
  consecutiveFailures: number;
  averageLatencyMs: number;
}

export class ProviderHealthMonitor {
  private readonly snapshots = new Map<string, ProviderHealthSnapshot>();

  recordConnected(provider: string, timestamp: string): void {
    this.snapshots.set(provider, {
      provider,
      status: 'healthy',
      lastHeartbeatAt: timestamp,
      lastMarketUpdateAt: timestamp,
      connectionStatus: true,
      consecutiveFailures: 0,
      averageLatencyMs: 0,
    });
  }

  recordDisconnected(provider: string, timestamp: string): void {
    const snapshot = this.snapshots.get(provider);
    if (!snapshot) {
      this.snapshots.set(provider, {
        provider,
        status: 'down',
        lastHeartbeatAt: timestamp,
        lastMarketUpdateAt: undefined,
        connectionStatus: false,
        consecutiveFailures: 1,
        averageLatencyMs: 0,
      });
      return;
    }

    snapshot.status = 'down';
    snapshot.connectionStatus = false;
    snapshot.lastHeartbeatAt = timestamp;
    snapshot.consecutiveFailures += 1;
  }

  recordMarketUpdate(provider: string, timestamp: string, latencyMs: number): void {
    const snapshot = this.snapshots.get(provider) ?? {
      provider,
      status: 'healthy',
      connectionStatus: true,
      consecutiveFailures: 0,
      averageLatencyMs: 0,
    };

    snapshot.lastMarketUpdateAt = timestamp;
    snapshot.lastHeartbeatAt = timestamp;
    snapshot.connectionStatus = true;
    snapshot.consecutiveFailures = 0;
    snapshot.averageLatencyMs = snapshot.averageLatencyMs === 0 ? latencyMs : Math.round((snapshot.averageLatencyMs + latencyMs) / 2);
    snapshot.status = 'healthy';
    this.snapshots.set(provider, snapshot);
  }

  recordFailure(provider: string, timestamp: string): void {
    const snapshot = this.snapshots.get(provider) ?? {
      provider,
      status: 'degraded',
      connectionStatus: false,
      consecutiveFailures: 0,
      averageLatencyMs: 0,
    };

    snapshot.consecutiveFailures += 1;
    snapshot.lastHeartbeatAt = timestamp;
    snapshot.status = snapshot.consecutiveFailures > 1 ? 'stale' : 'degraded';
    this.snapshots.set(provider, snapshot);
  }

  get(provider: string): ProviderHealthSnapshot {
    return this.snapshots.get(provider) ?? {
      provider,
      status: 'down',
      connectionStatus: false,
      consecutiveFailures: 0,
      averageLatencyMs: 0,
    };
  }
}
