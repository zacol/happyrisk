# Slack Integration

This document describes the full specification for the Slack Bot integration in HappyRisk AI. The bot is the primary data-collection interface — it handles weekly check-ins, AI-driven follow-up conversations, and feedback-loop notifications, all running as part of the NestJS backend (`apps/api`).

---

## 1. Connection Mode: HTTP Events API (Multi-Workspace)

The bot uses the **Slack Events API over HTTP** to support multiple workspaces — one per project.

- **Why HTTP mode:** Each project in HappyRisk maps to a separate Slack workspace. Managing multiple Socket Mode WebSocket connections (one per workspace) would require a complex connection pool. HTTP mode allows a single public endpoint to receive events from all connected workspaces, with per-workspace token resolution via the `SlackInstallation` record.
- **Library:** [`@slack/bolt`](https://slack.dev/bolt-js/) — official Slack SDK. The `App` is initialised with `signingSecret` only; per-workspace `token` values are resolved dynamically from the database via a custom `installationStore`.
- **Public URL required:** The NestJS backend must be reachable at a public HTTPS URL (Render/Railway provide this). This URL is registered in the Slack App settings under "Event Subscriptions" and "Interactivity & Shortcuts".

---

## 2. Environment Variables

The following variables must be added to `apps/api/.env` (and documented in `apps/api/.env.example`):

| Variable               | Format     | Description                                                                                          |
| :--------------------- | :--------- | :--------------------------------------------------------------------------------------------------- |
| `SLACK_CLIENT_ID`      | string     | OAuth App Client ID. Used to initiate the "Connect Slack" OAuth flow.                                |
| `SLACK_CLIENT_SECRET`  | string     | OAuth App Client Secret. Used to exchange the authorization code for a token.                        |
| `SLACK_SIGNING_SECRET` | string     | Used to verify the authenticity of incoming HTTP requests from Slack.                                |
| `SLACK_REDIRECT_URI`   | URL string | Callback URL registered in the Slack App settings (e.g., `https://<host>/api/slack/oauth/callback`). |
| `REDIS_URL`            | URL string | Redis connection URL for BullMQ message queue (e.g., `redis://localhost:6379`). See §12.             |

> **Per-workspace tokens:** `SLACK_BOT_TOKEN` is **not** a global environment variable. After a workspace is connected via the OAuth flow (§4), the bot token is stored encrypted in the `SlackInstallation` table and resolved dynamically at runtime.

> **Security note:** `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`, and `SLACK_SIGNING_SECRET` are required at startup. If any is missing in non-development environments, the application must fail fast (`configService.getOrThrow()`).

---

## 3. NestJS Module Structure

The Slack integration lives in `apps/api/src/modules/slack/`. It is registered as a standard NestJS module in `AppModule`.

```
src/modules/slack/
├── slack.module.ts                    # Registers Bolt App, InstallationStore provider, imports sub-modules
├── slack.service.ts                   # Bolt App instance factory, HTTP receiver setup, installationStore wiring
├── slack.controller.ts                # Registers all Bolt event/action/message listeners
├── oauth/
│   ├── slack-oauth.controller.ts      # GET /slack/oauth/install, GET /slack/oauth/callback
│   ├── slack-oauth.service.ts         # Code → token exchange, user sync orchestration
│   └── slack-installation.store.ts   # Custom InstallationStore: reads/writes SlackInstallation from DB
├── handlers/
│   ├── survey.handler.ts              # Full survey conversation flow (rating → follow-up → analysis)
│   └── notification.handler.ts       # Broadcast DM sender for feedback loop
├── queue/
│   ├── slack-dm.queue.ts              # BullMQ queue registration (name: 'slack-dm')
│   └── slack-dm.processor.ts          # @Processor('slack-dm', { concurrency: 1 }) — resolves token, calls chat.postMessage
└── slack.constants.ts                 # Action IDs, Block IDs, callback IDs used in Block Kit
```

---

## 4. "Connect Slack" OAuth Flow

Workspace connection is initiated from the **Project Settings** page in the management dashboard. An admin or project leader clicks **"Connect Slack"**, which starts the standard Slack OAuth 2.0 app installation flow.

### Required OAuth Scopes

The Slack App must request the following bot token scopes:

| Scope              | Purpose                                                              |
| :----------------- | :------------------------------------------------------------------- |
| `chat:write`       | Send DMs and channel messages.                                       |
| `im:write`         | Open DM channels with users.                                         |
| `users:read`       | List workspace members for user auto-sync after installation.        |
| `users:read.email` | Read member email addresses to match against `User.email` in the DB. |

### Step-by-Step Flow

```
1. Dashboard → User clicks "Connect Slack" on Project Settings.
        ↓
2. Next.js redirects browser to NestJS:
   GET /api/slack/oauth/install?projectId=<uuid>
        ↓
3. NestJS generates a signed `state` parameter (CSRF protection):
   state = sign({ projectId, nonce }, SLACK_CLIENT_SECRET)
        ↓
4. NestJS redirects to Slack's OAuth Authorization URL:
   https://slack.com/oauth/v2/authorize
     ?client_id=SLACK_CLIENT_ID
     &scope=chat:write,im:write,users:read,users:read.email
     &redirect_uri=SLACK_REDIRECT_URI
     &state=<signed_state>
        ↓
5. Workspace admin grants permissions on Slack's consent screen.
        ↓
6. Slack redirects to:
   GET /api/slack/oauth/callback?code=<auth_code>&state=<signed_state>
        ↓
7. NestJS verifies the state signature and extracts projectId.
        ↓
8. NestJS calls oauth.v2.access to exchange the code for tokens.
   Response includes:
     - access_token  → bot token (stored in SlackInstallation)
     - team.id       → Slack workspace ID
     - team.name     → workspace display name
     - bot_user_id   → bot's own Slack user ID in this workspace
        ↓
9. NestJS upserts SlackInstallation record in the DB:
     - workspace_id, workspace_name, bot_token, bot_user_id
     - project_id (from state), installed_by_id (from JWT)
   Also sets: Project.slack_workspace_id = team.id
        ↓
10. NestJS calls users.list on the newly connected workspace.
    → Auto-sync: match Slack members by email → ProjectMembership.slack_user_id (see §5).
        ↓
11. NestJS redirects browser back to the dashboard with ?slackConnected=true.
```

### Error Handling

| Error                     | Handling                                                                                     |
| :------------------------ | :------------------------------------------------------------------------------------------- |
| Invalid/expired `state`   | Reject with `400`. Never exchange the authorization code.                                    |
| Workspace already linked  | `SlackInstallation` is upserted (re-install). Existing `slack_user_id` values are preserved. |
| No matching `User.email`  | Slack member is skipped silently during auto-sync; linkable manually via admin panel.        |
| `oauth.v2.access` failure | Log error, redirect to dashboard with `?error=SlackOAuthFailed`.                             |

---

## 5. User Identity Mapping

The Slack platform identifies users by a **Slack User ID** (`U012AB3CD`). The internal platform identifies users by a UUID (`User.id`). These two identifiers must be bridged through `ProjectMembership.slack_user_id`.

### Mapping Rules

- `ProjectMembership.slack_user_id` stores the Slack User ID for a specific user **within a specific project's Slack workspace**.
- This field is nullable — a user can exist in the system without a linked Slack identity.
- The `Project.slack_workspace_id` field identifies which Slack workspace corresponds to a project. It is auto-populated during the OAuth flow (§4, step 9) and must never be set manually.

### Lookup Flow (Bot receiving an event)

```
Slack Event → slack_user_id (from payload)
    ↓
ProjectMembership.findFirst({ where: { slack_user_id, project_id } })
    ↓
→ user_id (internal UUID) — used ONLY for SurveyParticipation tracking
    ↓
→ SurveyResponse is created WITHOUT user_id (anonymity boundary)
```

> **Critical:** The `user_id` resolved from this lookup must **never** be stored in `SurveyResponse`, `AIAnalysis`, or any content table. It is used exclusively for `SurveyParticipation` (tracking WHO responded) and for sending the DM back to the user.

### Auto-Sync on Installation

After a workspace is connected (§4, step 10), `users.list` is called with the newly obtained bot token. Each workspace member is processed as follows:

```
Slack workspace member (from users.list)
    ↓ member.profile.email
Match against User.email in DB
    ↓ if match found AND ProjectMembership exists for (user_id, project_id)
Set ProjectMembership.slack_user_id = member.id
```

- Only active, non-bot Slack users with a verified email are processed.
- Members with no matching `User.email` in the DB are skipped — linkable manually via the admin panel.
- Auto-sync is also available on demand via a **"Sync Users"** button in Project Settings, to catch new workspace members added after initial installation.

---

## 6. Weekly Survey Dispatch (Cron Job)

The survey dispatch is triggered by a scheduled cron job managed by `@nestjs/schedule`.

### Schedule Resolution

Each project has a `SurveyConfig` record that defines:

- `frequency`: `WEEKLY` or `BIWEEKLY`
- `day_of_week`: ISO day number (1 = Monday, 7 = Sunday). Default: `5` (Friday).
- `time_utc`: Dispatch time in `HH:MM` format (UTC). Default: `14:00`.
- `is_active`: Whether automated surveys are enabled for this project.

### Dispatch Steps

1. **Cron fires** (evaluated every minute or every relevant time slot).
2. Find all active `SurveyConfig` records where the current UTC time matches `day_of_week` + `time_utc`.
3. For each matching project, create a new `SurveyCycle` record (`status: ACTIVE`, `period_start`, `period_end`).
4. Fetch all active `ProjectMembership` records with a non-null `slack_user_id` for the project.
5. For each member, create a `SurveyParticipation` record (`status: PENDING`) and enqueue a `send-survey-dm` job in the BullMQ queue (see §12).
6. Update each `SurveyParticipation.status` to `SENT` and set `sent_at`.

---

## 7. Conversation Flow

The entire survey interaction is a single DM thread between the bot and the team member. It is limited to **three bot messages** and two user responses to avoid survey fatigue (< 60 seconds total).

### Step 1: Initial Rating Message

The bot sends a Block Kit message with 5 action buttons.

```
┌────────────────────────────────────────────────┐
│ 👋 How would you rate your week on a scale      │
│    of 1 to 5?                                  │
│                                                │
│  [ 1 ]  [ 2 ]  [ 3 ]  [ 4 ]  [ 5 ]            │
└────────────────────────────────────────────────┘
```

- Each button triggers a Bolt `action` event with a unique `action_id` (e.g., `rating_1` … `rating_5`).
- On click, the buttons are replaced with a confirmation and a plain-text input asking for an optional initial comment:

```
┌────────────────────────────────────────────────┐
│ ✅ You rated your week: 3/5                     │
│                                                │
│ Anything specific on your mind? (optional)     │
│ [_________________________________]            │
│ [ Skip ]  [ Submit ]                            │
└────────────────────────────────────────────────┘
```

- On submit (or skip), a `SurveyResponse` is created immediately with `rating` and `initial_comment`, `conversation_status: PARTIAL`.

> **Anonymity checkpoint:** `SurveyResponse` is created without any `user_id`. At this moment, `SurveyParticipation.status` is updated to `RESPONDED` and `responded_at` is set — this is the only identity-linked operation.

### Step 2: AI Follow-up (AI #1)

After saving the `PARTIAL` response, the AI Follow-up Generator is called asynchronously.

**Input:**

```
Rating: {rating}/5
Initial Comment: {initial_comment}
```

**Output:** One deepening question (max 1 sentence). See `docs/prompts.md` §1 for the full system prompt.

The bot sends the AI-generated question as a plain-text reply in the same DM thread, followed by a plain-text input field. The user's response is the `follow_up_answer`.

### Step 3: Completion

After the follow-up answer is received (or if the user skips):

1. `SurveyResponse` is updated: `follow_up_question`, `follow_up_answer`, `conversation_status: COMPLETE`.
2. The bot sends a brief confirmation message.
3. AI #2 (Feedback Analyzer) is triggered asynchronously — see §8.

```
Bot: Thanks for the honest feedback! 🙌 Your input (anonymous) will help us improve.
```

### Interrupted Conversations

If a user closes Slack after Step 1 without completing the follow-up:

- The `SurveyResponse` with `conversation_status: PARTIAL` is preserved.
- The `SurveyParticipation.status` is already `RESPONDED` — the participation is counted.
- `PARTIAL` responses are included in the `HappinessSnapshot.response_count` calculation (rating is available).
- `AIAnalysis` is **not** triggered for `PARTIAL` responses (no text to analyze).

---

## 8. AI Analysis Pipeline

Triggered after a `COMPLETE` conversation is saved. This runs as a background job (fire-and-forget from the Slack handler's perspective).

```
SurveyResponse (COMPLETE)
    ↓
AI #2: Feedback Analyzer (see docs/prompts.md §2)
    ↓
AIAnalysis record created:
  - sentiment: POSITIVE | NEUTRAL | NEGATIVE
  - category: WORKLOAD | COMMUNICATION | MANAGEMENT | MEETINGS | PRIORITIES | TOOLING | TEAM_ATMOSPHERE
  - core_issue: max 10-word summary
  - is_project_risk: boolean
  - risk_justification: text
  - suggestion: text
  - raw_json: full AI response (for internal auditing — never exposed to managers)
    ↓
If is_project_risk = true:
    → Risk record created (source: AI_GENERATED, status: PENDING)
    → Trigger type set based on HI conditions (HI_BELOW_THRESHOLD or HI_DROP_20_PERCENT)
```

After each `SurveyCycle` collects enough responses, AI #3 (Thematic Grouper) generates a `ThematicSummary` for projects with fewer than `ANONYMITY_THRESHOLD` (5) responses — see `docs/databaseStructure.md` §Anonymity Architecture.

---

## 9. Feedback Loop Notification (US 1.3)

When a manager marks a risk as `ADDRESSED` or `RESOLVED` via the dashboard and provides a comment, the bot broadcasts an **anonymous notification** to all project members on Slack.

### Trigger

`RiskAction.action_type = ADDRESSED` or `RESOLVED` with a non-empty `comment`.

### Dispatch

1. Fetch all active `ProjectMembership` records with a non-null `slack_user_id` for the affected project.
2. Enqueue a `send-feedback-dm` job for each member in the BullMQ queue (see §12). The message contains only the manager's comment — no personal attribution.

```
┌────────────────────────────────────────────────┐
│ 📢 Update from the team:                        │
│                                                │
│ "New IDE licenses have been purchased for       │
│  the whole team."                              │
│                                                │
│ — Based on your recent team feedback           │
└────────────────────────────────────────────────┘
```

3. After dispatch, `RiskAction.notification_sent` is set to `true`.

---

## 10. Block Kit Component Reference

| Component              | Type            | Action / Block ID        | Description                                       |
| :--------------------- | :-------------- | :----------------------- | :------------------------------------------------ |
| Rating buttons         | `actions` block | `rating_1` … `rating_5`  | Initial 1–5 rating selection.                     |
| Initial comment input  | `input` block   | `initial_comment_input`  | Optional free-text after rating.                  |
| Comment submit button  | `actions` block | `submit_initial_comment` | Submits rating + comment, triggers AI #1.         |
| Skip button            | `actions` block | `skip_initial_comment`   | Skips comment, proceeds directly to AI #1.        |
| Follow-up answer input | `input` block   | `follow_up_answer_input` | Captures the answer to the AI-generated question. |
| Follow-up submit       | `actions` block | `submit_follow_up`       | Finalizes the conversation, triggers AI #2.       |
| Skip follow-up         | `actions` block | `skip_follow_up`         | Ends conversation as PARTIAL with only rating.    |

All `action_id` and `block_id` constants are defined in `slack.constants.ts` to avoid magic strings across handlers.

---

## 11. Privacy & Anonymity Constraints

The following rules are enforced at the Slack handler level and must never be bypassed:

1. **No `user_id` in `SurveyResponse`.** The resolved `user_id` from `ProjectMembership` is used only to update `SurveyParticipation` and to reply in the DM thread.
2. **No logging of Slack User IDs alongside response content.** Logs must not correlate `slack_user_id` with rating or comment text.
3. **No IP or device data.** The `@slack/bolt` SDK request context must never be used to extract IP addresses.
4. **Date-only `created_at`.** `SurveyResponse.created_at` stores the current date with no time component — preventing timing-based de-anonymization.
5. **n < 5 gate.** If a `SurveyCycle` has fewer than `ANONYMITY_THRESHOLD` responses, `AIAnalysis` records for that cycle must not be exposed via the dashboard API. Only `ThematicSummary` is returned.

---

## 12. Message Queue (BullMQ)

All outbound Slack DMs are sent through a **BullMQ** queue backed by Redis instead of being dispatched synchronously. This applies to both the weekly survey dispatch (§6) and feedback loop notifications (§9).

### Why a Queue

- **Rate limiting** — `concurrency: 1` on the processor naturally stays within Slack's Tier 3 limit (~1 req/s per workspace) without manual `sleep()` calls.
- **Automatic retries** — transient failures (network errors, Slack 503) are retried with exponential backoff. Users who already received a DM are not re-messaged.
- **Observability** — failed jobs remain in the queue and can be inspected; they are not silently lost.

### Job Types

| Job name           | Triggered by                    | Payload                                                       |
| :----------------- | :------------------------------ | :------------------------------------------------------------ |
| `send-survey-dm`   | Weekly cron dispatch (§6)       | `{ workspaceId, slackUserId, surveyParticipationId, blocks }` |
| `send-feedback-dm` | Feedback loop notification (§9) | `{ workspaceId, slackUserId, comment, riskActionId }`         |

### Queue Configuration

```typescript
// queue/slack-dm.queue.ts
BullModule.registerQueue({ name: 'slack-dm' })

// Job options applied at enqueue time
{
  attempts: 3,
  backoff: { type: 'exponential', delay: 5000 },
  removeOnComplete: true,
  removeOnFail: false, // keep failed jobs visible for inspection
}
```

### Processor

```typescript
// queue/slack-dm.processor.ts
@Processor('slack-dm', { concurrency: 1 })
export class SlackDmProcessor {
  @Process('send-survey-dm')
  async handleSurveyDm(job: Job<SendSurveyDmPayload>) {
    const token = await this.installationStore.getToken(job.data.workspaceId);
    await this.slack.chat.postMessage({
      token,
      channel: job.data.slackUserId,
      blocks: job.data.blocks,
    });
  }

  @Process('send-feedback-dm')
  async handleFeedbackDm(job: Job<SendFeedbackDmPayload>) {
    const token = await this.installationStore.getToken(job.data.workspaceId);
    await this.slack.chat.postMessage({
      token,
      channel: job.data.slackUserId,
      text: job.data.comment,
    });
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `Job ${job.name} [${job.id}] failed after ${job.attemptsMade} attempts`,
      error,
    );
  }
}
```

> **`concurrency: 1` is intentional.** It acts as a natural rate limiter — only one DM is sent at a time, keeping the overall throughput within Slack's limits across all workspaces sharing the queue.

---

## 13. Implementation Checklist

- [ ] Add `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET`, `SLACK_SIGNING_SECRET`, `SLACK_REDIRECT_URI`, `REDIS_URL` to `apps/api/.env.example`.
- [ ] Run Prisma migration to add the `SlackInstallation` table (see `docs/databaseStructure.md` §17).
- [ ] Add Redis as an infrastructure add-on (Render/Railway one-click).
- [ ] Install `@nestjs/bullmq` and `bullmq`; register `BullModule.forRoot()` with `REDIS_URL` in `AppModule`.
- [ ] Create `apps/api/src/modules/slack/slack.module.ts` — register Bolt `App` with HTTP receiver and custom `installationStore`.
- [ ] Implement `SlackInstallationStore` — reads/writes `SlackInstallation` records via Prisma; encrypts/decrypts `bot_token`.
- [ ] Implement `SlackOAuthController` — `GET /slack/oauth/install` (state generation + redirect) and `GET /slack/oauth/callback` (code exchange).
- [ ] Implement `SlackOAuthService` — `oauth.v2.access` call, `SlackInstallation` upsert, `Project.slack_workspace_id` update.
- [ ] Implement user auto-sync via `users.list` — match email → `ProjectMembership.slack_user_id`; expose as on-demand "Sync Users" endpoint.
- [ ] Add **"Connect Slack"** button to Project Settings page in `apps/web`.
- [ ] Implement `SlackDmProcessor` — `send-survey-dm` and `send-feedback-dm` handlers with `concurrency: 1`.
- [ ] Implement `survey.handler.ts` — rating action listener, comment submission, follow-up submission; enqueue DMs via `slack-dm` queue.
- [ ] Implement `notification.handler.ts` — enqueue feedback DMs via `slack-dm` queue.
- [ ] Integrate `@nestjs/schedule` cron job for survey dispatch (resolve `SurveyConfig` per project; enqueue `send-survey-dm` jobs).
- [ ] Wire AI #1 call (follow-up generator) into `survey.handler.ts` after `PARTIAL` save.
- [ ] Wire AI #2 call (feedback analyzer) into `survey.handler.ts` after `COMPLETE` save.
- [ ] Register `SlackModule` in `AppModule`.
