export class StaleDataDetector {
  constructor(private readonly staleAfterMs: number) {}

  isStale(lastUpdateAt: string | undefined, now: Date): boolean {
    if (!lastUpdateAt) {
      return true;
    }

    const lastUpdate = new Date(lastUpdateAt).getTime();
    return now.getTime() - lastUpdate > this.staleAfterMs;
  }
}
