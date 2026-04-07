---
trigger: glob
globs: packages/**
---

# Shared Packages — Conventions & Patterns

## `packages/core` — Single Source of Truth

This package is the most critical piece of the monorepo. It holds all logic shared between `apps/api` and `apps/web`.

### Directory Layout

```
packages/core/src/
  schemas/      # Zod schemas (validation)
  types/        # Inferred TypeScript types
  constants/    # Shared configuration values
  index.ts      # Re-exports (keep minimal)
```

### Schemas (`src/schemas/`)

- Define all Zod schemas here that are used by more than one app.
- Enum schemas live in `enums.ts` and are imported by domain schema files (`user.ts`, `survey.ts`, `risk.ts`, etc.).
- Group related schemas in a single file by domain (e.g., all survey schemas in `survey.ts`).
- Every schema file exports both the Zod object and the inferred type:

```typescript
export const userCreateSchema = z.object({ ... });
export type UserCreate = z.infer<typeof userCreateSchema>;
```

- Never define a type manually if a Zod schema already exists for it.

### Types (`src/types/`)

- Only place types here that cannot be derived from a Zod schema (e.g., complex utility types, mapped types).
- Prefer `z.infer<typeof schema>` over hand-written interfaces.

### Constants (`src/constants/`)

- All shared configuration values go here — never hardcode them in application code.
- Key example: `ANONYMITY_THRESHOLD = 5`. Always import this constant, never write the literal `5`.

```typescript
import { ANONYMITY_THRESHOLD } from '@happyrisk/core/constants';
```

### Subpath Imports

Always import using the declared subpath exports, not deep paths:

```typescript
import { userCreateSchema, UserCreate } from '@happyrisk/core/schemas';
import { ANONYMITY_THRESHOLD } from '@happyrisk/core/constants';
import type { SomeSharedType } from '@happyrisk/core/types';
```

### Build

The package compiles to `dist/` via `tsc`. It must be built before `apps/api` or `apps/web` (Turborepo `dependsOn: ["^build"]` handles this). After modifying `packages/core`, run `pnpm build --filter @happyrisk/core` or simply `pnpm build` from the root to rebuild all.

---

## `packages/eslint-config` — Shared ESLint Configuration

Provides three composable ESLint flat configs:

| Export                            | Used by      |
| --------------------------------- | ------------ |
| `@happyrisk/eslint-config/base`   | All packages |
| `@happyrisk/eslint-config/nestjs` | `apps/api`   |
| `@happyrisk/eslint-config/nextjs` | `apps/web`   |

### Key Rules Enforced

- **Import order** (via `eslint-plugin-simple-import-sort`): side-effects → `node:` → `@happyrisk/*` → external → `@/` → relative → CSS.
- **No parent-relative imports**: `..` patterns are forbidden. Use `@/` alias or workspace imports.
- **Quotes**: single quotes everywhere.
- **Semicolons**: always required.
- **Trailing commas**: always-multiline.
- **Padding lines**: blank line required before `return`, `if`, `try`, `throw`, `switch`, `class`, `export`, etc.
- **`@typescript-eslint/no-explicit-any`**: off (by project policy).
- **`@typescript-eslint/no-floating-promises`**: warn in NestJS config.

### Extending the Config

When adding a new app or package, create an `eslint.config.mjs` at the package root:

```javascript
// For a NestJS-based app:
import { nestjsConfig } from '@happyrisk/eslint-config/nestjs';
export default nestjsConfig({ tsconfigRootDir: import.meta.dirname });

// For a Next.js app:
import { nextjsConfig } from '@happyrisk/eslint-config/nextjs';
export default nextjsConfig({ tsconfigRootDir: import.meta.dirname });

// For a plain Node/library package:
import { baseConfig } from '@happyrisk/eslint-config/base';
export default baseConfig({ tsconfigRootDir: import.meta.dirname });
```

Do not add app-specific ESLint rules inside `packages/eslint-config`. Keep that package generic. App-specific overrides go in the app's own `eslint.config.mjs`.
