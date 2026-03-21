# Database Structure

This document defines the PostgreSQL database schema, managed via **Prisma ORM** (`apps/api/prisma/schema.prisma`).

The schema is designed around two core principles:
1. **Anonymity by Design** — `user_id` is never stored alongside survey text content. Participation tracking and anonymous responses are kept in separate, unlinked tables.
2. **Relational Hierarchy** — `Organization > Team > User` enables aggregation and benchmarking at every level.

---

## Entity Relationship Overview

```
Organization 1──* Team 1──* TeamMembership *──1 User
             │
             └──* Project 1──* ProjectMembership *──1 User
                      │
                      ├──* SurveyCycle 1──* SurveyResponse (anonymous)
                      │         │                  │
                      │         │                  └──1 AIAnalysis
                      │         │
                      │         ├──* SurveyParticipation (user_id)
                      │         │
                      │         └──* ThematicSummary (n < 5)
                      │
                      ├──* Risk 1──* RiskAction
                      │
                      ├──* SurveyConfig
                      │
                      └──* HappinessSnapshot (weekly aggregates)

User 1──* OAuthAccount
```

---

## Tables

### 1. `Organization`

Top-level entity representing a company or business unit.

| Column       | Type         | Constraints          | Description                        |
| :----------- | :----------- | :------------------- | :--------------------------------- |
| `id`         | `UUID`       | PK, default `uuid()` | Unique identifier.                 |
| `name`       | `VARCHAR(255)` | NOT NULL, UNIQUE   | Organization name.                 |
| `is_active`  | `BOOLEAN`      | NOT NULL, default `true`   | Whether the organization is active. |
| `created_at` | `TIMESTAMPTZ`  | NOT NULL, default `now()` | Record creation timestamp.    |
| `updated_at` | `TIMESTAMPTZ`  | NOT NULL, `@updatedAt`    | Last update timestamp.        |

---

### 2. `Team`

A team within an organization (e.g., "Backend Squad", "Mobile QA").

| Column             | Type           | Constraints                    | Description                                            |
| :----------------- | :------------- | :----------------------------- | :----------------------------------------------------- |
| `id`               | `UUID`         | PK, default `uuid()`          | Unique identifier.                                     |
| `organization_id`  | `UUID`         | FK → `Organization.id`, NOT NULL | Parent organization.                                |
| `name`             | `VARCHAR(255)` | NOT NULL                       | Team display name.                                     |
| `department_segment` | `VARCHAR(100)` | NULLABLE                     | Segment tag for benchmarking (e.g., "Backend", "Frontend", "QA"). |
| `is_active`        | `BOOLEAN`      | NOT NULL, default `true`       | Whether the team is active.                            |
| `created_at`       | `TIMESTAMPTZ`    | NOT NULL, default `now()`      | Record creation timestamp.                             |
| `updated_at`       | `TIMESTAMPTZ`    | NOT NULL, `@updatedAt`         | Last update timestamp.                                 |

**Indexes:** `organization_id`

---

### 3. `Project`

A cross-functional project or initiative within an organization.

| Column       | Type         | Constraints                  | Description                                      |
| :----------- | :----------- | :--------------------------- | :----------------------------------------------- |
| `id`         | `UUID`       | PK, default `uuid()`        | Unique identifier.                               |
| `organization_id` | `UUID`    | FK → `Organization.id`, NOT NULL | The organization that owns this project.         |
| `name`       | `VARCHAR(255)` | NOT NULL                     | Project display name.                            |
| `slack_workspace_id` | `VARCHAR(64)` | NULLABLE, UNIQUE | Slack workspace ID for project-specific communication. |
| `is_active`  | `BOOLEAN`    | NOT NULL, default `true`     | Whether the project is currently active.         |
| `created_at` | `TIMESTAMPTZ`  | NOT NULL, default `now()`    | Record creation timestamp.                       |
| `updated_at` | `TIMESTAMPTZ`  | NOT NULL, `@updatedAt`       | Last update timestamp.                           |

