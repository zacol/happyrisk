# Authentication & Communication Specification

This document defines the centralized, API-first authentication mechanisms, security layers, and communication protocols between the clients (e.g., Next.js Dashboard), the NestJS Backend (`apps/api`), and the Slack platform.

---

## 1. Overview of Architecture (API-First Auth)

*   **Backend (NestJS):** The single source of truth for user authentication, authorization, and session management. It handles all OAuth flows, account linking, and JWT generation.
*   **Frontend (Next.js Dashboard):** Acts as a stateless client. It does not manage its own authentication database connections. It stores the JWT provided by the backend and attaches it to subsequent API requests.
*   **Database:** PostgreSQL accessed via Prisma ORM by the NestJS backend. Contains the `User` and `OAuthAccount` tables.

---

## 2. Centralized Authentication Flow (NestJS)

Authentication is completely handled by the NestJS backend using `@nestjs/passport` and `passport-google-oauth20`.

*   **Strategy:** JWT (JSON Web Tokens).
*   **Flow:**
    1.  **Initiation:** The user clicks "Login with Google" on the Next.js frontend, which redirects the browser to the NestJS endpoint (e.g., `GET /api/auth/google`).
    2.  **OAuth Handshake:** NestJS redirects the user to Google's consent screen. After consent, Google redirects back to the NestJS callback endpoint (e.g., `GET /api/auth/google/callback`).
    3.  **Account Linking (US 5.1, US 5.6):** NestJS receives the Google profile. It checks the database via Prisma:
        *   Does an `OAuthAccount` exist for this Google ID?
        *   If not, does a `User` exist with the matching email (e.g., manually created by an Admin)?
        *   If yes, link the new `OAuthAccount` to the existing `User`. If no, create both a new `User` and `OAuthAccount`.
    4.  **Status Check (US 5.4):** NestJS verifies if the `User.is_active` status is `true`. If `false` (deactivated), it redirects the user to the frontend with an error query parameter (e.g., `?error=AccountDeactivated`), effectively blocking the login.
    5.  **JWT Generation:** NestJS generates a JWT containing the user's ID, role, and email.
    6.  **Token Delivery:** NestJS redirects the user back to the Next.js frontend, passing the JWT (e.g., via a secure, short-lived callback route in Next.js which then sets it as an `HttpOnly` cookie, or directly setting the cookie from NestJS if domains allow).

---

## 3. Token Strategy & Rotation

To maintain high security (especially against XSS and CSRF) while providing a good user experience, the system implements a **Short-lived Access Token** and **Long-lived Refresh Token** pattern with **Refresh Token Rotation**.

### Token Lifespans and Storage
1.  **Access Token (JWT):**
    *   **Lifespan:** Short (e.g., 15 minutes).
    *   **Storage:** Returned to the frontend and stored in memory, or sent via a secure `HttpOnly` cookie. Used to authenticate standard API requests.
2.  **Refresh Token (Opaque String):**
    *   **Lifespan:** Long (e.g., 7 days).
    *   **Storage:** Handled strictly via an `HttpOnly`, `Secure`, `SameSite=Strict` cookie bound to the `/api/auth/refresh` endpoint. It is never exposed to frontend JavaScript.
    *   **Database:** A hashed version of the refresh token is stored in the `RefreshToken` table linked to the user's device/session.

### Rotation Flow
1.  When the frontend detects the Access Token has expired (e.g., catching a `401 Unauthorized`), it silently calls `POST /api/auth/refresh`.
2.  NestJS reads the `HttpOnly` refresh token cookie and checks it against the database.
3.  If valid, NestJS **revokes** the used refresh token, generates a new Access Token and a **new Refresh Token**, updates the database, and sets the new cookies.
4.  If a user is deactivated by an Admin (`is_active = false`), their refresh tokens are deleted from the database. This guarantees their access is revoked within the lifespan of the Access Token (max 15 mins).

---

## 4. Client to API Communication (Next.js ↔ NestJS)

