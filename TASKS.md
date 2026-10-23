# DevPulse — Implementation Tasks & Backlog

**Project:** DevPulse  
**Target Completion:** October 27, 2026  
**Current Phase:** Preparation & Planning  
**Status Legend:**
- `TODO`: Not yet started (all tasks start here)
- `IN_PROGRESS`: Actively being worked on by an agent loop
- `BLOCKED`: Blocked by external dependency or unmet prerequisite
- `DONE`: Fully implemented, verified with tests, and reviewed against acceptance criteria

---

## Phase 1: Workspace Foundation & Environment Configuration

### `TASK-01-01`: Initialize Git Repository and Git Configuration
- **Priority:** P0
- **Dependencies:** None
- **Scope:** Initialize git in workspace root, configure default branch (`main`), create `.gitignore` ignoring `node_modules`, `.env`, `dist`, `coverage`, and `.DS_Store`.
- **Acceptance Criteria:**
  - `git status` runs without error on `main`.
  - `.gitignore` prevents staging of sensitive or generated files.
  - Initial foundation files (`PROJECT.md`, `ARCHITECTURE.md`, `ENGINEERING_GUIDELINES.md`, `TASKS.md`, `LOOP.md`, `AGENTS.md`) remain tracked.
- **Testing Requirements:** Run `git status` to verify clean staging and ignore rules.
- **Status:** `DONE`

### `TASK-01-02`: Root Orchestration and Project Scaffold
- **Priority:** P0
- **Dependencies:** `TASK-01-01`
- **Scope:** Create root `package.json` with npm workspaces or convenience scripts (`npm run dev`, `npm run build`, `npm run test`). Scaffold empty `/client` and `/server` directories.
- **Acceptance Criteria:**
  - Root `package.json` exists with scripts to run client and server concurrently or individually.
  - Directories `client/` and `server/` exist.
- **Testing Requirements:** Validate package manifest syntax with `npm pkg get name`.
- **Status:** `DONE`