**Indexes:** `organization_id`

---

### 4. `User`

Any person using the platform. Role determines access level.

| Column           | Type           | Constraints                    | Description                                          |
| :--------------- | :------------- | :----------------------------- | :--------------------------------------------------- |
| `id`             | `UUID`         | PK, default `uuid()`          | Unique identifier.                                   |
| `email`          | `VARCHAR(255)` | NOT NULL, UNIQUE               | Corporate email (used for Google OAuth matching).     |
| `name`           | `VARCHAR(255)` | NULLABLE                       | Display name.                                        |
| `image`          | `TEXT`         | NULLABLE                       | Avatar URL (from Google profile).                    |
| `role`           | `ENUM`         | NOT NULL, default `USER`        | Global role: `USER` or `ADMIN`.                     |
| `is_active`      | `BOOLEAN`      | NOT NULL, default `true`       | Whether the user account is active.                  |
| `created_at`     | `TIMESTAMPTZ`    | NOT NULL, default `now()`      | Record creation timestamp.                           |
| `updated_at`     | `TIMESTAMPTZ`    | NOT NULL, `@updatedAt`         | Last update timestamp.                               |

**Indexes:** `email`

---

### 5. `TeamMembership`

Join table linking users to teams with a team-level role.

| Column      | Type        | Constraints                         | Description                               |
| :---------- | :---------- | :---------------------------------- | :---------------------------------------- |
| `id`        | `UUID`      | PK, default `uuid()`               | Unique identifier.                        |
| `user_id`   | `UUID`      | FK → `User.id`, NOT NULL           | The member.                               |
| `team_id`   | `UUID`      | FK → `Team.id`, NOT NULL           | The team.                                 |
| `joined_at` | `TIMESTAMPTZ` | NOT NULL, default `now()`           | When the user joined the team.            |

**Constraints:** UNIQUE(`user_id`, `team_id`)
**Indexes:** `team_id`

---

### 6. `ProjectMembership`

Join table linking users to specific projects they are working on.

| Column      | Type        | Constraints                         | Description                               |
| :---------- | :---------- | :---------------------------------- | :---------------------------------------- |
| `id`        | `UUID`      | PK, default `uuid()`               | Unique identifier.                        |
| `user_id`   | `UUID`      | FK → `User.id`, NOT NULL           | The member.                               |
| `project_id`| `UUID`      | FK → `Project.id`, NOT NULL        | The project.                              |
| `slack_user_id`  | `VARCHAR(64)`  | NULLABLE               | Slack member ID for bot interactions in this project's workspace. |
| `project_role` | `ENUM`   | NOT NULL, default `MEMBER`       | Role within the project: `MEMBER`, `LEADER`.   |
| `assigned_at` | `TIMESTAMPTZ` | NOT NULL, default `now()`           | When the user was assigned to the project. |

**Constraints:** `UNIQUE(user_id, project_id)`, `UNIQUE(project_id, slack_user_id)`
**Indexes:** `project_id`

---

### 7. `SurveyConfig`

Configurable survey schedule per project (US 5.2).

| Column        | Type          | Constraints                    | Description                                          |
| :------------ | :------------ | :----------------------------- | :--------------------------------------------------- |
| `id`          | `UUID`        | PK, default `uuid()`          | Unique identifier.                                   |
| `project_id`  | `UUID`        | FK → `Project.id`, NOT NULL, UNIQUE | One config per project.                           |
| `frequency`   | `ENUM`        | NOT NULL, default `WEEKLY`     | `WEEKLY` or `BIWEEKLY`.                              |
| `day_of_week` | `SMALLINT`    | NOT NULL, default `5`          | ISO day (1=Mon, 7=Sun). Default: Friday.             |
| `time_utc`    | `TIME`        | NOT NULL, default `'14:00'`    | Time to send the DM (UTC).                           |
| `is_active`   | `BOOLEAN`     | NOT NULL, default `true`       | Enable/disable surveys for this project.                |
| `updated_at`  | `TIMESTAMPTZ`   | NOT NULL, `@updatedAt`         | Last update timestamp.                               |

