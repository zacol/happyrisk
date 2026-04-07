---
trigger: glob
globs: apps/**
---

# Security & Authentication — Conventions & Patterns

## Architecture Overview

- **NestJS** is the single source of truth for authentication. It handles all OAuth flows, token generation, and session management.
- **Next.js** is a stateless client. It never manages database connections for auth and never verifies JWT signatures for security decisions.
- **Google OAuth** is the only supported login method. Users must be **pre-created by an Admin** before they can log in — the OAuth flow only links an existing `User` record matched by email. The system never auto-creates `User` records during login.

## Token Strategy

### Access Token (JWT)

- Short-lived: **15 minutes** (configured via `JWT_ACCESS_EXPIRES_IN`).
- Stored in an `HttpOnly` cookie (`access_token`) with `Secure`, `SameSite=Strict`.
- Used to authenticate standard API requests.
- The frontend must never read or decode the access token for security decisions.

### Refresh Token (Opaque)

- Long-lived: **7 days** (configured via `JWT_REFRESH_EXPIRES_IN`).
- Format: `<uuid>.<secret>` — the UUID part is the DB record ID, the secret part is hashed with bcrypt before storage.
- Stored in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie.
- **Never expose refresh tokens to JavaScript.** Never read or forward them from the client side.
- The hashed secret is stored in the `RefreshToken` table, never the raw token.

## Token Rotation

1. Access token expires → frontend calls `POST /api/auth/refresh` (cookie sent automatically).
2. NestJS reads the `refresh_token` cookie, parses the `<uuid>.<secret>` format, and looks up the record by UUID.
3. Compares the secret against the stored bcrypt hash.
4. Uses a **single-winner gate** via a conditional `updateMany` to atomically revoke the old token:

```typescript
const { count } = await tx.refreshToken.updateMany({
  where: { id: stored.id, revoked: false },
  data: { revoked: true },
});
if (count === 0) {
  // Race lost or reuse detected
}
```

5. If `count === 0` (token already revoked): **reuse attack detected** — revoke ALL tokens for that user immediately.
6. If successful: issue new access + refresh tokens, store the new hashed refresh token.

**Never** key refresh or logout flows off the `access_token` cookie. Parsing an unverified `access_token` to get a `userId` is insecure (allows forged `sub` attacks and fails when the cookie is expired).

## User Deactivation

- Deactivating a user (`isActive = false`) **must always** revoke all their refresh tokens in the same transaction:

```typescript
const [user] = await this.prisma.$transaction([
  this.prisma.user.update({ where: { id }, data: { isActive: false } }),
  this.prisma.refreshToken.deleteMany({ where: { userId: id } }),
]);
```

- Never set `isActive: false` through a generic `update()` path without going through the `deactivate()` method. Routing it differently would leave active refresh tokens orphaned.
- During token rotation, always check `user.isActive` inside the transaction before issuing new tokens.

## RBAC

- Guards are applied in order: `JwtAuthGuard` → `RolesGuard`.
- Use the `@Roles()` decorator at controller or handler level.
- The `JwtAuthGuard` sets `req.user` with `{ userId, email, role }` from the verified JWT payload.
- In Next.js middleware, the JWT may be decoded (without signature verification) **only for UX routing** (e.g., redirect non-admins). The backend always remains the authoritative security check.

## CORS

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL, // must come from env, never hardcoded
  credentials: true,
});
```

- `credentials: true` is required for `HttpOnly` cookie-based auth to work cross-origin.
- `FRONTEND_URL` must never have a hardcoded fallback in production.

## Cookie Configuration

Set all auth cookies with:

```typescript
{
  httpOnly: true,
  secure: isProduction,   // false in development, true in production
  sameSite: 'strict',
  path: '/',              // or '/api/auth/refresh' for the refresh token
  maxAge: <milliseconds>,
}
```

- Always clear cookies on logout and on failed refresh attempts.

## Hashing

- Use **bcrypt** with 10 rounds for hashing refresh token secrets.
- Never store plaintext tokens. Never log token values.

## Slack Bot Authentication

- Slack events are validated by the `@slack/bolt` SDK using `SLACK_SIGNING_SECRET`.
- `SLACK_BOT_TOKEN` (`xoxb-...`) is used to call Slack API methods.
- `SLACK_APP_TOKEN` (`xapp-...`) is used for Socket Mode WebSocket connection.
- Map Slack User IDs to internal `User.id` via `ProjectMembership.slack_user_id` to maintain the anonymity boundary.
- Never store Slack User IDs in the `SurveyResponse` table.