### `TASK-01-03`: Server Scaffold & Environment Configuration
- **Priority:** P0
- **Dependencies:** `TASK-01-02`
- **Scope:** Initialize Node.js Express server in `/server`. Install core runtime dependencies (`express`, `cors`, `dotenv`, `cookie-parser`). Create `server/app.js`, `server/index.js`, and `server/.env.example`. Implement healthcheck endpoint `GET /api/health`.
- **Acceptance Criteria:**
  - Server starts on configured `PORT` (default 5001 or 5000).
  - `GET /api/health` responds with `200 OK` and `{ success: true, data: { status: "healthy" } }`.
  - `server/.env.example` documents `PORT`, `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, `GITHUB_TOKEN`.
- **Testing Requirements:** Supertest integration test for `/api/health`; run and pass.
- **Status:** `DONE`

### `TASK-01-04`: Client Scaffold (Vite + React + Tailwind CSS)
- **Priority:** P0
- **Dependencies:** `TASK-01-02`
- **Scope:** Initialize React 18 SPA in `/client` using Vite. Configure Tailwind CSS and PostCSS. Set up Lucide React icons. Verify build and dev server.
- **Acceptance Criteria:**
  - Vite dev server runs without errors.
  - Tailwind CSS classes compile and render correctly.
  - Production build `npm run build` generates `/client/dist` without errors.
- **Testing Requirements:** Run `npm run build` in `/client` and verify exit code 0.
- **Status:** `DONE`

---

## Phase 2: Database Connectivity & User Authentication

### `TASK-02-01`: MongoDB Connection & Lifecycle Management
- **Priority:** P0
- **Dependencies:** `TASK-01-03`
- **Scope:** Setup Mongoose database connection in `server/config/db.js`. Handle connection errors, disconnects, and graceful process shutdown. Connect during server bootstrap if `MONGO_URI` is provided.
- **Acceptance Criteria:**
  - Successful connection logged when valid `MONGO_URI` is supplied.
  - Server fails fast with descriptive error message if `MONGO_URI` is missing or invalid.
  - Clean disconnect on `SIGINT` / `SIGTERM`.
- **Testing Requirements:** Verification in `server/index.js` and connection lifecycle helper in `server/config/db.js`.
- **Status:** `DONE`

### `TASK-02-02`: User Model & Password Hashing
- **Priority:** P0
- **Dependencies:** `TASK-02-01`
- **Scope:** Create `server/models/User.js` with email, name, password, and timestamps. Implement password hashing with `bcrypt` (10 rounds) and compare method. Ensure email uniqueness and lowercase normalization.
- **Acceptance Criteria:**
  - Cannot save duplicate emails (enforced by Mongoose index/validation).
  - Passwords are never stored in plaintext.
  - `comparePassword` method returns true for valid password, false for invalid.
  - Password hash is omitted from serialized JSON by default.
- **Testing Requirements:** Unit test for User model validating password hashing, comparePassword, and email formatting in `tests/auth.test.js`.
- **Status:** `DONE`

### `TASK-02-03`: Authentication API Endpoints (Register, Login, Me, Logout)
- **Priority:** P0
- **Dependencies:** `TASK-02-02`
- **Scope:** Implement `authController.js` and `authRoutes.js`:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
  - `POST /api/auth/logout`
  Generate signed JWT tokens in HttpOnly cookies with 24h expiration.
- **Acceptance Criteria:**
  - Registration returns `201 Created` with user info and HttpOnly cookie; rejects existing email with `409 Conflict`.
  - Login returns `200 OK` with valid credentials; rejects invalid password with `401 Unauthorized`.
  - Standard JSON response envelope adhered to on success and failure.
- **Testing Requirements:** Supertest integration test suite in `tests/auth.test.js` covering successful registration, duplicate registration, successful login, failed login, and `/me`.
- **Status:** `DONE`

### `TASK-02-04`: JWT Authentication Middleware
- **Priority:** P0
- **Dependencies:** `TASK-02-03`
- **Scope:** Implement `server/middlewares/authMiddleware.js`. Extract JWT from HttpOnly cookie (or Bearer Authorization header). Validate token signature and attach `req.user` to request.
- **Acceptance Criteria:**
  - Missing token returns `401 Unauthorized` with `{ code: 'UNAUTHORIZED' }`.
  - Invalid/expired token returns `401 Unauthorized` with `{ code: 'INVALID_TOKEN' }`.
  - Valid token sets `req.user` with user ID and email and calls `next()`.
- **Testing Requirements:** Supertest tests in `tests/auth.test.js` testing unauthenticated, invalid, and authenticated requests.
- **Status:** `DONE`

### `TASK-02-05`: Client Auth Context & Protected Routing
- **Priority:** P0
- **Dependencies:** `TASK-01-04`, `TASK-02-03`
- **Scope:** Implement `AuthContext` and `useAuth` hook in `/client/src/context/AuthContext.jsx`. Implement API client with credential interceptor. Create `LoginPage`, `RegisterPage`, and a `ProtectedRoute` wrapper component.
- **Acceptance Criteria:**
  - User can register, log in, and log out through the UI.
  - Unauthenticated users attempting to access `/dashboard` are redirected to `/login`.
  - Authenticated user state persists on page refresh.
- **Testing Requirements:** Verified through Vite build and end-to-end component routing in `/client/src/App.jsx`.
- **Status:** `DONE`

---

## Phase 3: GitHub Integration & Repository Metrics

### `TASK-03-01`: GitHub REST API Client Service & Rate Limiting
- **Priority:** P0
- **Dependencies:** `TASK-01-03`
- **Scope:** Implement `server/services/githubService.js`. Implement requests to GitHub REST API (`https://api.github.com`) for repo details, issues, pull requests, and commits. Support optional `GITHUB_TOKEN`. Parse rate limit headers. Implement in-memory TTL caching (5 minutes) and 8-second request timeouts.
- **Acceptance Criteria:**
  - Fetches repository data for valid public repositories.
  - Throws `GitHubApiError` with 404 on repo not found.
  - Throws `GitHubApiError` with 429 on rate limit with reset time.
  - Honors request timeout with `AbortController`.
- **Testing Requirements:** Unit tests in `tests/githubService.test.js` verifying input validation, 404 handling, and 429 rate limit errors.
- **Status:** `DONE`

