# Coding Standards

## General Principles

- Write clear, explicit, and testable code.
- Prefer composition over inheritance.
- Keep modules focused on a single responsibility.
- Avoid premature abstraction.
- Use TypeScript everywhere.

## Naming Conventions

- Files: kebab-case for general files, PascalCase for React components
- Functions: camelCase
- Types and interfaces: PascalCase
- Constants: UPPER_SNAKE_CASE
- Environment variables: UPPER_SNAKE_CASE

## Formatting

- 2-space indentation
- Semicolons required
- Single quotes for JavaScript and TypeScript code
- Prettier for formatting
- ESLint for linting

## Testing Expectations

- Unit tests for utilities and domain logic
- Component tests for reusable UI primitives
- Integration tests for API contracts
- No production logic without tests
