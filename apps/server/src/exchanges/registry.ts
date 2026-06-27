import { BaseExchangeProvider } from './base-exchange-provider.js';

export class ExchangeRegistry {
  private readonly providers = new Map<string, BaseExchangeProvider>();

  register(provider: BaseExchangeProvider): void {
    this.providers.set(provider.name.toLowerCase(), provider);
  }

  get(name: string): BaseExchangeProvider | undefined {
    return this.providers.get(name.toLowerCase());
  }

  list(): BaseExchangeProvider[] {
    return Array.from(this.providers.values());
  }
}
