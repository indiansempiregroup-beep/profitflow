# ProfitFlow

ProfitFlow is a premium mobile-first platform for discovering profitable cryptocurrency arbitrage opportunities across exchanges. The repository is structured as a production-grade monorepo for mobile, backend, shared packages, and internal tooling.

## Repository Structure

- apps/mobile — Expo React Native application
- apps/server — Fastify backend service
- packages/shared — shared domain types and utilities
- packages/ui — shared design system primitives
- packages/config — central configuration utilities
- docs — architecture and product documentation
- docker — containerization assets
- scripts — repository automation scripts
- .github/workflows — CI/CD automation

## Package Manager

This workspace uses pnpm workspaces.

## Scripts

- pnpm install
- pnpm dev
- pnpm build
- pnpm lint
- pnpm test
- pnpm format

## Environment

Copy .env.example to .env and adjust the values for your environment.

## Architecture Principles

- Separate frontend and backend concerns
- Use a monorepo for shared contracts and tooling
- Keep domain logic in typed shared packages
- Enforce secure defaults from day one
- Plan for scale without major rewrites