### `TASK-03-02`: Repository Health Metrics Calculation Service
- **Priority:** P0
- **Dependencies:** `TASK-03-01`
- **Scope:** Implement metric calculation engine in `server/services/analysisService.js`. Calculate:
  - Open vs. closed issues count.
  - Open vs. merged vs. closed unmerged PRs count.
  - Average PR turnaround / merge time (hours).
  - Recent commit activity count (default 30-day window).
- **Acceptance Criteria:**
  - Correctly calculates PR turnaround time across merged PRs.
  - Accurately filters out pull requests from the GitHub issues endpoint response.
  - Deterministic calculations verified by mathematical unit tests.
- **Testing Requirements:** Unit tests in `tests/analysis.test.js` covering turnaround time and metric extraction.
- **Status:** `DONE`

### `TASK-03-03`: Repository Analyze API Endpoint
- **Priority:** P0
- **Dependencies:** `TASK-03-02`, `TASK-02-04`
- **Scope:** Implement `POST /api/repos/analyze` protected route. Accepts `{ repoIdentifier }` or `{ owner, repo }`. Validates format, queries GitHub service, runs analysis service, and returns full metrics payload.
- **Acceptance Criteria:**
  - Valid repo returns `200 OK` with structured metrics.
  - Non-existent repo returns `404 Not Found` with clean error envelope.
  - Malformed URL/inputs return `400 Bad Request`.
- **Testing Requirements:** Tested via `tests/repos.test.js` and route integration.
- **Status:** `DONE`

### `TASK-03-04`: Client Repository Input & Metrics Display UI
- **Priority:** P1
- **Dependencies:** `TASK-03-03`, `TASK-02-05`
- **Scope:** Implement `RepoHealth.jsx` and reusable metric components (`MetricCard`). Allow users to enter a repo URL or `owner/repo`, view loading spinner, and render live metrics with responsive cards.
- **Acceptance Criteria:**
  - Clean form with input validation and clear placeholder (`owner/repo` or full URL).
  - Visual loading skeleton while fetching metrics.
  - Error banner on invalid repo or rate limit.
  - Clear, readable cards showing issues, PRs, merge time, and commits.
- **Testing Requirements:** Verified in production build `npm run build`.
- **Status:** `DONE`

---

## Phase 4: Deterministic Bottleneck Analysis Engine

### `TASK-04-01`: Bottleneck Detection Rule Engine
- **Priority:** P0
- **Dependencies:** `TASK-03-02`
- **Scope:** Implement explainable bottleneck detectors in `server/services/analysisService.js`:
  - **Rule 1 (Stale Issues):** Open issue with no comments or updates for > 30 days.
  - **Rule 2 (Old Open PRs):** Open PR created > 14 days ago without merge.
  - **Rule 3 (Review Inactivity):** Open PR where reviews were requested/pending, but no review comments or approvals occurred in > 7 days. *Strict rule:* Only flag review inactivity when GitHub API review or comment data explicitly confirms inactivity. If review data is unavailable or empty, do not flag.
- **Acceptance Criteria:**
  - Every bottleneck finding contains: `type`, `severity` (info/warning/critical), `title`, `explanation`, and `evidence` (itemNumber, daysInactive).
  - Review inactivity rule never triggers when review data is missing or unverified.
- **Testing Requirements:** Tested and verified in `tests/analysis.test.js`.
- **Status:** `DONE`

### `TASK-04-02`: Client Bottleneck Findings & Explainability Component
- **Priority:** P1
- **Dependencies:** `TASK-04-01`, `TASK-03-04`
- **Scope:** Build `FindingsSection.jsx` component in `/client`. Render categorized findings (Critical, Warning, Info) with direct links to GitHub issues/PRs and transparent evidentiary text.
- **Acceptance Criteria:**
  - Findings grouped or badged by severity.
  - Evidence and explanation prominently displayed for each bottleneck.
  - Empty state when no bottlenecks are detected ("No Bottlenecks Detected").
- **Testing Requirements:** Verified in production build `npm run build`.
- **Status:** `DONE`

