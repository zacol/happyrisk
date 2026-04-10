---
trigger: always_on
---

# Privacy & Anonymity — Non-Negotiable Rules

This document defines hard constraints that protect the anonymity of survey respondents. These rules reflect core product requirements (GDPR compliance, anonymity-by-design) and must **never** be violated.

## The Anonymity Boundary

The schema enforces a physical separation of identity and content across two tables:

| Table                 | Stores                                             | Has `user_id`? |
| --------------------- | -------------------------------------------------- | -------------- |
| `SurveyParticipation` | **WHO** responded (participation tracking)         | ✅ Yes         |
| `SurveyResponse`      | **WHAT** was said (ratings, comments, AI analysis) | ❌ No          |

There is **intentionally no foreign key** between `SurveyParticipation` and `SurveyResponse`.

## Hard Rules

### 1. Never JOIN participation with responses

The following is permanently forbidden in any query, service, or API endpoint:

```typescript
// ❌ FORBIDDEN — This breaks the anonymity boundary
prisma.surveyParticipation.findMany({
  include: {
    /* any path that reaches SurveyResponse */
  },
});

// ❌ FORBIDDEN
prisma.surveyResponse.findMany({
  where: { userId: '...' }, // userId does not exist on this model — that's intentional
});
```

No code path may ever correlate a `SurveyParticipation` row with a `SurveyResponse` row.

### 2. The n < 5 Threshold

When a survey cycle has **fewer than 5 responses** for a project:

- Expose **only** the `ThematicSummary` record (AI-generated aggregate text).
- Do **not** expose raw `SurveyResponse` records, individual ratings, or comments.
- This threshold is defined as a constant in `packages/core/src/constants/` — always import it from there, never hardcode `5`.

```typescript
import { ANONYMITY_THRESHOLD } from '@happyrisk/core/constants';

if (responseCount < ANONYMITY_THRESHOLD) {
  // return ThematicSummary only
}
```

### 3. Date-Only Precision for Survey Timestamps

`SurveyResponse.created_at` stores **date-only** (no time component). This prevents timing-based de-anonymization (e.g., correlating a response to a specific person based on when they submitted).

- Never add time precision to this field.
- Never log or return response submission times in API responses.

### 4. No IP or Device Tracking

- Never log IP addresses anywhere in the application.
- Never store device identifiers, user agents, or fingerprinting data.
- Never add fields to the schema that could uniquely identify a respondent's device or network.

### 5. Slack User IDs Stay Out of Responses

- Slack User IDs are stored only in `ProjectMembership.slack_user_id` — used exclusively for bot interactions.
- Never store a Slack User ID in `SurveyResponse`, `AIAnalysis`, `ThematicSummary`, or any analytics table.

## Dashboard Query Rules

- Manager-facing API endpoints must enforce the n < 5 check **before** returning any response-level data.
- Aggregation queries (e.g., `HappinessSnapshot`, category breakdowns) are safe to expose because they are pre-calculated and anonymized.
- The `raw_json` field on `AIAnalysis` is for internal auditing only — never expose it in manager-facing API responses.

## Data Minimization

- When building new features, default to storing the **minimum** data needed.
- Before adding any new field that could reference a user or session, evaluate whether it breaks the anonymity boundary.
- If in doubt, consult `docs/databaseStructure.md` and the Anonymity Architecture section.
