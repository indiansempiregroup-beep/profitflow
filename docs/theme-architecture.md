# Theme Architecture

## Goals

- Support light and dark themes in the future
- Keep theming centralized and predictable
- Allow shared tokens to flow into mobile and server-rendered surfaces

## Structure

- Base tokens: color, spacing, typography, radius, shadows
- Semantic tokens: surface, text, positive, warning, danger, accent
- Component tokens: button, card, input, chip, alert

## Implementation Direction

- Define tokens in the shared UI package
- Expose them through a typed theme provider in the mobile app
- Keep server-side presentation intentionally minimal and not theme-dependent
