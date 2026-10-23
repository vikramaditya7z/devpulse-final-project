# DevPulse — Project Specification & Product Definition

**Project Name:** DevPulse  
**Tagline:** GitHub Project Health & Collaboration Platform  
**Target Delivery Date:** October 27, 2026  
**Context:** University End-Term Software Engineering Capstone Project  
**Current Status:** Preparation Phase (Foundation & Architecture Setup)

---

## 1. Executive Summary & Problem Statement

Small developer teams and student software engineering groups collaborating on GitHub frequently encounter bottlenecks that impede project progress:
- Pull requests linger unreviewed or unmerged for weeks without clear ownership or visibility.
- Issues grow stale or are abandoned without triage.
- Team members lack a unified, lightweight dashboard to view collective repository momentum and collaboration health.
- Existing software analytics platforms (e.g., enterprise engineering intelligence tools) are either costly, overly complex to configure, or require invasive full-organization administrative permissions.

**DevPulse** solves this problem by providing an explainable, lightweight, and collaborative repository health platform. It allows developers and student teams to connect public GitHub repositories, calculate deterministic health metrics, flag collaboration bottlenecks with clear evidentiary context, and collaborate across team workspaces with role-based access control.

---

## 2. Target Audience

1. **Student Capstone & Course Project Teams:** Multi-student project groups collaborating under deadlines needing visibility into repository progress and member contributions.
2. **Small Software Engineering Teams:** Early-stage startups and small engineering squads who need quick, zero-friction insights into pull request review cycles and issue hygiene.
3. **Open-Source Collaborators & Maintainers:** Small project maintainers wanting to evaluate repository health and detect stale issues and unreviewed PRs without heavy tooling.

---

## 3. Core User Workflows

### Workflow 1: Authentication & Account Management
1. User registers with email, full name, and password.
2. User logs in, receives a secure session/token, and lands on their Personal Dashboard.
3. User can securely log out, invalidating their session.

### Workflow 2: Personal Repository Health Analysis
1. User inputs a public GitHub repository identifier (e.g., `owner/repo` or full GitHub URL).
2. The system fetches live data from the GitHub REST API (issues, pull requests, commit activity).
3. The system computes deterministic health metrics and identifies collaboration bottlenecks.
4. User reviews metrics (open vs. closed issues, PR merge velocity, open PR age) and explainable bottleneck findings.
5. User can pin/save the repository to their Personal Dashboard for quick re-analysis.

### Workflow 3: Persistent Health Reports
1. User generates an on-demand health report for any saved or analyzed repository.
2. The report captures an immutable snapshot of metrics, bottleneck findings, reporting timeframe, and generation timestamp.
3. The report is persistently stored and accessible from the user's report history.
4. Personal reports remain strictly private to their creator.

### Workflow 4: Team Workspace Collaboration & RBAC
1. User creates a team Workspace (e.g., "Senior Capstone Team 4") and automatically becomes the **Workspace Owner**.
2. Workspace Owner generates a secure invitation link (single-use, expires in 48 hours, cryptographically hashed token).
3. Invited team member visits the link, accepts the invite, and joins as a **Workspace Member**.
4. Workspace Owner or Members add shared public repositories to the workspace.
5. Workspace Members generate and review shared health reports visible to all active workspace members.
6. Workspace Owner manages workspace settings, revokes pending invitations, or removes members if necessary.

---

## 4. Functional Requirements

### 4.1 Authentication & User Management
- **FR-AUTH-1:** Secure registration with email, name, and password.
- **FR-AUTH-2:** Server-side validation of email format and password strength (minimum 8 characters).
- **FR-AUTH-3:** Secure password hashing (bcrypt, salt rounds >= 10) before persistence.
- **FR-AUTH-4:** Authentication via secure tokens/sessions (HttpOnly cookies or Bearer JWT).
- **FR-AUTH-5:** Current authenticated user profile endpoint (`/api/v1/auth/me`).
- **FR-AUTH-6:** User logout endpoint invalidating active credentials.

