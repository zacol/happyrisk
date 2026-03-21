# User Stories

This document outlines the functional requirements for HappyRisk AI from the perspective of different user roles: **Team Member**, **Team Leader (PM/SM)**, and **Administrator**.

---

## Epic 1: Feedback Collection (Slack Bot)

### US 1.1: Weekly Check-in
**As a** Team Member,  
**I want to** receive a proactive DM from the Slack bot once a week,  
**so that** I can quickly rate my week (1-5) without leaving my workspace.
* **AC 1:** Bot triggers a Block Kit message with 1-5 buttons.
* **AC 2:** Interaction is saved even if the user stops after the first click.

### US 1.2: AI Follow-up Conversation
**As a** Team Member,  
**I want to** be asked exactly one relevant follow-up question by the AI,  
**so that** I can provide context for my rating in a conversational way.
* **AC 1:** AI #1 generates a question based on the rating and initial comment.
* **AC 2:** The interaction is limited to one question to avoid survey fatigue.

### US 1.3: Feedback Loop Notification
**As a** Team Member,  
**I want to** receive a notification when a manager takes action based on team feedback,  
**so that** I feel my input is valued and leads to real change.
* **AC 1:** Bot sends an anonymous broadcast to the team when a risk is marked as "Resolved" with a comment.

---

## Epic 2: AI Analysis & Risk Management

### US 2.1: Automatic Risk Identification
**As a** PM/SM,  
**I want to** have the system automatically identify project risks based on HI drops,  
**so that** I can catch issues before they impact the sprint delivery.
* **AC 1:** System triggers risk creation if HI < 2.5 or drops by >20%.
* **AC 2:** AI #2 categorizes the issue (e.g., Workload, Tooling).

### US 2.2: Risk Triage & Registry
**As a** PM/SM,  
**I want to** review "Pending" risks in a simple table,  
**so that** I can decide which ones to promote to the active Risk Registry.
* **AC 1:** Dashboard shows a table with: Name, Probability, Impact, and Status.
* **AC 2:** PM can edit or dismiss AI-generated risks.

---

## Epic 3: Dashboard & Benchmarking

### US 3.1: Visualizing Trends
**As a** PM/SM,  
**I want to** see a chart of my team’s Happiness Index over time,  
**so that** I can identify long-term patterns in team morale.
* **AC 1:** Line chart showing weekly HI averages.
* **AC 2:** Ability to filter by category (e.g., show HI for "Communication" only).

### US 3.2: Internal Benchmarking
**As a** PM/SM,  
**I want to** compare my team's HI against the company average,  
**so that** I can understand if a problem is team-specific or organizational.
* **AC 1:** Dashboard displays a "Company Avg" overlay on team charts.
* **AC 2:** Comparative metrics (e.g., "0.5 points below company average").

---

## Epic 4: Privacy & Anonymity

### US 4.1: Anonymity Protection
**As a** Team Member,  
**I want to** be certain that my specific answers are never linked to my identity,  
**so that** I can provide honest and critical feedback without fear.
* **AC 1:** Database schema separates user IDs from specific text comments.
* **AC 2:** Managers never see individual survey results, only aggregates.

### US 4.2: Small Team Privacy (n < 5)
**As a** PM of a small team,  
**I want to** see thematic summaries instead of raw data when the team size is below 5,  
**so that** I can still gain insights without compromising individual anonymity.
* **AC 1:** Raw comments are hidden if responses < 5.
* **AC 2:** AI #3 generates a 2-3 sentence thematic summary for the manager.

---

## Epic 5: Administration & Auth

### US 5.1: Create User Manually
**As an** Admin,  
**I want to** manually create a new user account by providing their email address,  
**so that** I can pre-register a user before their first login.
* **AC 1:** An admin panel provides a form to create a new `User` by entering an email and name.
* **AC 2:** The created user will be linked to an `Account` automatically upon their first login with a matching email (as described in US 5.5).

### US 5.2: View and List Users
**As an** Admin,  
**I want to** see a list of all users in the system,  
**so that** I can manage accounts and roles effectively.
* **AC 1:** The admin dashboard displays a table of users with their name, email, and status (Active/Deactivated).

### US 5.3: Update User Details
**As an** Admin,  
**I want to** edit a user's details, such as their name,  
**so that** I can keep user information up to date.
* **AC 1:** An admin can edit user's profile information through the user management panel.

### US 5.4: Deactivate User
**As an** Admin,  
**I want to** deactivate a user's account when they leave the company,  
**so that** they can no longer access the system while their historical data is preserved.
* **AC 1:** Deactivating a user prevents them from logging in.
* **AC 2:** A deactivated user's status is marked as 'Deactivated' in the user list.
* **AC 3:** All historical data contributed by the user remains in the system for data integrity.

### US 5.5: Global Role Management
**As an** Admin,  
**I want to** grant or revoke `ADMIN` privileges for any user,  
**so that** I can delegate administrative responsibilities.
* **AC 1:** A user management panel lists all users and their current global role.
* **AC 2:** An Admin can change a user's role from `USER` to `ADMIN` and vice-versa.

