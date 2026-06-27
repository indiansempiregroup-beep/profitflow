# Architecture Overview

## System Goals

- Deliver a premium mobile experience for arbitrage discovery
- Keep the platform extensible for thousands of users
- Separate concerns between client, API, background workers, and shared contracts

## Monorepo Boundaries

- apps/mobile: Expo React Native application and presentation layer
- apps/server: Fastify API, auth, domain orchestration, and infrastructure glue
- packages/shared: typed domain contracts, enums, utilities, and validation schemas
- packages/ui: reusable React Native UI primitives and design tokens
- packages/config: environment and configuration helpers

## Runtime Architecture

1. Mobile app communicates with the API over HTTPS.
2. API handles authentication, orchestration, persistence, and event publishing.
3. Background workers process asynchronous jobs such as exchange polling and notification delivery.
4. Redis supports caching and job queues.
5. PostgreSQL stores durable application state.
6. WebSockets deliver live market and alert updates to clients.

## Security Model

- Enforce HTTPS and secure headers in the API.
- Use strong secrets and environment-based configuration.
- Validate input with schemas.
- Never expose secrets to the client.
- Prepare for rate limiting and audit logging.

## Observability

- Structured logs for requests and background jobs
- Request tracing identifiers
- Health checks for the API and worker service
- Metrics and alerting to be added in the next phase