### 4.2 GitHub Repository Integration & Health Metrics
- **FR-GH-1:** Validate public GitHub repository existence and accessibility via GitHub REST API v3.
- **FR-GH-2:** Retrieve repository metadata (default branch, stars, open issue count).
- **FR-GH-3:** Retrieve issues with pagination and state filtering (open, closed).
- **FR-GH-4:** Retrieve pull requests with pagination and state filtering (open, closed, merged).
- **FR-GH-5:** Retrieve recent commit activity on the default branch within a configurable analysis window (default: 30 days).
- **FR-GH-6:** Calculate deterministic health metrics:
  - Open vs. closed issue counts and ratio.
  - Open vs. merged pull request counts and ratio.
  - Average and median pull request merge turnaround time (hours/days).
  - Activity velocity (commit frequency over the analysis window).
- **FR-GH-7:** Gracefully handle GitHub API rate limits (HTTP 403 / `X-RateLimit-Remaining: 0`), returning clear status and reset times to the user.

### 4.3 Deterministic & Explainable Bottleneck Detection
- **FR-BN-1 (Stale Issues):** Detect and flag open issues that have had no comments or updates for > 30 days. Provide issue title, number, days inactive, and URL.
- **FR-BN-2 (Old Open Pull Requests):** Detect and flag pull requests that have been open for > 14 days without merge. Provide PR title, author, age, and URL.
- **FR-BN-3 (Review Inactivity):** Detect pull requests where reviews were requested or pending, but no review comments or approvals have occurred for > 7 days. *Crucial Rule:* Only flag review inactivity when GitHub API review or comment data explicitly confirms inactivity. If review data is unavailable or empty, do not flag review inactivity.
- **FR-BN-4 (Explainability):** Every bottleneck finding must include a deterministic explanation string and concrete data evidence (e.g., `PR #42 has been open for 19 days with 0 review submissions since October 4, 2026`).

### 4.4 Personal Dashboard & Saved Repositories
- **FR-DASH-1:** Personal dashboard listing all saved repositories pinned by the user.
- **FR-DASH-2:** Quick summary card for each pinned repository showing last analyzed status and key metrics.
- **FR-DASH-3:** Ability to add, refresh, or remove repositories from the personal dashboard.

### 4.5 Team Workspaces & Membership
- **FR-WS-1:** Create a named Workspace with the creator assigned as **Owner**.
- **FR-WS-2:** List workspaces where the authenticated user is an Owner or Member.
- **FR-WS-3:** Rename or delete workspace (Owner only).
- **FR-WS-4:** Prevent duplicate memberships (a user cannot join the same workspace twice).
- **FR-WS-5:** Remove a member from the workspace (Owner only; an owner cannot remove themselves if they are the sole owner).

### 4.6 Secure Invitation System
- **FR-INV-1:** Generate invitation link with a cryptographically secure random token (e.g., `crypto.randomBytes(32)`).
- **FR-INV-2:** Store only the SHA-256 hash of the invitation token in the database, never the plaintext token.
- **FR-INV-3:** Invitations expire exactly 48 hours after generation.
- **FR-INV-4:** Invitations are single-use; once accepted, the status updates to `accepted` and cannot be reused.
- **FR-INV-5:** Workspace Owner can view pending invitations and revoke any invitation before acceptance.
- **FR-INV-6:** Acceptance flow verifies: token hash exists, status is `pending`, `expiresAt > now`, and user is not already a member.

### 4.7 Shared Workspace Repositories & Reports
- **FR-REP-1:** Add and remove shared public repositories in a workspace (Members and Owners can add; Owners can remove).
- **FR-REP-2:** Trigger health analysis for workspace repositories.
- **FR-REP-3:** Save health report snapshot with: repository identifier, metrics payload, bottleneck findings, reporting window, generation timestamp, author, and workspace association.
- **FR-REP-4:** View persistent report history for workspace repositories.

---

## 5. Permission & Access Control Matrix

All permissions must be enforced strictly on the backend. Frontend UI controls will reflect these permissions, but frontend checks are never considered sufficient security boundaries.

