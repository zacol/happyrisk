---
trigger: glob
globs: apps/web/**
---

# Next.js Web — Conventions & Patterns

## ⚠️ Read First — This Is Not the Next.js You Know

This project uses **Next.js 16** with **React 19**. APIs, conventions, and file structure may differ from your training data. Before writing any Next.js-specific code, check `node_modules/next/dist/docs/` for the authoritative reference. Reed all deprecation notices.

## App Router

- Use the **App Router** exclusively. The `pages/` directory does not exist in this project.
- File conventions: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`.
- Route groups use the `(group)` naming convention (parentheses).
- All pages and layouts are **Server Components by default**. Add `'use client'` only when you need browser APIs, event handlers, or React hooks.

## Path Aliases

- Use the `@/` alias (maps to `src/`) for all internal imports. Never use `..` to traverse up directories.
- Import workspace packages via their package names: `@happyrisk/core/schemas`, `@happyrisk/core/types`, `@happyrisk/core/constants`.

## Data Fetching — TanStack Query

- Use **TanStack Query v5** (`@tanstack/react-query`) for **all server state** management.
- Never perform raw `fetch` or `axios` calls directly inside React components.
- Define query and mutation functions in `src/hooks/` or `src/lib/`.
- API calls go through the Axios instance configured in `src/lib/` — do not create ad-hoc Axios instances.
- Use `@tanstack/eslint-plugin-query` rules to keep query usage correct (already enforced by ESLint config).

## Forms

- Use **React Hook Form** (`react-hook-form`) with `@hookform/resolvers/zod` for all forms.
- Form validation schemas must come from `@happyrisk/core/schemas` (or a local Zod schema if frontend-only).
- Never write manual validation logic — always use Zod.

## UI Components & Styling

- Use **shadcn/ui** components (backed by `@base-ui/react`) as the primary component library. Do not install competing headless UI libraries.
- Use **Lucide React** for all icons. Do not import from other icon libraries.
- Use **TailwindCSS v4** for all styling. Do not write inline styles or plain CSS (except in `globals.css` for design tokens).
- Use **`tailwind-merge`** (`twMerge` / `cn`) to merge conditional Tailwind classes.
- Use **`class-variance-authority`** (CVA) for variant-based component styling.
- Use **`next-themes`** for dark/light mode. Never hard-code color values that break in alternate themes.
- Use **Sonner** for toast notifications. Do not use `alert()` or other browser dialogs.

## Authentication

- Auth tokens are stored **exclusively in `HttpOnly` cookies** set by the NestJS backend. Never store tokens in `localStorage`, `sessionStorage`, or React state.
- The `proxy.ts` middleware handles silent token rotation (access token expired → refresh → retry). No auth logic belongs inside page components.
- Protected routes are defined by the `matcher` in `proxy.ts`. All new protected routes must fall under the matcher pattern.
- To read the current user, call `GET /api/auth/me`. Do not decode or verify JWTs on the frontend for security decisions — only for UX (e.g., role-based rendering).
- For route protection logic, check `middleware.ts` / `proxy.ts` — not inside layouts or pages.

## API Communication

- All requests to the NestJS API use the base URL from `process.env.NEXT_PUBLIC_API_URL`.
- Cookies are forwarded automatically by the browser (credentials: `include`). Do not manually attach tokens to headers.
- Handle `401 Unauthorized` globally via an Axios interceptor or TanStack Query's `onError` — redirect to `/login`.

## Environment Variables

- Public variables (accessible in browser) must be prefixed with `NEXT_PUBLIC_`.
- Required variables must throw at startup if missing — never fall back silently in production.
- Keep `.env.example` up to date with every new variable added.

## Component Organization

```
src/
  app/           # App Router routes (layouts, pages, loading, error)
  components/
    ui/          # Generic shadcn/ui primitives
    <feature>/   # Feature-specific components
  hooks/         # Custom React hooks + TanStack Query hooks
  lib/           # API clients, utilities, providers
```

- Keep components small and focused. Extract reusable logic into custom hooks in `src/hooks/`.
- Providers (QueryClient, ThemeProvider, etc.) are wrapped in `src/lib/providers.tsx` and mounted once in the root layout.
