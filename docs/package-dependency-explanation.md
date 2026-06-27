# Package Dependency Explanation

## Monorepo Packages

- apps/mobile depends on packages/ui, packages/shared, and packages/config.
- apps/server depends on packages/shared and packages/config.
- packages/ui depends only on React Native primitives and design tokens.
- packages/shared contains platform-neutral types and utilities.
- packages/config holds environment and app-wide configuration helpers.

## Why This Structure Works

- Shared contracts stay in one place and avoid drift between client and server.
- UI primitives are reusable across the mobile app and future surfaces.
- Configuration is centralized to keep production behavior consistent and reviewable.
- Each package can evolve independently while remaining strongly typed.
