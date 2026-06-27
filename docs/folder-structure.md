# Folder Structure

## Root

- apps/: application entrypoints
- packages/: reusable libraries and shared foundations
- docs/: product and engineering documentation
- docker/: container definitions
- scripts/: automation and setup scripts
- .github/: CI/CD workflows and repository automation

## apps/mobile

- app/: Expo Router routes and screens
- assets/: static assets
- hooks/: reusable hooks
- services/: API and persistence integrations
- store/: Zustand state modules
- tests/: mobile tests

## apps/server

- src/: server source entrypoint and modules
- prisma/: database schema and migrations
- workers/: background jobs
- tests/: server tests

## packages/shared

- src/: shared types, schemas, and utilities

## packages/ui

- src/: reusable component primitives and design tokens

## packages/config

- src/: environment and configuration helpers
