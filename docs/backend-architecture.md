# Backend Architecture

## Service Boundaries

- API service: HTTP interface and request handling
- Worker service: background jobs and scheduled tasks
- Real-time service: WebSocket gateway and streaming updates
- Shared domain modules: reusable business logic and contracts

## Design Principles

- Keep HTTP handlers thin and focused on transport concerns
- Move domain logic into typed service classes and modules
- Use dependency injection or explicit composition for testability
- Separate read and write concerns as the platform grows

## Infrastructure Direction

- Fastify for the API layer
- Prisma ORM for persistence
- Redis for queueing and cache
- BullMQ for background processing
- Socket.IO for live updates
