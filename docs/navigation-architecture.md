# Navigation Architecture

## Mobile Navigation

- Use Expo Router as the navigation foundation.
- Organize screens by domain and user flow.
- Keep shared layout and route groups explicit.
- Favor typed routes and centralized deep-link handling.

## Navigation Principles

- Separate onboarding, auth, main app, and settings surfaces.
- Keep navigation state predictable and reusable.
- Prepare for tab-based and modal-based transitions.
- Use route parameters for user-scoped navigation rather than global state.
