# ProfitFlow domain architecture

## Goals
- Define a domain-first abstraction for exchange connectivity without any real exchange integrations.
- Keep the shared contracts stable enough for future services and adapters.
- Use a mock provider to simulate realistic market data for local development and tests.

## Core concepts
- ExchangeName, MarketType, and TradeSide enumerate the shared business vocabulary.
- Opportunity, Wallet, OrderBook, Ticker, and Fee model the primary domain entities.
- Result<T> and the domain errors provide a consistent error-handling contract.
- ExchangeProvider defines the behavior every provider must satisfy.
- MockExchangeProvider is a deterministic, local-only implementation for development and testing.

## Scope boundaries
- No real exchange API integrations are included.
- No trading execution or authentication flows are implemented.
- No REST endpoints or UI screens are added in this sprint.
