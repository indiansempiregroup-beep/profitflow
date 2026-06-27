# Decisions

Last updated: 2026-06-27

## 1. Monorepo-first architecture
The project uses a pnpm workspace monorepo to keep mobile, server, shared, and UI concerns in one repository while preserving clear boundaries.

## 2. TypeScript as the default language
TypeScript is used across the monorepo for improved maintainability, editor support, and shared typing across packages.

## 3. Provider-based exchange framework
The exchange integration layer is designed to be pluggable. No real exchange logic is embedded into the base framework. New providers should extend the shared abstractions rather than modify generic infrastructure.

## 4. Shared domain contracts over ad hoc typing
The shared package owns the core business vocabulary and contracts so the backend and future clients can depend on the same domain model.

## 5. Fastify for the backend runtime
Fastify was chosen for the server runtime because the project already uses a lightweight, extensible Node.js service foundation with the necessary plugin and lifecycle support.

## 6. Expo for mobile delivery
Expo was selected for the mobile app scaffold to accelerate setup while keeping a production-oriented React Native foundation.

## 7. Testing is part of the foundation
Vitest is used for package and server tests, and the repository includes tests for the shared domain, server configuration, health route, and exchange framework abstractions.

## 8. Documentation is treated as part of the codebase
The docs directory is intended to be a persistent memory layer for future AI assistants and human contributors. It should remain current after each sprint.

## 9. Binance Integration Decisions

- Binance provider must never expose raw Binance JSON outside the provider boundary; all responses are normalized into shared domain models (`Ticker`, `OrderBook`, `Fee`).
- WebSocket connectivity should be non-blocking for application startup: failure to establish WS must not prevent provider readiness for REST-based queries.
- All provider-level API errors must be mapped to domain `ProviderError` to avoid leaking exchange-specific error shapes to business services.

## 10. CoinDCX Integration Decisions

- CoinDCX should follow the same provider-based lifecycle and normalization pattern used by Binance rather than introducing a separate integration model.
- Public market-data endpoints should remain isolated behind the CoinDCX provider boundary and be normalized into shared domain models before they are exposed.
- WebSocket support will be added using the shared framework abstractions so reconnect and heartbeat behavior remain consistent across providers.

## 11. Market Data Aggregator Decisions

- All exchange providers publish market-data updates into a single aggregator service rather than allowing downstream services to talk to providers directly.
- The aggregator exposes normalized ticker and order-book events to downstream consumers and keeps a normalized in-memory store as the source of truth for market data.
- Provider health and stale-data detection should be first-class concerns so the scanner and opportunity engine can avoid acting on stale or degraded data.

## 12. Scanner Engine Decisions

- The scanner should remain completely event-driven and subscribe to aggregator market-data events rather than polling providers directly.
- The scanner should operate on normalized market-data snapshots and ignore incomplete, stale, or unhealthy provider state.
- Opportunity generation should remain a pure analysis concern without fee calculation, trading execution, or notifications.
