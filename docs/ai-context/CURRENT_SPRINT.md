# Current Sprint

Version: 1.3

Last Updated: 2026-06-27

---

Sprint: 8 — Scanner Engine

Status: Implemented

Priority: Critical

Estimated Duration: 1 Sprint

---

Sprint Progress:
- Implemented a provider-agnostic scanner engine that subscribes to market-data events emitted by the aggregator.
- Added comparison logic for identical trading pairs across healthy exchanges, including spread and spread-percentage calculation.
- Added normalized opportunity generation with buy/sell exchange, prices, spread, timestamps, and source-data timestamps.
- Added filtering for stale, unhealthy, incomplete, or unsupported market data.
- Added event publishing for opportunity creation, updates, and expiration.
- Added unit tests for scanner behavior without relying on live exchange APIs.

Remaining:
- Extend the scanner with fee-aware profitability analysis in a future sprint.
- Add richer opportunity persistence and notification flows in future sprints.

Out of Scope:
- Trading, order placement, withdrawals, deposits, and UI work remain out of scope.
- Authentication and portfolio flows remain out of scope.

---

# Acceptance Criteria

The sprint is complete only when:

* The scanner receives market-data events.
* Arbitrage opportunities are detected from healthy market data.
* Opportunity objects are generated in a normalized format.
* Scanner events are published.
* Tests pass.
* Documentation is updated.
* No TODO placeholders remain.

---

# Technical Requirements

Reuse the Exchange Framework from Sprint 4.

Do not duplicate infrastructure.

Do not bypass abstractions.

Keep CoinDCX-specific logic isolated.

Maintain provider independence.

All services should be injectable.

Follow ENGINEERING_PRINCIPLES.md.

Follow AI_RULES.md.

---

# Files Expected to Change

apps/server/src/scanner/

apps/server/src/exchanges/market-data/

packages/shared/

tests/

Documentation

---

# Testing Checklist

Verify scanner subscribes to market-data events.

Verify opportunities are detected across healthy exchanges.

Verify stale and unhealthy market data are ignored.

Verify opportunity events are emitted.

Run unit tests.

Run TypeScript checks.

---

# Documentation Updates Required

PROJECT_STATUS.md

SESSION_LOG.md

BACKLOG.md

DECISIONS.md

KNOWN_ISSUES.md

If architecture changes:

ARCHITECTURE.md

---

# Git Branch

feature/scanner-engine

---

# Suggested Commit Messages

feat(scanner): implement scanner engine

feat(scanner): publish opportunity events

refactor(market-data): support scanner-friendly state access

---

# Risks

Market data arriving out of order.

Provider health state changing during scans.

Duplicate opportunity emissions across consecutive scans.

Symbol normalization inconsistencies.

Stale market data being treated as fresh.

---

# Success Definition

By the end of Sprint 8:

ProfitFlow can ingest normalized market-data events, detect cross-exchange arbitrage opportunities, generate normalized opportunities, and publish scanner events without directly contacting exchange providers.

No trading functionality should exist yet.

This sprint lays the foundation for the Opportunity Engine in the next sprint.
