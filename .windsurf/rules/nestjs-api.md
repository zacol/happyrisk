---
trigger: glob
globs: apps/api/**
---

# NestJS API — Conventions & Patterns

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

Use `this.logger.error()` for caught exceptions and `this.logger.warn()` for non-critical failures. Never use `console.log` in application code.

## HTTP & Validation

- Use `nestjs-zod` `createZodDto` to create DTO classes from schemas defined in `packages/core`.
- Use `ParseUUIDPipe` for every UUID path parameter (`@Param('id', ParseUUIDPipe)`).
- Apply `@HttpCode(HttpStatus.OK)` on `@Post` endpoints that do not return 201.
- Use `@Roles()` decorator + `RolesGuard` after `JwtAuthGuard` for role-based access:

```typescript
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class UsersController { ... }
```

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

## State-Changing Operations

- When deactivating a user (`isActive = false`), always revoke all their refresh tokens in the same transaction:

```typescript
const [user] = await this.prisma.$transaction([
  this.prisma.user.update({ where: { id }, data: { isActive: false }, select: this.userSelect }),
  this.prisma.refreshToken.deleteMany({ where: { userId: id } }),
]);
```

- Never allow `isActive: false` to be set through a generic `update()` without going through the `deactivate()` path.

## Source Format

- `apps/api` uses **CommonJS** (`sourceType: 'commonjs'` in ESLint). Do not use ESM-only patterns.
- Import Node.js built-ins with the `node:` prefix: `import * as crypto from 'node:crypto'`.

## Testing

- Unit test files are co-located: `<feature>.service.spec.ts`.
- E2E tests live in `test/` directory and use `jest-e2e.json` config.
- Use `@nestjs/testing` `Test.createTestingModule()` to bootstrap test modules.
- Mock `PrismaService` — never hit a real database in unit tests.
