# Coding Standards

Last updated: 2026-06-27

## General Principles
- Prefer clear, production-grade TypeScript over clever abstractions.
- Keep modules focused on a single responsibility.
- Favor explicit interfaces and small, composable services.
- Preserve testability by avoiding hidden runtime coupling.

## Repository Standards
- Use the existing pnpm/Turbo workspace structure.
- Keep app-specific code under apps/ and shared logic under packages/ or shared server modules.
- Prefer existing patterns over introducing new conventions.

## TypeScript Guidelines
- Use strict typing.
- Avoid any usage of implicit any.
- Prefer interfaces for contracts and classes for implementations.
- Keep imports explicit and path-based where the project already uses aliases.

## Testing Expectations
- Add or update tests whenever behavior changes.
- Prefer focused unit tests over broad integration tests for infrastructure modules.
- Test real behavior rather than implementation details.

## Documentation Expectations
- Update docs when behavior or architecture changes.
- Keep documentation factual and aligned with current implementation.
- Do not document planned features as if they already exist.

## Exchange Framework Rules
- Keep the framework provider-based and exchange-agnostic.
- Do not add Binance- or exchange-specific logic to generic abstractions.
- Keep new provider implementations isolated from the shared framework layer.
