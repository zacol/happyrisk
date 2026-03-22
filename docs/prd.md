# Product Requirements Document (PRD)

**Purpose:** A tool to integrate team well-being (Happiness Index) with hard risk management in the IT/R&D sector.

## 1. Problem & Business Goal

- **Problem:** Traditional surveys are often ignored, lack context ("why 3/5?"), and manual analysis is costly and slow. Sentiment data rarely translates into actionable business insights.
- **Goal:** Increase employee retention and project stability by establishing an **Early Warning System** using conversational AI on Slack.

## 2. Target Personas

- **Team Member (Dev/QA/Designer):** Wants to report issues quickly and anonymously, feeling that their voice leads to actual change.
- **Leader (PM/SM/EM):** Wants to see trends, compare their team against company benchmarks, and receive a curated list of project risks.
- **Admin/HR:** Wants to manage team structures and monitor the overall company "climate."

## 3. Key Features (Scope)

### A. Conversational Slack Bot (The Collector)

- **Interaction:** Once a week (configurable), the bot sends a DM asking for a week rating (1–5).
- **AI Follow-up:** After the rating, the bot asks **exactly one** follow-up question (AI #1) based on the score and project context.
- **User Experience:** Entire interaction takes < 60 seconds. Support for interrupted conversations (partial save).

### B. AI Analysis & Triage (The Intelligence)

- **Categorization:** Automatically classifies feedback (Workload, Communication, Management, Meetings, Priorities, Tooling, Team atmosphere).
- **Sentiment Analysis:** Evaluates the emotional tone (Positive / Neutral / Negative).
- **Automatic Risk Registry:** If the Happiness Index (HI) drops by >20% or falls below 2.5, the AI evaluates business relevance and creates a "Pending" entry in the Risk Registry.

### C. Dashboard & Benchmarking (The Insights)

- **Manager View:** Risk table, HI trends over time, and aggregated feedback insights.
- **Benchmarking:** Compare team results against:
  - Company average (Internal Benchmark).
  - Historical team performance (Trend Analysis).
  - Similar departments (Segment Benchmark, e.g., Backend vs. Frontend).

### D. Feedback Loop System

- **Action Status:** Managers can mark risks/feedback as "Addressed" with a brief comment.
- **Closing the Loop:** The bot sends an anonymous notification to the team about actions taken (e.g., "New IDE licenses purchased").

## 4. Privacy & Security

| Feature               | Description                                                                                                                  |
| :-------------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| **Anonymity**         | No link between `user_id` and specific responses in the manager's view.                                                      |
| **n < 5 Threshold**   | In small teams, only thematic aggregates and a descriptive "Climate Index" are shown instead of raw scores or direct quotes. |
| **Thematic Grouping** | AI summarizes responses from small groups to remove unique writing styles (idiosyncrasies).                                  |
| **Compliance**        | Full GDPR compliance (no IP logging, no timestamps that allow for de-anonymization).                                         |

## 5. Technical Architecture

- **Frontend:** Next.js 16+ (App Router), Shadcn/UI, Tailwind CSS.
- **Backend:** NestJS (Persistent Server) – handling Slack events via Bolt SDK.
- **Database:** PostgreSQL + Prisma ORM.
- **AI Engine:** OpenAI GPT-4o-mini (latency < 2s).
- **Monorepo:** Turborepo (pnpm).

## 6. Success Metrics (KPIs)

1. **Response Rate:** Target > 80% of active users per week.
2. **Action Rate:** % of AI-identified risks that are reviewed or addressed by a PM.
3. **Retention:** Weekly user retention (WAU/MAU) for the feedback loop.

## 7. Roadmap

- **Phase 1 (MVP):** Basic Slack bot (HI 1-5), sentiment and category analysis, basic dashboard with trends.
- **Phase 2 (Risk & Privacy):** Automatic Risk Registry with Triage layer, n < 5 anonymity threshold, Feedback Loop system.
- **Phase 3 (Enterprise):** Advanced benchmarks (Team vs. Company), AI-generated action recommendations.

## 8. Example Interaction Scenarios (User Flow)

### Scenario A: Risk Detection (Low Score)

> **Bot:** How would you rate your week on a scale of 1–5?  
> **User:** `2`  
> **Bot (AI):** I'm sorry to hear that. What influenced this rating the most?  
> **User:** Task chaos, it's impossible to know what the priority is.  
> **Bot (AI - Follow-up):** Does this lack of priority stem from sudden "ASAP" requests, or rather from a lack of clear decisions during sprint planning?  
> **User:** Definitely the "ASAP" requests from the business side mid-week.  
> **Bot:** Thanks for the honesty! 🙌 Your feedback (anonymous) will help us get this sorted.

### Scenario B: Process Improvement (Neutral Score)

> **Bot:** How would you rate your week on a scale of 1–5?  
> **User:** `3`  
> **Bot (AI):** A steady three. What kept it from being higher?  
> **User:** We spent half our time in meetings that led nowhere.  
> **Bot (AI - Follow-up):** If you could shorten or remove one specific meeting from your calendar, which would it be?  
> **User:** The 45-minute Dailies are definitely overkill; we're losing energy there.  
> **Bot:** Understood, thanks for the specific feedback! 🙌

### Scenario C: Success Validation (High Score)

> **Bot:** How would you rate your week on a scale of 1–5?  
> **User:** `5`  
> **Bot (AI):** Great to hear! What made this week so successful?  
> **User:** Great team atmosphere and we finally shipped that difficult API module bug-free.  
> **Bot (AI - Follow-up):** Was there a specific part of the process (e.g., code review, tooling) that helped you maintain such high quality?  
> **User:** Yes, pair programming on the trickiest parts worked wonders.  
> **Bot:** Awesome, glad that worked out! Thanks for the feedback 🙌