| Resource / Action | Unauthenticated | Authenticated User | Workspace Member | Workspace Owner |
| :--- | :---: | :---: | :---: | :---: |
| Register / Login | Yes | N/A | N/A | N/A |
| View Personal Dashboard | No | Yes (own only) | Yes (own only) | Yes (own only) |
| Save / Delete Personal Repo | No | Yes (own only) | Yes (own only) | Yes (own only) |
| Generate / View Personal Report | No | Yes (own only) | Yes (own only) | Yes (own only) |
| Create New Workspace | No | Yes | Yes | Yes |
| View Workspace Details & Repos | No | No | Yes | Yes |
| Add Repo to Workspace | No | No | Yes | Yes |
| Remove Repo from Workspace | No | No | No | Yes |
| Generate & Save Workspace Report | No | No | Yes | Yes |
| View Workspace Reports History | No | No | Yes | Yes |
| Generate Workspace Invite Link | No | No | No | Yes |
| View / Revoke Workspace Invites | No | No | No | Yes |
| Accept Workspace Invite Link | No | Yes (valid token) | N/A (if already member) | N/A |
| Remove Workspace Member | No | No | No | Yes |
| Rename Workspace | No | No | No | Yes |
| Delete Workspace | No | No | No | Yes |

---

## 6. Explicit V1 Exclusions (Out of Scope)

The following features are explicitly excluded from the DevPulse V1 university release:
1. **Private GitHub Repositories & GitHub OAuth:** V1 operates exclusively on public GitHub repositories via REST API. No GitHub OAuth app setup or private repository read tokens.
2. **Chat or Direct Messaging:** No real-time chat, comments threads, or direct messaging between workspace members.
3. **AI / LLM-Generated Analysis:** Metrics and bottleneck findings must be 100% deterministic, mathematically verifiable, and explainable from raw GitHub API responses. No LLM prompts or synthetic summaries.
4. **Email Invitations & Delivery:** No SMTP server, SendGrid, or automated email dispatch. Invitation links are generated in the application and manually copied by the Owner to share.
5. **PDF / Binary Report Exports:** Reports are viewed and persisted within the web application. No PDF generation or binary download pipelines.
6. **Complex Enterprise RBAC:** Strict two-tier role system (**Owner** and **Member**). No custom permissions, role builder, or hierarchical team trees.
7. **Background Scheduling / Cron Jobs:** No automated background jobs pulling GitHub metrics periodically. All analyses are run on-demand by users or members.
8. **Fabricated / Mock Production Data:** All production metrics must originate from verified GitHub API endpoints. Never generate mock or simulated data for live user queries.

---

## 7. Current Project Status & Implementation Tracking