---

### 8. `SurveyCycle`

Represents a single survey period (e.g., "Week of 2026-03-16") for a project.

| Column      | Type        | Constraints                    | Description                                    |
| :---------- | :---------- | :----------------------------- | :--------------------------------------------- |
| `id`        | `UUID`      | PK, default `uuid()`          | Unique identifier.                             |
| `project_id`| `UUID`      | FK → `Project.id`, NOT NULL   | The project this cycle belongs to.             |
| `period_start` | `DATE`   | NOT NULL                       | Start date of the survey period.               |
| `period_end`   | `DATE`   | NOT NULL                       | End date of the survey period.                 |
| `status`    | `ENUM`      | NOT NULL, default `ACTIVE`     | `ACTIVE`, `COMPLETED`.                         |
| `created_at`| `TIMESTAMPTZ` | NOT NULL, default `now()`      | Record creation timestamp.                     |

**Indexes:** `project_id`, (`project_id`, `period_start`)

---

### 9. `SurveyParticipation` ⚠️ Anonymity Boundary

Tracks **who** was invited and whether they responded — but stores **no content**. This table exists solely for calculating response rates (KPI #1: >80%).

| Column            | Type        | Constraints                          | Description                                          |
| :---------------- | :---------- | :----------------------------------- | :--------------------------------------------------- |
| `id`              | `UUID`      | PK, default `uuid()`                | Unique identifier.                                   |
| `user_id`         | `UUID`      | FK → `User.id`, NOT NULL            | The invited team member.                             |
| `survey_cycle_id` | `UUID`      | FK → `SurveyCycle.id`, NOT NULL     | The cycle this participation belongs to.             |
| `status`          | `ENUM`      | NOT NULL, default `PENDING`          | `PENDING`, `SENT`, `RESPONDED`, `EXPIRED`.           |
| `sent_at`         | `TIMESTAMPTZ` | NULLABLE                             | When the DM was sent.                                |
| `responded_at`    | `TIMESTAMPTZ` | NULLABLE                             | When the user completed the interaction.             |

**Constraints:** UNIQUE(`user_id`, `survey_cycle_id`)
**Indexes:** `survey_cycle_id`

> **Privacy Note:** This table intentionally contains **NO** rating, comment, or analysis data. There is no foreign key linking a `SurveyParticipation` row to a `SurveyResponse` row.

---

### 10. `SurveyResponse` ⚠️ Anonymity Boundary

Stores the **anonymous content** of a survey interaction. Contains **no `user_id`**.

| Column              | Type        | Constraints                      | Description                                         |
| :------------------ | :---------- | :------------------------------- | :-------------------------------------------------- |
| `id`                | `UUID`      | PK, default `uuid()`            | Unique identifier.                                  |
| `survey_cycle_id`   | `UUID`      | FK → `SurveyCycle.id`, NOT NULL | The cycle this response belongs to.                 |
| `project_id`        | `UUID`      | FK → `Project.id`, NOT NULL     | Denormalized for efficient aggregation queries.     |
| `rating`            | `SMALLINT`  | NOT NULL, CHECK 1–5             | Happiness Index score.                              |
| `initial_comment`   | `TEXT`      | NULLABLE                         | User's first text after rating.                     |
| `follow_up_question`| `TEXT`      | NULLABLE                         | AI #1 generated question.                           |
| `follow_up_answer`  | `TEXT`      | NULLABLE                         | User's answer to the follow-up.                     |
| `conversation_status` | `ENUM`   | NOT NULL, default `PARTIAL`      | `PARTIAL` (only rating), `COMPLETE` (full convo).   |
| `created_at`        | `DATE`      | NOT NULL, default `now()`       | Record creation timestamp (date only, no time — GDPR). |

**Indexes:** `survey_cycle_id`, `project_id`, (`project_id`, `created_at`)

> **Privacy Note:** `created_at` should use **date-level precision** (not exact second) to prevent de-anonymization by timestamp correlation. No IP addresses are stored.

---

### 11. `AIAnalysis`

Structured output from AI #2 (Feedback Analyzer), linked to an anonymous response.

| Column              | Type          | Constraints                          | Description                                          |
| :------------------ | :------------ | :----------------------------------- | :--------------------------------------------------- |
| `id`                | `UUID`        | PK, default `uuid()`                | Unique identifier.                                   |
| `survey_response_id`| `UUID`        | FK → `SurveyResponse.id`, NOT NULL, UNIQUE | One analysis per response.                    |
| `sentiment`         | `ENUM`        | NOT NULL                             | `POSITIVE`, `NEUTRAL`, `NEGATIVE`.                   |
| `category`          | `ENUM`        | NOT NULL                             | `WORKLOAD`, `COMMUNICATION`, `MANAGEMENT`, `MEETINGS`, `PRIORITIES`, `TOOLING`, `TEAM_ATMOSPHERE`. |
| `core_issue`        | `VARCHAR(100)`| NOT NULL                             | Max 10-word summary of the issue.                    |
| `is_project_risk`   | `BOOLEAN`     | NOT NULL, default `false`            | Whether AI flagged this as a project risk.            |
| `risk_justification`| `TEXT`        | NULLABLE                             | AI reasoning for risk classification.                |
| `suggestion`        | `TEXT`        | NULLABLE                             | AI-generated action suggestion for the manager.      |
| `raw_json`          | `JSONB`       | NULLABLE                             | Full raw AI response for auditing.                   |
| `created_at`        | `TIMESTAMPTZ`   | NOT NULL, default `now()`            | Record creation timestamp.                           |

**Indexes:** `sentiment`, `category`, (`category`, `sentiment`)

---

### 12. `Risk`

Risk Registry entries — either AI-generated or manually created by a Leader (US 2.1, US 2.2).

| Column           | Type           | Constraints                      | Description                                           |
| :--------------- | :------------- | :------------------------------- | :---------------------------------------------------- |
| `id`             | `UUID`         | PK, default `uuid()`            | Unique identifier.                                    |
| `project_id`     | `UUID`         | FK → `Project.id`, NOT NULL     | The affected project.                                 |
| `title`          | `VARCHAR(255)` | NOT NULL                         | Risk name/title.                                      |
| `description`    | `TEXT`         | NULLABLE                         | Detailed description of the risk.                     |
| `category`       | `ENUM`         | NOT NULL                         | Same enum as `AIAnalysis.category`.                   |
| `probability`    | `ENUM`         | NOT NULL, default `MEDIUM`       | `LOW`, `MEDIUM`, `HIGH`.                              |
| `impact`         | `ENUM`         | NOT NULL, default `MEDIUM`       | `LOW`, `MEDIUM`, `HIGH`.                              |
| `status`         | `ENUM`         | NOT NULL, default `PENDING`      | `PENDING`, `ACTIVE`, `MITIGATED`, `RESOLVED`, `DISMISSED`. |
| `source`         | `ENUM`         | NOT NULL, default `AI_GENERATED` | `AI_GENERATED`, `MANUAL`.                             |
| `trigger_type`   | `ENUM`         | NULLABLE                         | `HI_BELOW_THRESHOLD`, `HI_DROP_20_PERCENT`. Null if manual. |
| `ai_analysis_id` | `UUID`         | FK → `AIAnalysis.id`, NULLABLE, UNIQUE | Link to the source analysis (if AI-generated). |
| `created_by_id`  | `UUID`         | FK → `User.id`, NULLABLE        | User who created a manual risk.                       |
| `created_at`     | `TIMESTAMPTZ`    | NOT NULL, default `now()`        | Record creation timestamp.                            |
| `updated_at`     | `TIMESTAMPTZ`    | NOT NULL, `@updatedAt`           | Last update timestamp.                                |

**Indexes:** `project_id`, `status`, (`project_id`, `status`)

---

### 13. `RiskAction`

Tracks manager actions on risks, powering the Feedback Loop (US 1.3, Feature D).

| Column              | Type        | Constraints                      | Description                                           |
| :------------------ | :---------- | :------------------------------- | :---------------------------------------------------- |
| `id`                | `UUID`      | PK, default `uuid()`            | Unique identifier.                                    |
| `risk_id`           | `UUID`      | FK → `Risk.id`, NOT NULL        | The related risk.                                     |
| `performed_by_id`   | `UUID`      | FK → `User.id`, NOT NULL        | The manager who took the action.                      |
| `action_type`       | `ENUM`      | NOT NULL                         | `REVIEWED`, `ADDRESSED`, `DISMISSED`.                 |
| `comment`           | `TEXT`      | NULLABLE                         | Brief description of what was done (e.g., "New IDE licenses purchased"). |
| `notification_sent` | `BOOLEAN`   | NOT NULL, default `false`        | Whether the Feedback Loop notification was sent to the team. |
| `created_at`        | `TIMESTAMPTZ` | NOT NULL, default `now()`        | Record creation timestamp.                            |

**Indexes:** `risk_id`

---

### 14. `ThematicSummary`

AI #3 generated summaries for small teams (n < 5) to protect anonymity (US 4.2).

| Column            | Type        | Constraints                      | Description                                           |
| :---------------- | :---------- | :------------------------------- | :---------------------------------------------------- |
| `id`              | `UUID`      | PK, default `uuid()`            | Unique identifier.                                    |
| `project_id`      | `UUID`      | FK → `Project.id`, NOT NULL     | The project with a small response group.              |
| `survey_cycle_id` | `UUID`      | FK → `SurveyCycle.id`, NOT NULL | The survey cycle summarized.                          |
| `summary_text`    | `TEXT`      | NOT NULL                         | AI-generated 2-3 sentence thematic summary.           |
| `response_count`  | `SMALLINT`  | NOT NULL                         | Number of responses aggregated (always < 5).          |
| `generated_at`    | `TIMESTAMPTZ` | NOT NULL, default `now()`        | When the summary was generated.                       |

**Constraints:** UNIQUE(`project_id`, `survey_cycle_id`)

---

### 15. `HappinessSnapshot`

Pre-calculated weekly aggregates for dashboard charts and benchmarking (US 3.1, US 3.2).

| Column            | Type          | Constraints                        | Description                                        |
| :---------------- | :------------ | :--------------------------------- | :------------------------------------------------- |
| `id`              | `UUID`        | PK, default `uuid()`              | Unique identifier.                                 |
| `project_id`      | `UUID`        | FK → `Project.id`, NOT NULL       | The project.                                       |
| `survey_cycle_id` | `UUID`        | FK → `SurveyCycle.id`, NOT NULL   | The cycle.                                         |
| `average_rating`  | `DECIMAL(3,2)`| NOT NULL                           | Avg HI for the period (e.g., `3.75`).             |
| `response_count`  | `SMALLINT`    | NOT NULL                           | Number of responses in the period.                 |
| `response_rate`   | `DECIMAL(5,2)`| NOT NULL                           | Percentage of team members who responded.          |
| `category_breakdown` | `JSONB`    | NULLABLE                           | Aggregated sentiment/category counts (e.g., `{"workload": {"negative": 3}}`). |
| `created_at`      | `TIMESTAMPTZ`   | NOT NULL, default `now()`          | Record creation timestamp.                         |

**Constraints:** UNIQUE(`project_id`, `survey_cycle_id`)
**Indexes:** `project_id`, (`project_id`, `created_at`)

---

### 16. `OAuthAccount`

Managed by the NestJS backend to link third-party identities (e.g., Google OAuth) to internal users.

| Column              | Type          | Constraints                        | Description                              |
| :------------------ | :------------ | :--------------------------------- | :--------------------------------------- |
| `id`                | `UUID`        | PK, default `uuid()`               | Unique identifier.                       |
| `user_id`           | `UUID`        | FK → `User.id`, NOT NULL           | The internal user.                       |
| `provider`          | `VARCHAR`     | NOT NULL                           | e.g., `google`.                          |
| `provider_account_id` | `VARCHAR`   | NOT NULL                           | Unique account ID from the provider.     |
| `created_at`        | `TIMESTAMPTZ` | NOT NULL, default `now()`          | Record creation timestamp.               |
| `updated_at`        | `TIMESTAMPTZ` | NOT NULL, `@updatedAt`             | Last update timestamp.                   |

**Constraints:** `UNIQUE(provider, provider_account_id)`
**Indexes:** `user_id`

---

### 17. `RefreshToken`

Stores hashed refresh tokens for session rotation and validation.

| Column              | Type          | Constraints                        | Description                              |
| :------------------ | :------------ | :--------------------------------- | :--------------------------------------- |
| `id`                | `UUID`        | PK, default `uuid()`               | Unique identifier.                       |
| `user_id`           | `UUID`        | FK → `User.id`, NOT NULL           | The user owning the session.             |
| `hashed_token`      | `TEXT`        | NOT NULL, UNIQUE                   | Bcrypt/Argon2 hash of the refresh token. |
| `expires_at`        | `TIMESTAMPTZ` | NOT NULL                           | When the token expires.                  |
| `revoked`           | `BOOLEAN`     | NOT NULL, default `false`          | True if revoked early (e.g. logout).     |
| `created_at`        | `TIMESTAMPTZ` | NOT NULL, default `now()`          | Record creation timestamp.               |

**Indexes:** `user_id`, `hashed_token`

---

## Enums

```prisma
enum UserRole {
  USER
  ADMIN
}


enum ProjectRole {
  MEMBER
  LEADER
}

enum SurveyFrequency {
  WEEKLY
  BIWEEKLY
}

enum SurveyCycleStatus {
  ACTIVE
  COMPLETED
}

enum ParticipationStatus {
  PENDING
  SENT
  RESPONDED
  EXPIRED
}

enum ConversationStatus {
  PARTIAL
  COMPLETE
}

enum Sentiment {
  POSITIVE
  NEUTRAL
  NEGATIVE
}

enum FeedbackCategory {
  WORKLOAD
  COMMUNICATION
  MANAGEMENT
  MEETINGS
  PRIORITIES
  TOOLING
  TEAM_ATMOSPHERE
}

enum RiskProbability {
  LOW
  MEDIUM
  HIGH
}

enum RiskImpact {
  LOW
  MEDIUM
  HIGH
}

enum RiskStatus {
  PENDING
  ACTIVE
  MITIGATED
  RESOLVED
  DISMISSED
}

enum RiskSource {
  AI_GENERATED
  MANUAL
}

enum RiskTriggerType {
  HI_BELOW_THRESHOLD
  HI_DROP_20_PERCENT
}

enum RiskActionType {
  REVIEWED
  ADDRESSED
  DISMISSED
}
```

---

## Anonymity Architecture

The core privacy mechanism relies on a **physical separation** of identity and content:

```
┌─────────────────────────┐          ┌─────────────────────────┐
│   SurveyParticipation   │          │     SurveyResponse      │
│─────────────────────────│          │─────────────────────────│
│ ✅ user_id              │   NO FK  │ ❌ user_id              │
│ ✅ status (responded?)  │◄────────►│ ✅ rating               │
│ ❌ rating               │          │ ✅ comments             │
│ ❌ comments             │          │ ✅ AI analysis          │
└─────────────────────────┘          └─────────────────────────┘
       "WHO responded"                   "WHAT was said"
```

**Key rules enforced at the application level:**
1. No JOIN between `SurveyParticipation` and `SurveyResponse` is ever permitted in dashboard queries.
2. For projects with fewer than 5 responses in a cycle, only `ThematicSummary` is exposed — raw `SurveyResponse` data is hidden.
3. `SurveyResponse.created_at` uses date-level precision (no exact timestamps) to prevent timing-based de-anonymization.
4. No IP addresses or device identifiers are logged anywhere in the schema.
