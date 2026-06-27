# Error Handling Strategy

## Principles

- Fail fast with clear error semantics.
- Avoid leaking implementation details to clients.
- Normalize errors to domain-specific codes.
- Preserve request context for debugging.

## Backend Strategy

- Validate inputs before business logic.
- Wrap domain failures in typed error classes.
- Log unexpected failures with request IDs.
- Return sanitized error responses to clients.

## Mobile Strategy

- Show clear, human-friendly feedback to users.
- Translate API errors into actionable UI states.
- Avoid silent failures.

## Logging Rules

- Log at appropriate levels: debug, info, warn, error.
- Never log secrets or private keys.
- Include correlation IDs for request tracing.
