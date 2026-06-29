**Authentication API**

Endpoints implemented for mobile integration (email/password + JWT):

- POST /api/auth/register
  - Body: { "email": "user@example.com", "password": "secret" }
  - Response: { success: true, token: "<jwt>", user: { id, email } }

- POST /api/auth/login
  - Body: { "email": "user@example.com", "password": "secret" }
  - Response: { success: true, token: "<jwt>", user: { id, email } }

Notes:

- Tokens are signed using `JWT_SECRET` from `apps/server/.env` or environment. For local development a default `dev-secret-change-me` is used.
- Passwords are hashed using `bcryptjs` and stored in `User.passwordHash` column.
- The backend issues an access token valid for 7 days.

Next steps for mobile integration:

- Implement secure token storage (SecureStore / Keychain) and attach `Authorization: Bearer <token>` header to API calls.
- Implement token refresh or re-login flow when 401 is received.
