import { BaseExchangeProvider } from './base-exchange-provider.js';
import { ExchangeRegistry } from './registry.js';

export class ExchangeFactory {
  constructor(private readonly registry: ExchangeRegistry) {}

  create(name: string): BaseExchangeProvider {
    const provider = this.registry.get(name);
    if (!provider) {
      throw new Error(`Unsupported exchange: ${name}`);
    }

    return provider;
  }
}
