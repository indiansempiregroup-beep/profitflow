# Notification Architecture

## Goals

- Notify users about new arbitrage opportunities and important account events
- Support push and in-app notification channels
- Keep delivery logic resilient and asynchronous

## Direction

- Use background jobs to enqueue notification work
- Support email, push, and in-app notifications through provider adapters
- Respect user preferences and quiet hours
- Track delivery state for auditing and retry decisions