- **Workspace State:** Goal 5 Complete — Production Deployment, Security Hardening, and University Submission Readiness verified.
- **Implemented & Verified Functionality:**
  - Full Express authentication (Register, Login, Me, Logout) with bcrypt hashing and signed JWT in HttpOnly cookies.
  - Personal dashboard and saved public GitHub repositories with per-user compound unique constraints.
  - Real GitHub REST API v3 service with rate-limit detection, request timeouts, and 5-minute in-memory caching.
  - Deterministic repository health metric engine (open issues, open PRs, 30d merged PRs, PR turnaround time in hours, recent commits).
  - Explainable collaboration bottleneck detector (stale issues > 30d, old PRs > 14d, review inactivity > 7d).
  - Team Workspaces & Mongoose Models (`Workspace`, `WorkspaceMember`, `WorkspaceInvitation`).
  - Server-side RBAC middleware (`requireWorkspaceMember`, `requireWorkspaceOwner`) strictly enforcing boundaries.
  - Workspace management APIs (create, list user workspaces, get details & members, rename, delete, remove member, leave).
  - Secure 48-hour single-use invitation system:
    - 32-byte cryptographically secure random token.
    - Only SHA-256 hash stored in database (`tokenHash: { select: false }`), never raw token.
    - Public preview validation endpoint (`/api/invitations/validate/:token`).
    - Authenticated acceptance endpoint (`/api/invitations/accept`) with duplicate membership prevention (`ALREADY_MEMBER`).
    - Revocation by Owner (`DELETE /api/workspaces/:id/invitations/:inviteId`).
  - Workspace Repositories (`/api/workspaces/:id/repos`):
    - Members and Owners can list and add public repositories to a workspace.
    - Owners can remove repositories from the workspace.
    - Compound unique partial index prevents duplicate additions within the same workspace.
    - Dedicated workspace repository health analysis (`GET /api/workspaces/:id/repos/:repoId/health`).
  - Persistent Health Reports (`HealthReport` Model & APIs):
    - Generates immutable snapshot records capturing repository vitals, metrics, and bottleneck findings.
    - Personal reports (`/api/reports/personal`) strictly private to the creating user.
    - Workspace reports (`/api/workspaces/:id/reports`) accessible to all workspace members.
    - Unified report lookup (`GET /api/reports/:id`) strictly enforcing personal and workspace access boundaries.
  - Security & Reliability Hardening:
    - Helmet HTTP security headers (`nosniff`, `SAMEORIGIN`, etc.) and rate limiters (`apiLimiter`, `authLimiter`).
    - Recursive NoSQL injection parameter sanitization (`sanitizeInputs`).
    - Origin-based CSRF protection with custom header support (`X-Requested-With`).
    - Top-level React `ErrorBoundary`, `MetricCardSkeleton`, and `RateLimitBanner` with live reset countdown.
  - Production Deployment & Static Asset Serving:
    - Express serves compiled production bundle from `client/dist` with SPA fallback for direct URL refreshes.
    - Single-command root execution (`npm start`) running in production mode.
    - Cloud MongoDB Atlas cluster connectivity verified live (`MongoDB Atlas / devpulse`).
  - Verification & Deliverables:
    - 102 automated unit and integration tests passing with 100% success rate across 9 test suites.
    - Live end-to-end cloud database smoke tests passing (registration, login, profile, repo analysis, health score, logout, cleanup).
    - Demonstration screencast script ([`DEMO_SCRIPT.md`](file:///Users/vikramaditya/Desktop/Project/DEMO_SCRIPT.md)) and university submission audit checklist ([`SUBMISSION_CHECKLIST.md`](file:///Users/vikramaditya/Desktop/Project/SUBMISSION_CHECKLIST.md)) created.
- **Remaining Student Actions for Official Portal Submission:**
  - Record the 3–5 minute demonstration screencast using `DEMO_SCRIPT.md`.
  - Submit repository link and video URL through the university portal before October 27, 2026, 11:59 PM IST.
- **Known Environmental Prerequisites:**
  - Production runtime requires a reachable MongoDB instance (local or Atlas) specified in `MONGO_URI`.
  - GitHub API requests without a `GITHUB_TOKEN` are subject to standard unauthenticated rate limits (60 req/hr). Configuring an optional `GITHUB_TOKEN` raises limits to 5,000 req/hr.

---

## 8. University Project Demonstration Flow (October 27, 2026)

The final evaluation demo will follow this exact verifiable sequence:

1. **User Registration & Login:**
   - Register user `alice@university.edu` (Team Lead).
   - Alice logs in and arrives at an empty Personal Dashboard.
2. **Personal Analysis & Pinned Repositories:**
   - Alice inputs a public GitHub repository (e.g., `facebook/react` or a designated student repository).
   - System fetches GitHub metrics, displays open/closed issues, PR turnaround times, and commit activity.
   - Bottleneck detector highlights stale issues and old PRs with explainable data evidence.
   - Alice saves the repository to her personal dashboard and generates a persistent snapshot report.
3. **Workspace Creation & RBAC:**
   - Alice creates a new workspace: "Capstone Project Alpha" (Alice is Owner).
   - Alice navigates to Workspace Settings and generates an invitation link.
   - The token hash is stored with a 48-hour expiration.
4. **Member Invitation & Onboarding:**
   - Alice copies the invitation link.
   - In an incognito window or second session, Bob registers as `bob@university.edu`.
   - Bob navigates to the invitation link and clicks "Join Workspace".
   - Bob is confirmed as a Member of "Capstone Project Alpha".
5. **Collaborative Health Report:**
   - Bob adds a team repository to the shared workspace.
   - Bob triggers health analysis and saves a workspace health report.
   - Both Alice and Bob can view the persistent workspace report history.
6. **Permission Enforcement Verification:**
   - Bob attempts to access workspace settings, delete the workspace, or revoke invitations (Backend returns HTTP 403 Forbidden; UI hides these controls).
   - Alice revokes an active invitation link and verifies it can no longer be used.
   - Alice logs out, verifying that protected endpoints immediately deny unauthenticated requests.