### US 5.6: User Provisioning and Account Linking
**As an** Administrator or a new User,  
**I want** the system to correctly create and link user profiles during the login process,  
**so that** user access is managed seamlessly whether they are pre-registered or signing up for the first time.
* **AC 1:** An Administrator can create a `User` record with an email before the user's first login.
* **AC 2:** When a user logs in for the first time via Google, the system searches for a `User` record matching their Google account email.
* **AC 3:** If a matching `User` is found, the `Account` is linked to the existing `User` record.
* **AC 4:** If no matching `User` is found, a new `User` record is created and linked to the `Account`.

### US 5.7: Secure Dashboard Login
**As a** PM/SM,  
**I want to** log in to the dashboard using my corporate Google account,  
**so that** I don't have to manage a separate password for this tool.
* **AC 1:** Implementation of Google OAuth via NestJS (API-First Auth).

### US 5.8: Create Organization
**As an** Admin,  
**I want to** create a new organization,  
**so that** I can onboard a new company or department.
* **AC 1:** An admin panel allows for creating a new organization by providing a name.
* **AC 2:** The user creating the organization is automatically assigned as its first member with an `ADMIN` role.

### US 5.9: View and List Organizations
**As an** Admin,  
**I want to** see a list of all organizations in the system,  
**so that** I can get an overview of all active and archived entities.
* **AC 1:** The admin dashboard displays a table of organizations with their name and status (Active/Archived).

### US 5.10: Update Organization Details
**As an** Admin,  
**I want to** rename an existing organization,  
**so that** I can correct typos or reflect name changes.
* **AC 1:** An admin can edit the name of an organization through the admin panel.

### US 5.11: Archive Organization
**As an** Admin,  
**I want to** archive an organization,  
**so that** I can retain its data for historical purposes without it appearing in active lists.
* **AC 1:** Archiving an organization sets its status to 'Archived'.
* **AC 2:** Archived organizations do not appear in selection dropdowns for creating new teams or projects.
* **AC 3:** All data related to the organization (teams, projects, feedback) is preserved.

### US 5.12: Create Team
**As an** Admin,
**I want to** create a new team within an organization,
**so that** I can structure the users for feedback aggregation.
* **AC 1:** An admin panel allows for creating a new team by providing a name and associating it with an organization.

### US 5.13: View and List Teams
**As an** Admin,
**I want to** see a list of all teams within an organization,
**so that** I can manage them effectively.
* **AC 1:** The admin dashboard displays a table of teams with their name and status (Active/Archived).

### US 5.14: Update Team Details
**As an** Admin,
**I want to** rename an existing team,
**so that** I can correct typos or reflect changes in team names.
* **AC 1:** An admin can edit the name of a team through the admin panel.

### US 5.15: Archive Team
**As an** Admin,
**I want to** archive a team,
**so that** historical data is preserved but the team is no longer active.
* **AC 1:** Archiving a team sets its status to 'Archived'.
* **AC 2:** Archived teams do not appear in active dashboards or user assignment lists.
* **AC 3:** All historical data related to the team remains intact.

### US 5.16: Manage Team Membership
**As an** Admin,
**I want to** assign and unassign users from teams,
**so that** feedback aggregation and benchmarking are accurate.
* **AC 1:** A user management interface shows a list of all users and allows assigning them to one or more teams.

### US 5.17: Create Project
**As an** Admin,
**I want to** create a new project within an organization,
**so that** I can initiate feedback cycles for specific initiatives.
* **AC 1:** An admin panel allows for creating a new project by providing a name and linking it to an organization.

### US 5.18: View and List Projects
**As an** Admin,
**I want to** see a list of all projects within an organization,
**so that** I can get an overview of all ongoing and past initiatives.
* **AC 1:** The admin dashboard displays a table of projects with their name, associated organization, and status (Active/Archived).

### US 5.19: Update Project Details
**As an** Admin,
**I want to** rename an existing project,
**so that** I can correct typos or reflect changes in project names.
* **AC 1:** An admin can edit the name of a project through the admin panel.

### US 5.20: Archive Project
**As an** Admin,
**I want to** archive a project once it is completed,
**so that** its historical data is preserved but it no longer clutters active views.
* **AC 1:** Archiving a project sets its status to 'Archived'.
* **AC 2:** Archived projects do not appear in active dashboards.
* **AC 3:** All historical data related to the project (feedback, risks) remains intact.

### US 5.21: Manage Project Membership and Roles
**As an** Admin or Project Leader,
**I want to** assign users to a project and define their roles (e.g., `LEADER`, `MEMBER`),
**so that** I can control access to project-specific data and delegate management.
* **AC 1:** A project settings page allows assigning/unassigning users to the project.
* **AC 2:** Users with the `LEADER` role can manage the roles of other project members.

### US 5.22: Survey Configuration
**As an** Admin,  
**I want to** configure the frequency and timing of surveys (Weekly/Bi-weekly),  
**so that** I can adapt the tool to the specific needs of different departments.
* **AC 1:** Settings panel to choose day/time for the Slack bot trigger.