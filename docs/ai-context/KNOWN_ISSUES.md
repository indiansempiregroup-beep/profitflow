# Known Issues

Last updated: 2026-06-27

## Current Known Gaps
- No real exchange provider implementations are present yet.
- No concrete REST or WebSocket adapters for a live exchange are implemented.
- No trading execution or authentication workflows are implemented.
- The exchange framework uses in-memory caching and basic telemetry placeholders; production-grade persistence and observability integrations are not yet implemented.

## Notes related to Sprint 5
- Local test execution requires `pnpm` (Corepack recommended). On some systems enabling Corepack may require elevated permissions (sudo) to create symlinks for the `pnpm` binary. If `pnpm` is not available, use `npm install -g pnpm` or enable Corepack with appropriate permissions.

## Notes related to Sprint 6
- Full local Vitest verification is currently blocked by the server workspace dependency/toolchain state. The implementation itself is type-clean in editor diagnostics, but the environment still needs the workspace dependency mismatch resolved before the full test suite can run.

## Notes for Future Work
These are known limitations of the current implementation and should be taken into account before adding production integrations.
