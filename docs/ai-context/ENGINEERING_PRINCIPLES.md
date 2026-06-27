# Engineering Principles – ProfitFlow

Version: 1.0

Last Updated: June 2026

---

# Purpose

This document defines the engineering standards that every contributor and AI assistant must follow when working on ProfitFlow.

The goal is to maintain a clean, scalable, secure, and production-ready codebase.

Code quality is more important than development speed.

---

# Core Engineering Philosophy

We build software like a professional engineering team.

Every implementation must prioritize:

Correctness

Maintainability

Scalability

Security

Performance

Readability

Testability

---

# Architecture Principles

The project follows:

* Clean Architecture
* SOLID Principles
* Feature-Based Structure
* Domain-Driven Design (where appropriate)
* Dependency Injection
* Composition over Inheritance
* Modular Design

Every module should have a single responsibility.

Business logic must never depend on UI.

Exchange implementations must never affect scanner logic.

---

# Monorepo Structure

The project is organized as:

apps/

* mobile
* server

packages/

* shared
* ui
* config

docs/

* ai-context

Every new feature should fit into the existing structure.

Avoid creating unnecessary folders.

---

# TypeScript Standards

Enable strict mode.

Never use:

any

Use:

unknown

Generics

Utility Types

Discriminated Unions

Prefer readonly objects whenever possible.

Always define interfaces for public APIs.

---

# Code Style

Prefer small functions.

Target:

20–40 lines per function

Maximum:

60 lines

Large functions should be split.

Avoid nested conditions.

Prefer early returns.

Avoid duplicated logic.

---

# Naming Conventions

Classes

PascalCase

Interfaces

PascalCase

Enums

PascalCase

Files

kebab-case

Variables

camelCase

Constants

UPPER_SNAKE_CASE

Booleans should begin with:

is

has

can

should

Examples:

isConnected

hasBalance

canTrade

---

# Folder Structure

Each feature should contain:

models

services

repositories

types

validators

tests

Keep related files together.

---

# Error Handling

Never use console.log.

Never swallow exceptions.

Always use centralized logging.

Create custom domain errors.

Return meaningful error messages.

---

# Logging

Use Pino.

Log levels:

trace

debug

info

warn

error

fatal

Never log:

API keys

Secrets

Passwords

Sensitive data

---

# Dependency Injection

Avoid creating objects directly inside business logic.

Inject dependencies through constructors or a dependency container.

This makes testing easier.

---

# Database

Use Prisma only.

Never modify the production database manually.

Always create migrations.

Never commit generated database files that should be ignored.

---

# API Design

REST endpoints must:

Use versioning

/api/v1

Return consistent response structures.

Example:

{
"success": true,
"data": {},
"meta": {}
}

Errors should also follow a standard structure.

---

# Validation

Validate all external input.

Use Zod for runtime validation.

Never trust user input.

Never trust exchange responses.

---

# Security

Never expose secrets.

Never commit:

.env

API Keys

Private Keys

JWT Secrets

Encrypt sensitive data.

Use HTTPS in production.

Validate every request.

Apply rate limiting where appropriate.

---

# Exchange Integration Rules

Every exchange must implement the same interface.

Never hardcode exchange-specific logic into the scanner.

Each exchange provider should remain isolated.

Adding a new exchange should require minimal changes outside its own module.

---

# Performance

Avoid unnecessary database queries.

Avoid duplicate API requests.

Cache expensive operations.

Reuse WebSocket connections.

Minimize memory allocations in frequently executed code.

---

# Mobile Engineering

Business logic should remain outside UI components.

Screens should be thin.

Reusable components belong in shared packages when appropriate.

Animations should be smooth but purposeful.

Avoid unnecessary re-renders.

---

# Testing

Every business service should have unit tests.

Critical workflows should have integration tests.

Mock external APIs.

Never call real exchanges during automated tests.

---

# Git Workflow

Feature branches only.

Use Conventional Commits.

Examples:

feat(scanner): add market comparison engine

fix(exchange): handle websocket reconnect

refactor(core): simplify opportunity calculation

No direct commits to main.

---

# Code Reviews

Every pull request should verify:

Architecture

Performance

Security

Readability

Tests

Documentation

Breaking changes

---

# Documentation

Every completed sprint must update:

PROJECT_STATUS.md

SESSION_LOG.md

DECISIONS.md

BACKLOG.md

Known architecture changes.

Never allow documentation to become outdated.

---

# AI Development Rules

Before writing code:

Read all files in:

docs/ai-context/

Analyze the repository.

Understand existing architecture.

Do not regenerate existing files unnecessarily.

Do not introduce duplicate implementations.

Explain major architectural decisions.

After completing work:

Review generated code.

Update AI context documentation.

Provide testing instructions.

Provide Git commit message.

---

# Performance Targets

Application startup should be fast.

Market data updates should minimize latency.

Background jobs should not block API requests.

The architecture should support scaling to thousands of concurrent users.

---

# Definition of Done

A task is complete only if:

Implementation is finished.

Tests pass.

Documentation is updated.

Architecture remains clean.

No duplicate code exists.

Lint passes.

TypeScript passes.

The solution is production-ready.

---

# Guiding Principle

Every engineering decision should answer:

Is this maintainable?

Is this reusable?

Is this testable?

Is this secure?

Is this scalable?

If the answer is "No", redesign the solution before implementation.
