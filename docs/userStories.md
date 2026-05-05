# User Stories

This document outlines the functional requirements for HappyRisk AI from the perspective of different user roles: **Team Member**, **Team Leader (PM/SM)**, and **Administrator**.

---

## Epic 1: Feedback Collection (Slack Bot)

### US 1.1: Weekly Check-in

**As a** Team Member,  
**I want to** receive a proactive DM from the Slack bot on the configured project schedule (`WEEKLY` or `BIWEEKLY`),  
**so that** I can quickly rate my week (1-5) without leaving my workspace.

- **AC 1:** Bot triggers a Block Kit message with 1–5 rating buttons.
- **AC 2:** After selecting a rating, the bot replaces the buttons with a confirmation and an optional free-text comment field (Submit / Skip).
- **AC 3:** A `SurveyResponse` with `conversation_status: PARTIAL` is persisted after the user submits or skips the initial comment, preserving the rating even if the follow-up is never completed.
- **AC 4:** If the user clicks a rating button after the `SurveyCycle` has transitioned to `COMPLETED` (late click), no `SurveyResponse` is created, `SurveyParticipation.status` is not modified, and the original Block Kit message is replaced via `response_url` with a plain-text notice that the survey has closed.
- **AC 5:** Once a `SurveyResponse` exists for the user's `SurveyParticipation` in the current cycle, additional rating clicks in the same cycle are idempotent — the first response wins and no second record is created or mutated.

### US 1.2: AI Follow-up Conversation

**As a** Team Member,  
**I want to** be asked exactly one relevant follow-up question by the AI,  
**so that** I can provide context for my rating in a conversational way.

- **AC 1:** AI #1 generates one contextual follow-up question based on the rating and optional initial comment.
- **AC 2:** The total survey conversation is capped at three bot messages and two user responses (< 60 seconds total) to avoid survey fatigue.
- **AC 3:** `PARTIAL` responses (rating + optional comment, no follow-up) are preserved and their ratings are included in the Happiness Index calculation.
- **AC 4:** Once the `SurveyResponse` reaches `conversation_status: COMPLETE`, any further free-text messages the user sends in the DM are **not** stored and do **not** trigger AI calls. The bot replies at most once per `SurveyCycle` with a short notice that the survey is already saved; subsequent out-of-flow messages are silently ignored.

### US 1.3: Feedback Loop Notification

**As a** Team Member,  
**I want to** receive a notification when a manager takes action based on team feedback,  
**so that** I feel my input is valued and leads to real change.

- **AC 1:** Bot sends an anonymous DM to all project members when a risk is marked as `ADDRESSED` or `RESOLVED` with a non-empty comment.
- **AC 2:** The notification contains only the manager's comment — no personal attribution or identity information.
- **AC 3:** After dispatch, `RiskAction.notification_sent` is set to `true` to prevent duplicate notifications.

---

## Epic 2: AI Analysis & Risk Management

### US 2.1: Automatic Risk Identification

**As a** PM/SM,  
**I want to** have the system automatically identify project risks based on HI drops,  
**so that** I can catch issues before they impact the sprint delivery.

- **AC 1:** System triggers risk creation if HI < 2.5 or drops by >20%.
- **AC 2:** AI #2 categorizes the issue (e.g., Workload, Tooling).

### US 2.2: Risk Triage & Registry

**As a** PM/SM,  
**I want to** review "Pending" risks in a simple table,  
**so that** I can decide which ones to promote to the active Risk Registry.

- **AC 1:** Dashboard shows a table with: Name, Probability, Impact, and Status.
- **AC 2:** PM can edit or dismiss AI-generated risks.

---

## Epic 3: Dashboard & Benchmarking

### US 3.1: Visualizing Trends

**As a** PM/SM,  
**I want to** see a chart of my team’s Happiness Index over time,  
**so that** I can identify long-term patterns in team morale.

- **AC 1:** Line chart showing weekly HI averages.
- **AC 2:** Ability to filter by category (e.g., show HI for "Communication" only).

### US 3.2: Internal Benchmarking

**As a** PM/SM,  
**I want to** compare my team's HI against the company average,  
**so that** I can understand if a problem is team-specific or organizational.

- **AC 1:** Dashboard displays a "Company Avg" overlay on team charts.
- **AC 2:** Comparative metrics (e.g., "0.5 points below company average").

