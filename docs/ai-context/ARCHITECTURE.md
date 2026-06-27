# Architecture

Last updated: 2026-06-27

## Repository Structure
ProfitFlow uses a pnpm workspace monorepo with three primary areas:

- apps/mobile: Expo React Native application.
- apps/server: Fastify backend service.
- packages/shared: shared domain contracts and exports.
- packages/ui: shared UI tokens and styling primitives.
- docs: project documentation and sprint notes.

## Runtime Architecture
### Mobile Application
The mobile app is an Expo React Native application with:
- TypeScript support
- Expo Router-based app entry points
- Basic app shell and constants
- Existing tests for core app utilities

### Server Application
The server is a Fastify-based backend with:
- Environment validation through Zod
- Structured logging
- Dependency injection container
- Prisma client setup
- Health and readiness routes
- Domain modules under the exchanges area for provider abstractions

## Backend Module Boundaries
The server source is organized into logical domains:

- api/: HTTP routes and plugins
- config/: environment and logging configuration
- core/: core application container and shared errors
- database/: Prisma client integration
- domain/: domain-level abstractions and mock provider
- exchanges/: provider framework, transport layers, normalizers, services, telemetry, and cache
- utils/, jobs/, notifications/, scanner/, websocket/, arbitrage/: reserved areas for future expansion

## Shared Domain Layer
The shared package exposes the business vocabulary used by the server and future clients:
- Enums for exchanges and market types
- Domain models for opportunities, wallets, order books, tickers, and fees
- Result and error helpers
- Base service abstractions
- Exchange provider contracts

## Exchange Framework Design
The exchange framework is intentionally provider-based and not tied to a specific exchange.

### Core abstractions
- BaseExchangeProvider: common lifecycle for all providers
- RestClient: generic HTTP transport layer with retries, timeouts, middleware, interceptors, and signing hooks
- WebSocketClient: generic connectivity layer with reconnect and heartbeat support
- ExchangeRegistry: registration and lookup for providers
- ExchangeFactory: provider creation
- ExchangeManager: runtime lifecycle coordination
- PriceNormalizer and SymbolMapper: market-data normalization
- MarketDataService and ConnectionHealthService: domain-level services
- Cache, Telemetry, and Metrics: operational support

### Market Data Aggregator
The server now includes a dedicated market-data aggregation layer under [apps/server/src/exchanges/market-data](apps/server/src/exchanges/market-data) that acts as the single entry point for provider updates.

- MarketDataAggregator: registers providers, starts or stops them, ingests ticker and order-book updates, and publishes normalized events.
- NormalizedMarketStore: maintains the latest in-memory state for exchange, symbol, and canonical symbol lookups.
- InternalEventBus: distributes internal events such as ticker updates, order-book changes, provider connection changes, and stale-provider warnings.
- ProviderHealthMonitor and StaleDataDetector: track health, failures, heartbeat timing, and stale data conditions so downstream services can respond safely.

### Scanner Engine
The server now includes an event-driven scanner layer under [apps/server/src/scanner](apps/server/src/scanner) that consumes market-data updates from the aggregator and produces normalized opportunity events.

- ScannerEngine: subscribes to market-data events, scans healthy exchange snapshots for cross-exchange arbitrage candidates, filters invalid data, and publishes scanner opportunity events.
- Opportunity objects remain normalized and fee-agnostic so later services can evaluate profitability or deliver notifications.

## Design Principles
- Favor provider abstraction over hardcoded integrations.
- Keep domain contracts shared and typed.
- Keep server modules separated by responsibility.
- Preserve testability for infrastructure components.
- Do not add exchange-specific business logic in the generic framework layer.
