---
trigger: always_on
---

# General Project Conventions

## Monorepo Structure

This is a **Turborepo** monorepo managed with **pnpm** workspaces.

- `apps/api` — NestJS backend (Slack Bot + REST API)
- `apps/web` — Next.js 16 management dashboard
- `packages/core` — Shared Zod schemas, TypeScript types, and constants
- `packages/eslint-config` — Shared ESLint configurations

All commands are run from the root using Turborepo tasks (`pnpm build`, `pnpm dev`, `pnpm lint`, `pnpm typecheck`, `pnpm test`). Never bypass Turbo by running app-specific scripts directly unless debugging.

## Node.js & Package Manager

- **Node.js** `>=24.14.0` is required (see `.nvmrc`).
- **pnpm** `10.32.1` is the only supported package manager. Never use `npm` or `yarn`.
- Add new dependencies with `pnpm add <pkg> --filter @happyrisk/<app>`.

## TypeScript

- All code must be written in **TypeScript**. No plain `.js` files in `apps/` or `packages/core`.
- Strict mode is enabled. Never use type assertions (`as X`) to silence errors — fix the root cause.
- `@typescript-eslint/no-explicit-any` is **off** by project policy, but prefer explicit types when they add clarity.

## Shared Logic — `packages/core`

- **All Zod schemas** shared between the API and the web app live in `packages/core/src/schemas/`.
- **All shared TypeScript types** live in `packages/core/src/types/`. Always infer types from Zod schemas (`z.infer<typeof schema>`), never duplicate type definitions.
- **All shared constants** (e.g., anonymity threshold `n = 5`) live in `packages/core/src/constants/`.
- Import from the package using its subpath exports: `@happyrisk/core/schemas`, `@happyrisk/core/types`, `@happyrisk/core/constants`.
- Never copy-paste a schema or type between `apps/api` and `apps/web`. Extract it to `packages/core` instead.

## Import Rules

The ESLint config enforces a strict import order and **forbids parent-relative imports** (`..`). Always follow this import group order:

1. Side-effect imports (`import '...'`)
2. Node built-ins (`node:fs`, `node:path`, ...)
3. Internal workspace packages (`@happyrisk/*`)
4. External packages (`@nestjs/*`, `react`, ...)
5. Internal path-aliased imports (`@/modules/...`, `@/lib/...`)
6. Relative sibling/child imports (`./foo`, `./bar/baz`)
7. CSS imports

**Never use `..` to import from a parent directory.** Use the `@/` path alias (maps to `src/`) or workspace package imports instead.

## Code Formatting

Prettier is the single source of formatting truth. Config (`.prettierrc`):

- `singleQuote: true`
- `semi: true`
- `tabWidth: 2`
- `trailingComma: 'all'`
- `printWidth: 100`

Run `pnpm format` from the root to format all files. The CI pipeline enforces this via lint-staged on commit.

## Commit Convention

All commits must follow **Conventional Commits** (enforced by commitlint + husky):

```text
<type>(<scope>): <description>
```

Valid types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `perf`, `ci`, `build`, `style`.

Examples:

- `feat(api): add survey cycle creation endpoint`
- `fix(web): handle expired access token in middleware`
- `chore(core): update zod schemas for risk entity`

## Environment Variables

- Every app has an `.env.example` file that documents required variables. Keep it up to date.
- **Never commit `.env` files.**
- In production, missing required env vars must cause the app to **fail fast** (use `configService.getOrThrow()` in NestJS, throw in Next.js config). Never silently fall back to a default value in non-development environments.