---

## Epic 4: Privacy & Anonymity

### US 4.1: Anonymity Protection

**As a** Team Member,  
**I want to** be certain that my specific answers are never linked to my identity,  
**so that** I can provide honest and critical feedback without fear.

- **AC 1:** Database schema separates user IDs from specific text comments.
- **AC 2:** Managers never see individual survey results, only aggregates.

### US 4.2: Small Team Privacy (n < 5)

**As a** PM of a small team,  
**I want to** see thematic summaries instead of raw data when the team size is below 5,  
**so that** I can still gain insights without compromising individual anonymity.

- **AC 1:** Raw comments are hidden if responses < 5.
- **AC 2:** AI #3 generates a 2-3 sentence thematic summary for the manager.

---

## Epic 5: Administration & Auth

### US 5.1: Create User Manually

**As an** Admin,  
**I want to** manually create a new user account by providing their email address,  
**so that** I can pre-register a user before their first login.

- **AC 1:** An admin panel provides a form to create a new `User` by entering an email and name.
- **AC 2:** The created user will be linked to an `OAuthAccount` automatically upon their first successful login with a matching email (as described in US 5.6).
- **AC 3:** User accounts created this way are required before a user can log in - login attempts without a pre-existing active account are rejected.

### US 5.2: View and List Users

**As an** Admin,  
**I want to** see a list of all users in the system,  
**so that** I can manage accounts and roles effectively.

- **AC 1:** The admin dashboard displays a table of users with their name, email, and status (Active/Deactivated).

### US 5.3: Update User Details

**As an** Admin,  
**I want to** edit a user's details, such as their name,  
**so that** I can keep user information up to date.

- **AC 1:** An admin can edit user's profile information through the user management panel.

### US 5.4: Deactivate User

**As an** Admin,  
**I want to** deactivate a user's account when they leave the company,  
**so that** they can no longer access the system while their historical data is preserved.

- **AC 1:** Deactivating a user prevents them from logging in.
- **AC 2:** A deactivated user's status is marked as 'Deactivated' in the user list.
- **AC 3:** All historical data contributed by the user remains in the system for data integrity.

### US 5.5: Global Role Management

**As an** Admin,  
**I want to** grant or revoke `ADMIN` privileges for any user,  
**so that** I can delegate administrative responsibilities.

- **AC 1:** A user management panel lists all users and their current global role.
- **AC 2:** An Admin can change a user's role from `USER` to `ADMIN` and vice-versa.

### US 5.6: User Provisioning and Account Linking

**As an** Administrator,  
**I want** the system to require pre-created user accounts before allowing login via Google OAuth,  
**so that** I maintain full control over who can access the system.

- **AC 1:** An Administrator must create a `User` record with an email before the user's first login (as described in US 5.1).
- **AC 2:** When a user attempts to log in via Google, the system searches for a `User` record matching their Google account email.
- **AC 3:** If a matching `User` is found and the `User.is_active` status is `true`, the `OAuthAccount` is linked to the existing `User` record and login proceeds successfully.
- **AC 4:** If no matching `User` is found, or if the matching `User` has `is_active = false`, the login attempt is rejected and the user is redirected with an appropriate error message.

### US 5.7: Secure Dashboard Login

**As a** PM/SM,  
**I want to** log in to the dashboard using my corporate Google account,  
**so that** I don't have to manage a separate password for this tool.

- **AC 1:** Implementation of Google OAuth via NestJS (API-First Auth).

### US 5.8: Create Team

**As an** Admin,
**I want to** create a new team,
**so that** I can structure the users for feedback aggregation.

- **AC 1:** An admin panel allows for creating a new team by providing a name.

### US 5.9: View and List Teams

**As an** Admin,
**I want to** see a list of all teams,
**so that** I can manage them effectively.

- **AC 1:** The admin dashboard displays a table of teams with their name and status (Active/Archived).

### US 5.10: Update Team Details

**As an** Admin,
**I want to** rename an existing team,
**so that** I can correct typos or reflect changes in team names.

- **AC 1:** An admin can edit the name of a team through the admin panel.

### US 5.11: Archive Team

**As an** Admin,
**I want to** archive a team,
**so that** historical data is preserved but the team is no longer active.

