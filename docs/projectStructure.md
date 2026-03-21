# Project Structure

This project is organized as a **Turborepo monorepo** to ensure type safety and logic sharing across the entire stack.

---

## 📂 Root Directory
* `.pnpm-workspace.yaml` – Defines the workspace members.
* `turbo.json` – Configuration for build pipelines and caching.
* `package.json` – Root dependencies and scripts.
* `docs/` – Project documentation (PRD, Tech Stack, Prompts).

---

## 📂 apps/ (Applications)

### 🤖 `apps/api` (NestJS - Backend & Slack Bot)
The core engine of the platform, handling Slack events and AI processing.
* `src/modules/slack/` – Slack Bolt SDK integration, Block Kit handlers, and event listeners.
* `src/modules/ai/` – OpenAI integration, prompt management (Follow-up & Analysis).
* `src/modules/surveys/` – Logic for triggering weekly check-ins and managing responses.
* `src/modules/risks/` – Risk Registry logic and AI-driven triage.
* `src/modules/auth/` – Internal API security and session handling.
* `prisma/schema.prisma` – The single source of truth for the PostgreSQL schema.
* `src/main.ts` – Application entry point (Persistent Server for Slack Socket Mode).

### 📊 `apps/web` (Next.js - Management Dashboard)
The interface for PMs and Admins to view trends and manage risks.
* `src/app/` – App Router (Dashboard, Settings, Stateless Login UI).
* `src/components/` – UI components (Shadcn/UI, Charts, Risk Tables).
* `src/hooks/` – Custom React hooks and TanStack Query logic.
* `src/lib/` – API clients and dashboard-specific utilities.

---

## 📂 packages/ (Shared Libraries)

### ️ `packages/shared` (Single Source of Truth)
This is the most critical package for the monorepo.
* `src/schemas/` – **Zod schemas** used for validation in both the API (Requests) and Web (Forms).
* `src/types/` – Shared TypeScript interfaces and enums (e.g., Risk Categories, Sentiment).
* `src/constants/` – Shared configuration (e.g., Anonymity threshold `n = 5`).

### 🎨 `packages/ui` (Optional - Shared UI)
* *Note:* While `apps/web` contains dashboard components, this package can store shared design tokens or primitive UI elements if multiple web apps are added later.

### ⚙️ `packages/config` (Development Config)
* `eslint/` – Shared linting rules.
* `typescript/` – Base TSConfig files.
* `tailwind/` – Shared Tailwind configuration.

---

## 🛠️ Key File Locations

| Resource | Path |
| :--- | :--- |
| **Prisma Schema** | `apps/api/prisma/schema.prisma` |
| **Zod Validations** | `packages/shared/src/schemas/index.ts` |
| **AI Prompt Logic** | `apps/api/src/modules/ai/ai.service.ts` |
| **Slack Event Handlers** | `apps/api/src/modules/slack/slack.controller.ts` |
| **NestJS Auth Config** | `apps/api/src/modules/auth/strategies/google.strategy.ts` |
| **Risk Table View** | `apps/web/src/components/risk-registry/` |

---

## 🚀 Development Workflow

1.  **Shared Logic:** If you update a validation rule (e.g., increasing the max length of a comment), you only change it in `packages/shared/src/schemas`. Both the Slack Bot and the Dashboard will respect the new rule immediately.
2.  **Database:** Changes to `schema.prisma` are applied once and the generated types are instantly available to both the NestJS backend and Next.js frontend.
3.  **Deployment:** `apps/api` is deployed to a persistent environment (Render/Railway), while `apps/web` is deployed to Vercel.