# Known Issues

Last updated: 2026-06-29

## Resolved in MVP Completion Sprint

- CoinDCX REST client tests updated to match current API paths
- Exchange credentials are encrypted at rest
- API keys are validated against exchange account endpoints before saving
- Paper trading, notifications, and portfolio balances are implemented
- Mobile screens for auth recovery and email verification are wired to backend APIs

## Current Notes

- Email verification and password reset tokens are logged server-side in development instead of being sent through an email provider
- Push notifications register device tokens; remote Expo push delivery requires configuring Expo push credentials for production
- Portfolio balance fetching requires valid read-enabled API keys on each connected exchange
- Dashboard opportunity filtering applies only when the user has saved exchange connections

## Environment

- Set `CREDENTIALS_ENCRYPTION_KEY` to at least 32 characters in production
- Run database migrations after pulling MVP completion changes