- **AC 1:** Archiving a team sets its status to 'Archived'.
- **AC 2:** Archived teams do not appear in active dashboards or user assignment lists.
- **AC 3:** All historical data related to the team remains intact.

### US 5.12: Manage Team Membership

**As an** Admin,
**I want to** assign and unassign users from teams,
**so that** feedback aggregation and benchmarking are accurate.

- **AC 1:** A user management interface shows a list of all users and allows assigning them to one or more teams.

### US 5.13: Create Project

**As an** Admin,
**I want to** create a new project,
**so that** I can initiate feedback cycles for specific initiatives.

- **AC 1:** An admin panel allows for creating a new project by providing a name.

### US 5.14: View and List Projects

**As an** Admin,
**I want to** see a list of all projects,
**so that** I can get an overview of all ongoing and past initiatives.

- **AC 1:** The admin dashboard displays a table of projects with their name and status (Active/Archived).

### US 5.15: Update Project Details

**As an** Admin,
**I want to** rename an existing project,
**so that** I can correct typos or reflect changes in project names.

- **AC 1:** An admin can edit the name of a project through the admin panel.

### US 5.16: Archive Project

**As an** Admin,
**I want to** archive a project once it is completed,
**so that** its historical data is preserved but it no longer clutters active views.

- **AC 1:** Archiving a project sets its status to 'Archived'.
- **AC 2:** Archived projects do not appear in active dashboards.
- **AC 3:** All historical data related to the project (feedback, risks) remains intact.

### US 5.17: Manage Project Membership and Roles

**As an** Admin or Project Leader,
**I want to** assign users to a project and define their roles (e.g., `LEADER`, `MEMBER`),
**so that** I can control access to project-specific data and delegate management.

- **AC 1:** A project settings page allows assigning/unassigning users to the project.
- **AC 2:** Users with the `LEADER` role can manage the roles of other project members.

### US 5.18: Survey Configuration

**As an** Admin,  
**I want to** configure the frequency and timing of surveys (Weekly/Bi-weekly) per project,  
**so that** I can adapt the tool to the specific needs of different departments.

- **AC 1:** Settings panel allows selecting the dispatch day (ISO weekday) and time (UTC `HH:MM`) for the Slack bot trigger per project.
- **AC 2:** An admin can enable or disable automated survey dispatch for a specific project (`SurveyConfig.is_active`).

---

## Epic 6: Slack Workspace Management

### US 6.1: Connect Slack Workspace to Project

**As an** Admin or Project Leader,  
**I want to** connect a Slack workspace to a project via OAuth,  
**so that** the bot can send survey DMs to all project members in that workspace.

- **AC 1:** A "Connect Slack" button on the Project Settings page initiates the standard Slack OAuth 2.0 app installation flow.
- **AC 2:** The OAuth flow uses a signed `state` parameter (CSRF protection) that encodes the `projectId`.
- **AC 3:** On successful installation, `SlackInstallation` is upserted (workspace ID, bot token, bot user ID) and linked one-to-one to the `Project`.
- **AC 4:** If the Slack workspace is already connected to a different project, the flow is rejected with a `409 Conflict` error and a user-facing message.
- **AC 5:** After a successful connection, the user is redirected back to Project Settings with a `?slackConnected=true` confirmation.

### US 6.2: Auto-Sync and On-Demand Sync of Slack Users

**As an** Admin or Project Leader,  
**I want to** have Slack workspace members automatically matched to project members by email,  
**so that** their `slack_user_id` is populated and they start receiving survey DMs without manual effort.

- **AC 1:** Immediately after a workspace is connected (US 6.1), the system calls `users.list` and attempts to match each Slack member's email to a `User.email` in the DB, updating `ProjectMembership.slack_user_id`.
- **AC 2:** A "Sync Users" button in Project Settings allows triggering the same sync on demand (e.g., for new workspace members added after initial installation).
- **AC 3:** Slack members with no matching `User.email` in the DB are skipped silently and can be linked manually (US 6.3).

### US 6.3: Manually Link Slack User to Project Member

**As an** Admin,  
**I want to** manually assign a Slack User ID to a project member,  
**so that** team members who could not be auto-matched by email can still participate in surveys.

- **AC 1:** The admin panel provides a way to set `ProjectMembership.slack_user_id` for any member of a project.
- **AC 2:** Once linked, the member is included in future survey dispatches for that project.
