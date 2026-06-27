import { BaseExchangeProvider } from './base-exchange-provider.js';
import { ExchangeFactory } from './factory.js';

export class ExchangeManager {
  private readonly providers = new Map<string, BaseExchangeProvider>();

  constructor(private readonly factory: ExchangeFactory) {}

  async connect(name: string): Promise<void> {
    const provider = this.getOrCreate(name);
    await provider.connect();
    this.providers.set(provider.name.toLowerCase(), provider);
  }

  async disconnect(name: string): Promise<void> {
    const provider = this.providers.get(name.toLowerCase());
    if (provider) {
      await provider.disconnect();
      this.providers.delete(name.toLowerCase());
    }
  }

  get(name: string): BaseExchangeProvider | undefined {
    return this.providers.get(name.toLowerCase());
  }

  list(): BaseExchangeProvider[] {
    return Array.from(this.providers.values());
  }

  private getOrCreate(name: string): BaseExchangeProvider {
    const existing = this.providers.get(name.toLowerCase());
    if (existing) {
      return existing;
    }

    return this.factory.create(name);
  }
}
