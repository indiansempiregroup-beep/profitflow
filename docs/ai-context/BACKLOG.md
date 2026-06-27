# Backlog

Last updated: 2026-06-27

## Completed
- Create monorepo foundation and workspace tooling
- Create mobile app scaffold
- Create server scaffold and backend infrastructure
- Create shared domain contracts and mock exchange provider
- Create exchange framework abstractions and tests
- Create project documentation and sprint documentation

## Pending / Next Priority
- Add a concrete exchange provider implementation
- Add real provider transport adapters for REST and WebSocket
- Expand the domain layer into service-oriented business workflows
- Add persistence and orchestration around exchange data collection
- Add user-facing features only after the provider and domain foundation is stable

## Constraints
- Do not implement Binance-specific logic in the generic framework layer.
- Do not add trading or authentication flows unless explicitly requested as a later sprint.
- Keep all new work aligned with the existing provider-based architecture.
