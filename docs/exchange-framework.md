# Exchange integration framework

## Overview
The exchange integration framework is provider-based and intentionally avoids any hardcoded exchange business logic. Every exchange implementation should plug into the common lifecycle, transport, normalization, caching, telemetry, and health abstractions.

## Core components
- BaseExchangeProvider: common provider lifecycle and state handling.
- RestClient: request abstraction with retries, backoff, rate limiting, timeout handling, middleware, interceptors, and request signing hooks.
- WebSocketClient: connection, heartbeat, reconnection, and subscription abstraction.
- ExchangeRegistry: provider registration and discovery.
- ExchangeFactory: provider instantiation.
- ExchangeManager: runtime lifecycle coordination.
- PriceNormalizer and SymbolMapper: market data normalization.
- FeeCalculator and LiquidityCalculator: pluggable market math services.
- MarketDataService and ConnectionHealthService: domain-level data and health operations.
- InMemoryCache, ExchangeTelemetry, and ExchangeMetrics: observability support.

## Extension guidance
1. Implement a new provider by extending BaseExchangeProvider.
2. Provide transport clients that implement the shared abstractions.
3. Register providers in the registry so they can be created by the factory.
4. Use the provided services for normalization, caching, and monitoring.

## Non-goals
- No Binance-specific implementation.
- No exchange business logic beyond generic infrastructure.
- No HTTP or WebSocket runtime integration for a real provider in this sprint.