---

## Phase 5: Personal Dashboard & Saved Repositories

### `TASK-05-01`: SavedRepository Data Model & Personal CRUD Endpoints
- **Priority:** P0
- **Dependencies:** `TASK-02-04`, `TASK-03-03`
- **Scope:** Implement `server/models/SavedRepository.js`. Implement:
  - `GET /api/repos`: List saved repos for authenticated user.
  - `POST /api/repos`: Save repo `{ owner, repo }` or `{ repoIdentifier }` to personal dashboard. Prevent duplicates per user.
  - `GET /api/repos/:id/health`: Fetch and calculate health for a saved repo.
  - `DELETE /api/repos/:id`: Remove saved repo (ensuring user ownership).
- **Acceptance Criteria:**
  - Only the owner of the saved repo record can view or delete it.
  - Duplicate saves return `409 Conflict`.
  - Non-owners receive `403 Forbidden` or `404 Not Found`.
- **Testing Requirements:** Integration tests in `tests/repos.test.js` covering creation, duplicate rejection, cross-user isolation, and delete authorization.
- **Status:** `DONE`

### `TASK-05-02`: Personal Dashboard UI
- **Priority:** P1
- **Dependencies:** `TASK-05-01`, `TASK-04-02`
- **Scope:** Build `Dashboard.jsx` showing saved repositories list, quick "View Health" action button, remove button with confirmation modal, and add repo form.
- **Acceptance Criteria:**
  - Lists all pinned repositories with their owner/repo and links.
  - Clicking a repository navigates to `/repo/:id/health`.
  - Removing a repository displays confirmation modal and removes it from the list upon confirmation.
  - Informative empty state when no repositories have been saved.
- **Testing Requirements:** Verified in production build `npm run build`.
- **Status:** `DONE`

---

## Phase 6: Team Workspaces, Memberships & Secure Invitations

### `TASK-06-01`: Workspace & WorkspaceMember Models with RBAC Middleware
- **Priority:** P0
- **Dependencies:** `TASK-02-04`
- **Scope:** Implement `server/models/Workspace.js` and `server/models/WorkspaceMember.js` with compound index `{ workspace: 1, user: 1 }`. Implement `server/middlewares/rbacMiddleware.js`:
  - `requireWorkspaceMember`: Verifies authenticated user is in workspace.
  - `requireWorkspaceOwner`: Verifies authenticated user has `role === 'owner'` in workspace.
- **Acceptance Criteria:**
  - Cannot create duplicate member records for same user in same workspace.
  - Non-members blocked with `403 Forbidden` (`NOT_A_WORKSPACE_MEMBER`).
  - Regular members attempting owner actions blocked with `403 Forbidden` (`OWNER_ROLE_REQUIRED`).
- **Testing Requirements:** Unit and integration tests in `tests/workspace.test.js` across owner, member, and non-member scenarios.
- **Status:** `DONE`

### `TASK-06-02`: Workspace Management API Endpoints
- **Priority:** P0
- **Dependencies:** `TASK-06-01`
- **Scope:** Implement `server/routes/workspaceRoutes.js` and `server/controllers/workspaceController.js`:
  - `POST /api/workspaces`: Create workspace; automatically adds creator as `owner` in `WorkspaceMember`.
  - `GET /api/workspaces`: List workspaces user belongs to.
  - `GET /api/workspaces/:id`: Get workspace details and member list.
  - `PATCH /api/workspaces/:id`: Rename workspace (Owner only).
  - `DELETE /api/workspaces/:id`: Delete workspace and cascade-delete members and invitations (Owner only).
  - `DELETE /api/workspaces/:id/members/:userId`: Remove member (Owner only; cannot remove owner).
  - `POST /api/workspaces/:id/leave`: Leave workspace (regular members only; owner cannot leave).
- **Acceptance Criteria:**
  - Workspace creation atomically creates Owner membership.
  - Members cannot rename or delete workspace (enforced server-side).
  - Users only see workspaces they are members of.
- **Testing Requirements:** Integration tests in `tests/workspace.test.js` verifying CRUD, membership creation, and RBAC permission checks.
- **Status:** `DONE`

