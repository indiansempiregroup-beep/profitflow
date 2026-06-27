export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class InMemoryCache {
  private readonly entries = new Map<string, CacheEntry<unknown>>();

  set<T>(key: string, value: T, ttlMs = 60000): void {
    this.entries.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
  }

  get<T>(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) {
      return undefined;
    }

    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  delete(key: string): void {
    this.entries.delete(key);
  }

  clear(): void {
    this.entries.clear();
  }
}
