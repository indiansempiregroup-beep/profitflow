# Security Guidelines

## Application Security

- Use HTTPS for all production traffic.
- Store secrets in environment variables or secret managers.
- Rotate credentials regularly.
- Keep dependencies up to date.
- Run static analysis and dependency scanning in CI.

## API Security

- Enforce rate limits and input validation.
- Protect authentication endpoints against brute force.
- Use secure session handling and refresh token rotation.
- Avoid trusting client-supplied state for authorization decisions.

## Mobile Security

- Do not embed secrets in the app bundle.
- Use secure storage for sensitive tokens where appropriate.
- Validate certificate pinning for high-risk integrations.