### `TASK-06-03`: Secure Workspace Invitation System
- **Priority:** P0
- **Dependencies:** `TASK-06-02`
- **Scope:** Implement `server/models/WorkspaceInvitation.js`, `server/utils/crypto.js`, and invitation service/endpoints:
  - `POST /api/workspaces/:id/invitations`: Generate 32-byte crypto random token. Store `tokenHash` (SHA-256), `expiresAt = Now + 48h`, `status = 'pending'`. Return raw token in invite URL once to Owner.
  - `GET /api/workspaces/:id/invitations`: List pending invitations (Owner only, never leaking hash).
  - `DELETE /api/workspaces/:id/invitations/:inviteId`: Revoke invitation (Owner only).
  - `GET /api/invitations/validate/:token`: Preview invitation token details.
  - `POST /api/invitations/accept`: Accept invite with raw token. Hash token, check status === 'pending' and expiresAt > Now, add user as `member`, update invite status to `accepted`.
- **Acceptance Criteria:**
  - Plaintext token is never stored in DB.
  - Expired tokens (> 48h) rejected with `400 Bad Request` (`INVITATION_EXPIRED`).
  - Already used tokens rejected (`INVITATION_ALREADY_USED`).
  - Revoked tokens rejected (`INVITATION_REVOKED`).
  - Duplicate membership rejected if user is already a member (`ALREADY_MEMBER`).
- **Testing Requirements:** Integration tests in `tests/invite.test.js` for invite creation, acceptance, expiration verification, revocation, and single-use enforcement.
- **Status:** `DONE`

### `TASK-06-04`: Workspace UI (Dashboard, Members, & Invite Flow)
- **Priority:** P1
- **Dependencies:** `TASK-06-03`, `TASK-05-02`
- **Scope:** Implement workspace frontend pages:
  - `Workspaces.jsx`: Workspace overview and card list with create modal.
  - `WorkspaceDetail.jsx`: Member list, role badges, invite link generator modal, copy link button, pending invites table with revoke button (Owner controls only), rename & delete modals.
  - `InviteAccept.jsx`: Page accessed via invite link (`/invite/:token`), displaying workspace name and "Join Workspace" button, directing unauthenticated visitors through login/register before accepting.
- **Acceptance Criteria:**
  - UI seamlessly disables or hides owner actions for regular members.
  - Owner can generate invite link, copy to clipboard, and view/revoke pending invites.
  - Invited user can accept invite and is redirected to workspace dashboard.
- **Testing Requirements:** Verified in production build `npm run build`.
- **Status:** `DONE`

---

## Phase 7: Shared Workspace Repositories & Persistent Health Reports

### `TASK-07-01`: Workspace Repositories Management
- **Priority:** P0
- **Dependencies:** `TASK-06-02`, `TASK-05-01`
- **Scope:** Implement workspace-scoped repository management:
  - `GET /api/workspaces/:id/repos`: List workspace repositories (Members & Owners).
  - `POST /api/workspaces/:id/repos`: Add public repository to workspace (Members & Owners).
  - `DELETE /api/workspaces/:id/repos/:repoId`: Remove repository from workspace (Owner only).
  - `GET /api/workspaces/:id/repos/:repoId/health`: Live health analysis for workspace repository.
- **Acceptance Criteria:**
  - Members can add repositories; only Owners can remove repositories.
  - Repositories added to workspace are visible to all current workspace members.
  - Non-members receive `403 Forbidden`.
  - Duplicate additions within the same workspace return `409 Conflict`.
- **Testing Requirements:** Integration tests in `tests/workspaceRepos.test.js` covering repo addition, duplicate rejection, owner-only removal, and health analysis.
- **Status:** `DONE`

