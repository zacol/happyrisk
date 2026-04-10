---
trigger: glob
globs: apps/api/**
---

# Database & Prisma — Conventions & Patterns

## Infrastructure

- **Database:** PostgreSQL hosted on **Supabase** (used strictly as managed PostgreSQL — no Supabase Auth, Storage, or Edge Functions).
- **ORM:** Prisma 7 with `@prisma/adapter-pg` driver adapter.
- **Connection:** Always use the **Direct Connection URL** (port `5432`). Never use the Supabase connection pooler (pgbouncer/Supavisor).
- **Connection pooling:** Handled entirely by Prisma's built-in pooler.
- **Generated client** output: `apps/api/src/generated/prisma`. Import from there — never from the default `@prisma/client` path directly.

## Schema Conventions (`prisma/schema.prisma`)

### Primary Keys

Use database-level UUID generation for all primary keys:

```prisma
id String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
```

Do **not** use Prisma's `uuid()` — `gen_random_uuid()` ensures Supabase Studio compatibility.

### Timestamps

Every `updated_at` field requires both `@updatedAt` and an explicit `@default(now())`:

```prisma
updatedAt DateTime @default(now()) @updatedAt @map("updated_at")
```

The explicit default is required for records created via Supabase Studio.

### Enums

- All enum variants are **UPPERCASE** (e.g., `USER`, `ADMIN`, `WEEKLY`, `POSITIVE`).
- Prisma enums must mirror the Zod enum schemas defined in `packages/core/src/schemas/enums.ts`. If you add a new variant, update both.

### Field Naming

- Prisma schema uses `camelCase` field names with `@map("snake_case")` for DB column names.
- Table names use `@map` / `@@map` to enforce `snake_case` in the database.

## Cascade Delete Policy

| Relation                            | `onDelete` | Reason                                 |
| ----------------------------------- | ---------- | -------------------------------------- |
| `User → RefreshToken`               | `Cascade`  | Session data, cleaned on user removal  |
| `User → OAuthAccount`               | `Cascade`  | Identity link, cleaned on user removal |
| `Project → ProjectMembership`       | `Cascade`  | Membership scoped to project lifecycle |
| `SurveyCycle → SurveyParticipation` | `Restrict` | Historical response rate data          |
| `SurveyCycle → SurveyResponse`      | `Restrict` | Anonymous data is irreplaceable        |
| `SurveyResponse → AIAnalysis`       | `Restrict` | Prevent accidental loss of analysis    |
| All other FKs                       | `Restrict` | Default — protect core domain entities |

**Default:** `Restrict` unless there is an explicit reason documented above. Never use `SetNull` or `NoAction` without a clear justification.

## Validation

- There are **no DB-level CHECK constraints**. All field-level constraints (e.g., rating `1–5`, time format `HH:MM`) are enforced at the application layer via **Zod schemas** in `packages/core`.
- Prisma does not have a native `TIME` type — store time-of-day values as `String @db.VarChar(5)` and validate with a Zod regex.

## Migrations

- Run `pnpm --filter @happyrisk/api prisma:migrate:dev` to create a new migration during development.
- Run `pnpm --filter @happyrisk/api prisma:migrate:deploy` to apply pending migrations in production.
- Never edit a migration file after it has been applied. Create a new migration instead.
- After any schema change, run `pnpm --filter @happyrisk/api prisma:generate` to regenerate the client.

## PrismaService

- `PrismaService` lives in `src/modules/prisma/` and extends `PrismaClient`.
- It is a global module — inject it into any service without importing `PrismaModule` explicitly.
- Never instantiate `new PrismaClient()` directly in application code.

## Query Patterns

- Always use `select` to project only the fields required by the response. Define a reusable `private readonly <entity>Select` object per service.
- Use `orderBy: { createdAt: 'desc' }` as the default sort order for list queries unless there is a domain-specific reason.
- Prefer `findUnique` over `findFirst` when querying by a unique field.
- Use `prisma.$transaction([...])` for simple atomic batches and `prisma.$transaction(async (tx) => {...})` for conditional/interactive transactions.

## Anonymity Architecture

This is the most critical data constraint in the schema:

- `SurveyParticipation` stores **who** responded (has `user_id`).
- `SurveyResponse` stores **what** was said (has **no** `user_id`).
- There is **intentionally no foreign key** between these two tables.
- **Never write a query that JOINs `SurveyParticipation` and `SurveyResponse`.**
- `SurveyResponse.created_at` uses **date-level precision** only (no exact timestamp) to prevent timing-based de-anonymization.
