---
trigger: glob
globs: apps/api/**
---

# NestJS API — Conventions & Patterns

## Guiding Principles

| Principle      | Application                                                                                                                |
| -------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **SRP**        | Controllers handle HTTP, services handle business logic, `PrismaService` handles data access. One reason to change each.   |
| **DRY**        | Extract shared validation and mapping to `packages/core`. Do not duplicate Zod schemas or types between apps.              |
| **KISS**       | Prefer simple, readable solutions. Do not add abstractions (repositories, CQRSs) until they are justified by complexity.   |
| **YAGNI**      | Only build what the current feature requires. Do not pre-build infrastructure "just in case".                              |
| **Pragmatism** | Follow patterns when they add value. Break rules only when strict adherence creates unnecessary complexity — and document. |

## Path Aliases

- Use the `@/` alias (maps to `src/`) for all internal imports. Never use `..` to traverse up directories.
- Import workspace packages via their package names: `@happyrisk/core/schemas`, `@happyrisk/core/types`, `@happyrisk/core/constants`.

## Module Structure

Every feature lives in its own directory under `src/modules/<feature>/` and follows:

```
src/modules/<feature>/
  <feature>.module.ts
  <feature>.controller.ts
  <feature>.service.ts
  <feature>.dto.ts          # nestjs-zod DTOs wrapping @happyrisk/core schemas
  <feature>.service.spec.ts
```

- One `@Module()` per feature. Register it in `AppModule`.
- Controllers handle HTTP concerns only — no business logic.
- Services contain all business logic and talk to `PrismaService` directly.
- Never inject `PrismaService` into a controller.
- A module should be self-contained. Moving or removing a feature module must not break other modules.
- Cross-module communication goes through exported services and NestJS DI, never direct imports of internal classes.
- Shared cross-cutting concerns (middleware, guards, filters, interceptors, generic utils) live in `src/common/`. Move code there only when used by 3+ modules.

## Dependency Injection

Always declare injected services as `private readonly`:

```typescript
constructor(
  private readonly prisma: PrismaService,
  private readonly configService: ConfigService,
) {}
```

## Environment Variables

- Use `configService.getOrThrow<string>('VAR_NAME')` for every required variable.
- Never use `configService.get()` with a fallback string in production paths. If a variable is optional only in development, document this explicitly.
- All required variables must be listed in `.env.example`.

## Logging

Use NestJS `Logger` scoped to the class name. Declare it as a private class field:

```typescript
private readonly logger = new Logger(AuthController.name);
```

- Use `this.logger.error()` for caught exceptions and `this.logger.warn()` for non-critical failures.
- Never use `console.log` in application code (only allowed in the bootstrap `catch` in `main.ts`).
- Log business-meaningful events: failed auth attempts, deactivations, external API call failures.
- Never log sensitive data: tokens, passwords, full request bodies containing PII, IP addresses.

## Resource Naming & HTTP Methods

All routes are prefixed with `/api` (set via `app.setGlobalPrefix('api')` in `main.ts`).

| Method   | Path             | Purpose                                   | Success Code |
| -------- | ---------------- | ----------------------------------------- | ------------ |
| `GET`    | `/resources`     | List (with optional filtering/pagination) | `200`        |
| `GET`    | `/resources/:id` | Single resource details                   | `200`        |
| `POST`   | `/resources`     | Create resource                           | `201`        |
| `PATCH`  | `/resources/:id` | Partial update                            | `200`        |
| `DELETE` | `/resources/:id` | Remove resource                           | `204`        |

**Naming conventions:**

- Use **plural nouns** for resource names: `/users`, `/teams`, `/projects`.
- Use **kebab-case** for multi-word resources: `/survey-cycles`, `/risk-actions`.
- Nest sub-resources max **1 level deep**: `/projects/:id/members`. Avoid deeper nesting.
- Use query parameters for filtering, not path segments.
- Custom actions on a resource use a verb suffix: `PATCH /users/:id/deactivate`, `PATCH /teams/:id/archive`.

**Standard error response codes:**

| Code  | Meaning                                                           |
| ----- | ----------------------------------------------------------------- |
| `400` | Validation errors (malformed request body, missing fields)        |
| `401` | Unauthenticated (missing or invalid JWT)                          |
| `403` | Forbidden (valid JWT but insufficient role/permissions)           |
| `404` | Resource not found                                                |
| `409` | Conflict (duplicate unique field — Prisma P2002)                  |
| `422` | Business logic error (state conflict, foreign key violation)      |
| `500` | Unexpected server error — never expose stack traces in production |

## HTTP & Validation

- Use `nestjs-zod` `createZodDto` to create DTO classes from schemas defined in `packages/core`.
- The global `ZodValidationPipe` is registered in `AppModule` via `APP_PIPE` — do not register per-route validation pipes for request body.
- Use `ParseUUIDPipe` for every UUID path parameter (`@Param('id', ParseUUIDPipe)`).
- Apply `@HttpCode(HttpStatus.OK)` on `@Post` endpoints that do not return 201.
- Apply `@HttpCode(HttpStatus.NO_CONTENT)` on `@Delete` endpoints.
- Use `@Roles()` decorator + `RolesGuard` after `JwtAuthGuard` for role-based access:

```typescript
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class UsersController { ... }
```

- Validate all incoming data at the API boundary (DTOs). Never trust query params, path params, or headers without validation.

## Pagination, Filtering & Sorting

Every list endpoint that may return an unbounded result set **must** support pagination. Use the following contract:

**Request query parameters:**

| Parameter       | Format                  | Description                               |
| --------------- | ----------------------- | ----------------------------------------- |
| `page`          | `page=1`                | Page number (1-indexed)                   |
| `limit`         | `limit=20`              | Results per page                          |
| `sort[field]`   | `sort[createdAt]=desc`  | Sort by field, direction: `asc` or `desc` |
| `filter[field]` | `filter[status]=ACTIVE` | Filter by field value                     |

**Advanced Filter Operators (when applicable)**

| Operator  | SQL Equivalent | Example                             |
| --------- | -------------- | ----------------------------------- |
| `eq`      | `=`            | `filter[status][eq]=active`         |
| `neq`     | `<>`           | `filter[status][neq]=deleted`       |
| `lt`      | `<`            | `filter[age][lt]=30`                |
| `lte`     | `<=`           | `filter[age][lte]=30`               |
| `gt`      | `>`            | `filter[age][gt]=18`                |
| `gte`     | `>=`           | `filter[age][gte]=18`               |
| `include` | `LIKE %val%`   | `filter[name][include]=john`        |
| `in`      | `IN (...)`     | `filter[status][in]=active,pending` |

**Filter Behavior**

- Same field, multiple values → interpreted as `OR`:

  ```text
  ?filter[firstName]=Ewa&filter[firstName]=Adam
  → WHERE (firstName = 'Ewa' OR firstName = 'Adam')
  ```

- Different fields → interpreted as `AND`:

  ```text
  ?filter[firstName]=Ewa&filter[lastName]=Kowalska
  → WHERE (firstName = 'Ewa' AND lastName = 'Kowalska')
  ```

- LIKE search → use URL-encoded `%25` suffix:
  ```text
  ?filter[lastName]=Now%25
  → WHERE lastName LIKE 'Now%'
  ```

**Response format:**

```json
{
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 57,
      "totalPages": 6
    },
    "filter": {
      "status": "active"
    },
    "sort": {
      "lastName": "ASC"
    },
    "search": "john"
  },
  "items": [{ "..." }]
}
```

**Rules:**

- Define a shared `PaginationQueryDto` (Zod schema in `packages/core`) for `page` and `limit`.
- Default `limit` = 20. Maximum `limit` = 100 — cap silently.
- Invalid filter or sort field names are silently ignored (do not apply, do not error).
- Use Prisma `skip`/`take` for pagination and `orderBy` for sorting.
- Use `prisma.$transaction([countQuery, dataQuery])` to get total count and data in a single round-trip when both are needed.

## Exception Handling

- Throw NestJS built-in exceptions with a string code as the message:
  - `new NotFoundException('UserNotFound')`
  - `new ConflictException('UserAlreadyExists')`
  - `new UnauthorizedException('InvalidRefreshToken')`
- Always catch Prisma `P2002` (unique constraint violation) errors and rethrow as `ConflictException`:

```typescript
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    throw new ConflictException('ResourceAlreadyExists');
  }
  throw error;
}
```

- Prefer the TOCTOU-safe approach: skip the precheck `findUnique()` and rely on the database unique constraint + P2002 catch for concurrent safety.
- Never expose stack traces, internal paths, or database details in error responses. NestJS's default exception filter handles this — do not override it to add more detail.

## Prisma Usage in Services

- Always use `select` to project only the fields you need. Define a `private readonly <entity>Select` object as a class field:

```typescript
private readonly userSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;
```

- Use `prisma.$transaction([...])` for atomic multi-step operations.
- Use `prisma.$transaction(async (tx) => { ... })` for conditional/interactive transactions (e.g., optimistic locking patterns).
- Prefer conditional `updateMany` with `where: { id, revoked: false }` to implement single-winner gates in concurrent scenarios.
- Never write raw SQL for data access. Use Prisma's query builder exclusively — it guarantees parameterized queries and prevents SQL injection. **Exception:** parameterized `prisma.$queryRaw` is permitted for lightweight connectivity/health checks (e.g., `SELECT 1`) where the query builder has no equivalent. Never interpolate user input into `$queryRaw` — always use tagged template literals so parameters are bound.
- Always handle Prisma error codes (`P2002`, `P2025`, etc.) explicitly in catch blocks. Do not let Prisma exceptions bubble up unhandled to the client.

## State-Changing Operations

- When deactivating a user (`isActive = false`), always revoke all their refresh tokens in the same transaction:

```typescript
const [user] = await this.prisma.$transaction([
  this.prisma.user.update({ where: { id }, data: { isActive: false }, select: this.userSelect }),
  this.prisma.refreshToken.deleteMany({ where: { userId: id } }),
]);
```

- Never allow `isActive: false` to be set through a generic `update()` without going through the `deactivate()` path.

## API Documentation

- Every endpoint must be documented using `@nestjs/swagger` decorators.
- Use `@ApiTags()` on controllers, `@ApiOperation()` on handlers, `@ApiResponse()` for each possible status code.
- `nestjs-zod` automatically generates OpenAPI schemas from Zod DTOs — leverage this instead of writing manual `@ApiProperty()` decorators.
- Serve Swagger UI at `/api/docs` (configure via `SwaggerModule.setup('api/docs', ...)` in `main.ts`).
- Document authentication requirements (`@ApiBearerAuth()`), query parameters, and example values.
- Keep documentation in sync with the code — stale docs are worse than no docs.

## Health Check

Expose a `GET /api/health` endpoint:

- Place it on `AppController` (or a dedicated `HealthController`) **without** auth guards — it must be publicly accessible.
- Return `200` with `{ "status": "ok" }` at minimum.
- Optionally verify database connectivity via a lightweight Prisma query (`prisma.$queryRaw`).
- This endpoint is used by infrastructure (Render/Railway) for liveness probes — it must be fast and never throw.

## Scalability & Security

### Stateless Design

- Design for **horizontal scaling**: no in-memory state, no sticky sessions.
- Never store temporary data in application memory. All state lives in PostgreSQL.
- The application runs as a persistent NestJS server (required for Slack Socket Mode) — but each instance must be independently replaceable.

### Database

- Rely on **Prisma's built-in connection pooling**. Do not use Supabase's pgbouncer/Supavisor — we connect directly (port `5432`).
- Always paginate list queries. Never return unbounded result sets.

### Security

- **Input validation**: All user input is validated at the API boundary via `nestjs-zod` DTOs and `ZodValidationPipe`. Never trust raw `req.body`, `req.query`, or `req.params`.
- **SQL injection**: Prisma's parameterized queries prevent this. Never concatenate user input into raw SQL.
- **Authentication**: Short-lived JWTs (15 min) + refresh token rotation with reuse detection. Tokens delivered via `HttpOnly`, `Secure`, `SameSite=Strict` cookies.
- **Authorization**: Enforce at every endpoint via `JwtAuthGuard` + `RolesGuard`. Check resource ownership, not just role membership, for project-scoped resources.
- **CORS**: Configure explicitly in `main.ts` — use `process.env.FRONTEND_URL` as origin. Never use `*` in production.
- **Sensitive data**: Never expose stack traces, internal paths, or database details in API responses. Never log tokens, passwords, or PII.
- **Dependencies**: Regularly audit with `pnpm audit`. Keep Prisma, NestJS, and Passport up to date.
- **Rate limiting**: Apply on authentication endpoints (`/auth/google`, `/auth/refresh`) and any public endpoints.
- **Secrets**: Store in environment variables. Never commit `.env` files. Use `configService.getOrThrow()` to fail fast on missing secrets.

## Source Format

- `apps/api` uses **CommonJS** (`sourceType: 'commonjs'` in ESLint). Do not use ESM-only patterns.
- Import Node.js built-ins with the `node:` prefix: `import * as crypto from 'node:crypto'`.

## Testing

- Unit test files are co-located: `<feature>.service.spec.ts`.
- E2E tests live in `test/` directory and use `jest-e2e.json` config.
- Use `@nestjs/testing` `Test.createTestingModule()` to bootstrap test modules.
- Mock `PrismaService` — never hit a real database in unit tests.
- Test the **service layer** for business logic (unit tests) and **controller + full pipe** for HTTP contract (E2E tests).
- Every new endpoint must have at minimum: a unit test for the happy path and a test for the primary error case.