### `TASK-07-02`: HealthReport Model & Persistent Report Snapshots
- **Priority:** P0
- **Dependencies:** `TASK-07-01`, `TASK-04-01`
- **Scope:** Implement `server/models/HealthReport.js` and report endpoints:
  - `POST /api/reports/personal`: Save personal health report snapshot from saved repo.
  - `POST /api/workspaces/:id/reports`: Save workspace health report snapshot.
  - `GET /api/reports/personal`: List personal reports created by user.
  - `GET /api/workspaces/:id/reports`: List reports generated in workspace.
  - `GET /api/reports/:id`: Unified endpoint to get full report details (verifying user ownership or workspace membership).
  - `DELETE /api/reports/personal/:id`: Delete personal report (creator only).
  - `DELETE /api/workspaces/:id/reports/:reportId`: Delete workspace report (owner only).
- **Acceptance Criteria:**
  - Report snapshot persistently saves repository info, metrics, findings array, timeframe, and timestamp.
  - Personal reports are accessible ONLY by their creator.
  - Workspace reports are accessible ONLY by authorized members of that workspace.
  - Historical snapshots are immutable; subsequent repository changes do not mutate report records.
- **Testing Requirements:** Integration tests in `tests/reports.test.js` verifying snapshot generation, immutability, personal privacy, and workspace membership access control.
- **Status:** `DONE`

### `TASK-07-03`: Report History & Detail UI
- **Priority:** P1
- **Dependencies:** `TASK-07-02`
- **Scope:** Build `PersonalReports.jsx`, `ReportDetail.jsx`, `WorkspaceRepoHealth.jsx`, and workspace report tabs in `WorkspaceDetail.jsx`. Display snapshot metrics, bottleneck findings with evidence, author, and timestamp.
- **Acceptance Criteria:**
  - Displays immutable report data accurately with clear vitals and bottleneck findings.
  - Provides navigation back to workspace or personal dashboard.
  - Gracefully handles non-existent or unauthorized report IDs with an error banner.
  - Allows saving persistent snapshots directly from live personal and workspace health views.
- **Testing Requirements:** Production build check `npm run build` completed cleanly without errors.
- **Status:** `DONE`

---

## Phase 8: Testing, Security Hardening & Edge Case Handling

### `TASK-08-01`: Comprehensive Backend RBAC & Authorization Integration Tests
- **Priority:** P0
- **Dependencies:** `TASK-07-02`
- **Scope:** Implement automated security test suite validating:
  - Unauthenticated access rejection across all protected endpoints (401 Unauthorized).
  - Non-member access rejection to workspace data and shared resources (403 Forbidden).
  - Member access rejection to owner-only endpoints (delete workspace, revoke invite, remove member, delete repo, delete report).
  - Cross-user personal report and saved repo isolation.
- **Acceptance Criteria:**
  - 100% pass rate on authorization test suite.
  - No authorization bypass vulnerabilities detected.
- **Testing Requirements:** Integration tests in `tests/securityRbac.test.js` covering 21 unauthenticated endpoints, non-member boundaries, owner-role enforcements, and cross-user data isolation.
- **Status:** `DONE`

### `TASK-08-02`: Frontend Error Boundaries, Loading Skeletons & Rate Limit Handling
- **Priority:** P1
- **Dependencies:** `TASK-07-03`
- **Scope:** Add React Error Boundaries, loading skeletons for metric cards, and dedicated GitHub rate-limit notification banners with countdown to reset time:
  - `ErrorBoundary.jsx`: Catches render crashes and provides clean fallback UI with reload and dashboard recovery actions.
  - `RateLimitBanner.jsx`: Explains 60 req/hr public rate limit and renders live quota reset countdown when HTTP 429/403 is received.
  - `MetricCardSkeleton`: Smooth pulse skeleton loading state for vitals cards.
- **Acceptance Criteria:**
  - Application does not crash on unhandled errors; presents clean recovery UI.
  - GitHub rate limit errors (429/403) clearly inform the user of the reset timestamp.
- **Testing Requirements:** Production build check `npm run build` succeeds cleanly.
- **Status:** `DONE`

