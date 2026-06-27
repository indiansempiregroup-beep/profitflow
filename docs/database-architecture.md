# Database Architecture

## Core Assumptions

- PostgreSQL is the source of truth for durable application data.
- Redis is used for transient state, caching, and queues.
- Prisma manages schema evolution and typed database access.

## Planned Data Domains

- users
- exchange connections
- market snapshots
- arbitrage opportunities
- alerts
- notifications
- audit logs

## Design Principles

- Prefer explicit schemas and constrained relationships
- Use soft deletes or audit metadata for operational safety
- Keep writes idempotent where practical
- Plan for indexing and partitioning as data volume grows