The Next.js frontend must securely fetch data from the NestJS REST API using the token provided during login.

### Authentication Strategy: JWT Validation

1.  **Request from Next.js to NestJS:**
    *   **Client-side (TanStack Query) / Server-side:** Requests to the NestJS API must include the JWT. This is typically done by sending it in the `Authorization: Bearer <token>` header, or by relying on `HttpOnly` cookies automatically sent by the browser.
2.  **NestJS `JwtAuthGuard` (`apps/api/src/modules/auth/guards/jwt.guard.ts`):**
    *   Extracts the JWT from the request (header or cookies).
    *   Verifies the token's signature using the backend's `JWT_SECRET`.
    *   Decodes the payload to get the `userId` and `role`.
    *   Attaches the user data to the NestJS `Request` context (e.g., `req.user`).
    *   Returns `401 Unauthorized` if the token is missing, invalid, or expired.

### CORS Configuration

The NestJS application must be configured to accept cross-origin requests from the Next.js domain.

```typescript
// apps/api/src/main.ts
app.enableCors({
  origin: process.env.FRONTEND_URL, // e.g., http://localhost:3000
  credentials: true, // Necessary if using cookies for JWT transmission
});
```

---

## 5. Slack Bot Authentication (Slack ↔ NestJS)

The NestJS backend acts as the Slack Bot server.

*   **Library:** `@slack/bolt` integrated into NestJS.
*   **Mode:** Socket Mode is recommended for development and internal tools, as it doesn't require exposing a public HTTP endpoint.
*   **Required Tokens:**
    *   `SLACK_BOT_TOKEN` (`xoxb-...`): Used to call Slack API methods.
    *   `SLACK_APP_TOKEN` (`xapp-...`): Used to establish the Socket Mode WebSocket connection.
*   **User Mapping:** When interacting with users on Slack, the bot receives a Slack User ID. This must be mapped to the internal `User.id` via the `ProjectMembership.slack_user_id` field to maintain the anonymity boundary and track survey participation.

---

## 6. Role-Based Access Control (RBAC)

Authorization is based on the `UserRole` and `ProjectRole` enums defined in the database schema.

### In NestJS (API Endpoints)
*   Create a `@Roles()` decorator.
*   Create a `RolesGuard` that runs after the `JwtAuthGuard`.
*   The guard checks if `req.user.role` (extracted from the JWT) matches the roles required by the decorator.
*   *Example:* Only users with `UserRole.ADMIN` can access global organization settings endpoints.

### In Next.js (Dashboard)
*   **Middleware:** Next.js `middleware.ts` decodes the JWT (without necessarily verifying the signature, as it's just for UX routing) to check the user's role and protect routes (e.g., redirect non-admins away from `/admin`).
*   **UI Level:** Use the decoded JWT payload to conditionally render elements (e.g., hide the "Admin Panel" button for standard users). The backend always remains the ultimate source of security.

---

## 7. Implementation Steps Summary

To implement this API-First specification:

1.  **Setup Passport in NestJS:** Install `@nestjs/passport`, `passport-google-oauth20`, and `@nestjs/jwt`.
2.  **Create Auth Module (`apps/api`):** 
    *   Implement `GoogleStrategy` for OAuth handshake.
    *   Implement logic for Account Linking and Status Checks (`is_active`).
    *   Implement `JwtStrategy` and `JwtAuthGuard` to protect API routes.
    *   Implement `/refresh` endpoint and refresh token rotation logic.
3.  **Update Database Schema:** Use the custom `OAuthAccount` and `RefreshToken` tables.
4.  **Configure Frontend Routing:** Update Next.js login buttons to link directly to the NestJS `/api/auth/google` endpoint.
5.  **Setup Interceptors:** Configure an Axios or fetch interceptor in Next.js (or TanStack Query) to automatically handle 401 errors by calling the `/refresh` endpoint and retrying the request.
6.  **Create RBAC Guards:** Implement role validation for specific NestJS routes using the JWT payload.