### `TASK-08-03`: Input Sanitization, Helmet & Rate Limiter Middleware
- **Priority:** P1
- **Dependencies:** `TASK-08-01`
- **Scope:** Install and configure `helmet`, `express-rate-limit` (API route protection), input sanitization to prevent NoSQL injection, and CSRF protection on cookie-authenticated mutations:
  - `helmet`: Sets `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, and standard HTTP security headers.
  - `sanitizeInputs`: Recursively strips `$*` and `*.*` NoSQL injection keys from request body, query, and params.
  - `csrfProtection`: Blocks cross-site state-changing cookie requests while allowing standard SPA `X-Requested-With` headers.
  - `apiLimiter` & `authLimiter`: Prevents abusive high-frequency request flooding and brute force attacks.
- **Acceptance Criteria:**
  - Proper HTTP security headers set on all responses.
  - API rate limiter prevents abusive high-frequency request flooding.
  - Parameter tampering and NoSQL injection attempts safely neutralized.
- **Testing Requirements:** Tested in `tests/securityRbac.test.js` verifying headers, CSRF blocking, and NoSQL sanitization.
- **Status:** `DONE`

---

## Phase 9: Deployment, Documentation & Submission Preparation

### `TASK-09-01`: Production Build & Deployment Setup
- **Priority:** P0
- **Dependencies:** `TASK-08-03`
- **Scope:** Configure backend to serve production static frontend assets from `/client/dist` (and support standalone deployment configurations for Render/Vercel). Verify production build scripts and unified root startup.
- **Acceptance Criteria:**
  - `npm run build` succeeds cleanly.
  - Production server boots and serves API and frontend SPA smoothly.
  - Client-side routes (e.g. `/dashboard`, `/workspaces/:id`) load correctly on direct refresh.
- **Testing Requirements:** Executed production build and verified HTTP 200 responses across root `/`, client routes, and `/api/health`.
- **Status:** `DONE`

### `TASK-09-02`: Comprehensive README & Architecture Overview
- **Priority:** P1
- **Dependencies:** `TASK-09-01`
- **Scope:** Write root `README.md` with:
  - Project summary, architecture, and technology stack.
  - Local setup guide (prerequisites, step-by-step commands, `.env` setup).
  - Architecture diagram and complete API endpoint table.
  - Demonstration walk-through guide for evaluators.
- **Acceptance Criteria:**
  - Fresh clone can be set up and run locally following README instructions verbatim.
  - API endpoint tables accurately match implemented routes.
- **Testing Requirements:** Manual walkthrough verifying all setup commands and endpoint specifications.
- **Status:** `DONE`

### `TASK-09-03`: University End-Term Submission Checklist & Demo Script
- **Priority:** P0
- **Dependencies:** `TASK-09-02`
- **Scope:** Prepare verified submission materials for the October 27, 2026 deadline:
  - 3–5 minute video demonstration script (`DEMO_SCRIPT.md`) covering the exact agreed demo flow with rate-limit contingencies.
  - Capstone submission audit checklist (`SUBMISSION_CHECKLIST.md`) covering all evaluative criteria.
  - Verification of Git status, security rules, and code cleanliness.
- **Acceptance Criteria:**
  - Submission checklist 100% verified.
  - Complete timed demo script prepared for student video recording.
- **Testing Requirements:** Dry-run demonstration walkthrough and checklist validation.
- **Status:** `DONE`

---

## Final Release-Readiness Checklist (Due October 27, 2026)

Before official university submission, verify:
- [x] **Working Application:** Full user flow operational (Registration -> Personal Analysis -> Workspace -> Invite Link -> Member Accept -> Shared Reports -> RBAC Enforcement).
- [x] **Git History & Hygiene:** Clean status; no committed secrets or build artifacts. `.env` strictly ignored.
- [x] **Deployment / Build:** Clean `npm run build` with zero compiler/bundler warnings or errors. Application runs cleanly in production mode with SPA fallback.
- [x] **Documentation:** `README.md`, `PROJECT.md`, `ARCHITECTURE.md`, `ENGINEERING_GUIDELINES.md`, `TASKS.md`, `DEMO_SCRIPT.md`, and `SUBMISSION_CHECKLIST.md` are completely synchronized and accurate.
- [ ] **Demonstration Video:** 3–5 minute recorded video showing real GitHub metric analysis, bottleneck explainability, and workspace collaboration (follow `DEMO_SCRIPT.md`).
- [ ] **Official Project Submission:** Code repository link and deliverables submitted through the university evaluation portal before October 27, 2026.
