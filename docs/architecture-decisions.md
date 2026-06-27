# Architecture Decisions

## ADR-001: Monorepo for Mobile and Backend

Adopt a pnpm-based monorepo to share contracts, tooling, and design system resources across mobile and backend services.

## ADR-002: Expo React Native for Mobile

Use Expo Router and React Native Paper to accelerate delivery while keeping the app production-ready and maintainable.

## ADR-003: Fastify for Backend

Use Fastify because it offers strong performance, TypeScript support, and excellent extensibility for a fintech-grade API.

## ADR-004: PostgreSQL and Redis as Core Infrastructure

Use PostgreSQL for durable data and Redis for queues, caching, and transient state.

## ADR-005: Shared Contracts over Duplication

Keep shared types and schemas in packages/shared to prevent drift between client and server.
