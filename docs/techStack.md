# Technical Stack

This document defines the architecture and technology choices for HappyRisk AI, optimized for high performance, developer productivity, and cross-platform type safety.

---

## 1. Core Architecture

- **Monorepo Management:** [Turborepo](https://turbo.build/) with `pnpm`.
  - _Goal:_ Share TypeScript types and validation schemas between the bot (backend) and the dashboard (frontend).
- **Language:** [TypeScript](https://www.typescriptlang.org/) (Strict Mode).
  - _Goal:_ End-to-end type safety from the DB to the Slack interaction layer.

---

## 2. Backend (apps/api)

- **Framework:** [NestJS](https://nestjs.com/) (Persistent Server).
  - _Goal:_ Handle Slack Socket Mode connections and recurring Cron jobs for surveys.
- **Slack Integration:** [@slack/bolt](https://slack.dev/bolt-js/).
  - _Goal:_ Official SDK for processing Slack events and Block Kit messages.
- **Validation & Schema:** [Zod](https://zod.dev/) via `nestjs-zod`.
  - _Goal:_ Replaces `class-validator`. Provides a single source of truth for API request validation and AI-generated JSON parsing.
- **Automation:** `@nestjs/schedule`.
  - _Goal:_ To trigger weekly surveys and automated risk analysis reports.

---

## 3. Frontend / Dashboard (apps/web)

- **Framework:** [Next.js 16+](https://nextjs.org/) (App Router).
  - _Goal:_ Fast, server-side rendered dashboard for managers.
- **UI Components:** [Shadcn/UI](https://ui.shadcn.com/) + [Tailwind CSS](https://tailwindcss.com/).
  - _Goal:_ Clean, accessible, and rapidly built management interface.
- **Form Handling:** [React Hook Form](https://react-hook-form.com/).
  - _Goal:_ Performant, flexible form validation and state management with minimal re-renders.
- **Data Fetching:** [TanStack Query](https://tanstack.com/query/latest) (React Query).
  - _Goal:_ Handle caching and synchronization for real-time risk data.

---

## 4. Database & ORM (apps/api/prisma)

- **Database:** [PostgreSQL](https://www.postgresql.org/).
  - _Goal:_ Relational storage for complex hierarchies (Teams > Projects > Risks).
- **Database Infrastructure:** [Supabase](https://supabase.com/).
  - _Goal:_ Used strictly as a managed PostgreSQL hosting provider. We use direct connections (treating our backend as a traditional, persistent server) and rely on Prisma's built-in connection pooling. We do not use Supabase Auth, Storage, or Edge Functions.
- **ORM & Migrations:** [Prisma](https://www.prisma.io/).
  - _Why:_ Industry standard for migrations and type-safe database access. Ensures easy migration to any PostgreSQL provider.

---

## 5. AI Engine

- **Model:** [OpenAI GPT-4o-mini](https://openai.com/).
  - _Goal:_ Fast reasoning (< 2s) and low-cost analysis.
- **Modes:** \* _Chat Completions:_ For conversational follow-ups.
  - _JSON Mode:_ For structured data extraction (Risk Registry).

---

## 6. Authentication & Security

- **Centralized API Auth:** `@nestjs/passport` + `@nestjs/jwt` (NestJS) with **Google OAuth**.
  - _Goal:_ Corporate-grade login for managers using their company Google Workspace accounts. API-first approach to support multiple clients (Web, Mobile). Frontend acts only as a stateless JWT consumer.
- **Bot Security:** Slack Signing Secret + Bot User OAuth Token.
- **Anonymity Layer:** Application-level filters to prevent `user_id` exposure in dashboard views, especially for small teams (n < 5).

---

## 7. Infrastructure

- **API Hosting:** [Render](https://render.com/) or [Railway](https://railway.app/).
  - _Goal:_ Persistent environments required for long-lived Slack socket connections.
- **Frontend Hosting:** [Vercel](https://vercel.com/).
- **Monitoring:** [Sentry](https://sentry.io/).
- **CI/CD:** [GitHub Actions](https://github.com/features/actions).
