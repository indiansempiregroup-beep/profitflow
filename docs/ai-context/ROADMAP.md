# Roadmap

Last updated: 2026-06-27

## Completed Milestones
- Sprint 1 – Monorepo foundation and app scaffolding
- Sprint 2 – Backend foundation and infrastructure tooling
- Sprint 3 – Shared domain and mock exchange abstractions
- Sprint 4 – Provider-based exchange integration framework

## Current Position
The project is now positioned around reusable exchange infrastructure. The generic framework is implemented; the next logical work should focus on concrete provider implementations and service wiring rather than generic scaffolding.

## Recommended Next Focus Areas
The following are the most natural next directions, but they remain future work and are not implemented yet:
- Add one or more concrete exchange provider adapters.
- Wire the framework into concrete market-data and order-management services.
- Expand the shared domain model with richer business use cases.
- Add persistence and orchestration layers for recurring market analysis.

## Guidance for Future Sprints
Every new sprint should update this file and the related project status documents to reflect what has actually been implemented, not what is planned in theory.
