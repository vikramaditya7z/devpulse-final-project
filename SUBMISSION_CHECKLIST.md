# DevPulse — University End-Term Capstone Submission Checklist

**Project Name:** DevPulse (GitHub Project Health & Collaboration Platform)  
**Submission Deadline:** October 27, 2026, 11:59 PM IST  
**Course Context:** University End-Term Software Engineering Capstone Project  
**Status:** Ready for Official Evaluation & Recording  

---

## 1. Deliverables & Repository Metadata

| Item | Status | Verified Details |
| :--- | :---: | :--- |
| **Source Code Repository** | Verified | Git repository initialized on branch `main` at `/Users/vikramaditya/Desktop/Project`. |
| **Clean Git Status** | Verified | No secrets, credentials, `.env` files, or `node_modules` tracked. `.gitignore` strictly protects `.env`. |
| **Production Build Script** | Verified | `npm run build` generates production Vite bundle (`client/dist`) in < 1 second. |
| **Unified Server Entrypoint** | Verified | `npm start` executes production Express server with static asset serving and SPA fallback. |
| **Database Connection** | Verified | Live cloud MongoDB Atlas cluster connection verified (`MongoDB Atlas / devpulse`). |
| **Automated Test Suite** | Verified | 102 passing unit and integration tests across 9 test suites with 100% success rate. |
| **Demonstration Script** | Verified | [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md) prepared and timed for a 3–5 minute screencast. |

---

## 2. University Submission Verification Checklist

### A. Source Code, Architecture & Standards
- [x] **MVC Architecture Adherence:** Express models, controllers, routes, middlewares, services cleanly decoupled.
- [x] **Direct Authentication Implementation:** Implemented using Express, `bcrypt` (10 rounds), signed JWT, and `cookie-parser` without external authentication wrappers (Auth0, Clerk, Firebase, Passport).
- [x] **Deterministic Metrics & Bottleneck Detection:** Vitals derived purely from real GitHub REST API v3 data; review inactivity strictly flagged only when verified review data supports it; zero fabricated mock data in live workflows.
- [x] **RBAC & Security Boundaries:** Owner and Member roles enforced strictly on backend; single-use 48-hour invitations storing only SHA-256 token hashes.
- [x] **Multi-Tenancy Data Isolation:** Compound partial unique indexes preventing cross-user and cross-workspace collisions.
- [x] **Security Hardening:** Helmet security headers, rate limiters, recursive NoSQL injection sanitizers, and CSRF protection active.
- [x] **Frontend Crash Resilience:** Top-level React `ErrorBoundary`, loading skeletons, and dedicated GitHub rate-limit notification banner with reset countdown.

### B. Deployment & Hosting Readiness
- [x] **Local Production Mode:** Verified via `npm run build && npm start` on `http://localhost:5001`.
- [x] **Static Asset Serving:** Express directly serves `client/dist` and handles SPA client-side routing fallback for direct URL refreshes.
- [x] **Cloud Hosting Compatibility:** Supports single-service deployment (e.g. Render Web Service, Railway, Heroku) or split deployment (e.g. Vercel for frontend + Render/Railway for API) with configurable `VITE_API_BASE_URL` and `CLIENT_URL`.
- [ ] **Cloud Production URL:** *Pending student deployment to cloud provider (e.g., Render / Railway) if required by evaluator.*

### C. Live End-to-End Verification Audit
- [x] **Account Registration:** Real account created and persisted in cloud MongoDB Atlas.
- [x] **Account Login:** Bcrypt password verification and secure HttpOnly cookie issuance verified.
- [x] **Protected Profile Retrieval:** Authenticated `GET /api/auth/me` verified.
- [x] **Public GitHub Repo Addition:** Real metadata retrieved from GitHub REST API and saved to Atlas.
- [x] **Deterministic Health & Bottleneck Engine:** Live score calculation and stale issue detection verified.
- [x] **Persistent Report Snapshots:** Immutable report generation verified across personal and workspace scopes.
- [x] **Workspace Collaboration & RBAC:** Workspace creation, hashed invitation links, member onboarding, and owner-only permission blocks verified.
- [x] **Account Logout & Invalidation:** Verified that subsequent protected requests return HTTP 401 Unauthorized.
- [x] **Database Integrity:** Zero test artifacts left in production collections; verified cleanup.

### D. Screencast & Submission Actions for Student Team
- [ ] **Step 1 — Screencast Recording:** Follow [`DEMO_SCRIPT.md`](DEMO_SCRIPT.md) using Loom or OBS Studio (target length: ~4 minutes).
- [ ] **Step 2 — Video Playback Verification:** Confirm audio clarity, 1080p resolution, and that no credentials or secrets were exposed on screen.
- [ ] **Step 3 — Video Upload:** Upload to Google Drive, YouTube (Unlisted), or Loom and verify link sharing permissions ("Anyone with link can view").
- [ ] **Step 4 — Final Git Review:** Run `git status` to ensure working tree is clean.
- [ ] **Step 5 — Portal Submission:** Submit repository link and video URL via the university capstone portal before October 27, 2026, 11:59 PM IST.

---

## 3. Operational Summary Table for Evaluators

| Feature | Endpoint / Component | Verification Evidence |
| :--- | :--- | :--- |
| **Authentication** | `POST /api/auth/register`, `login`, `logout`, `me` | Bcrypt hashing + HttpOnly JWT. Verified in `tests/auth.test.js` & live Atlas test. |
| **Personal Dashboard** | `GET/POST/DELETE /api/repos`, `GET /api/repos/:id/health` | Pinned repos, compound unique index. Verified in `tests/repos.test.js` & live Atlas test. |
| **Bottleneck Engine** | `services/analysisService.js` | Deterministic stale issue (>30d), old PR (>14d), review inactivity (>7d) rules. Verified in `tests/analysis.test.js`. |
| **Workspaces & RBAC** | `POST/GET/PATCH/DELETE /api/workspaces` | Creator is Owner; Owner vs Member RBAC. Verified in `tests/workspace.test.js` & `tests/securityRbac.test.js`. |
| **Secure Invitations**| `POST /api/workspaces/:id/invitations`, `/accept` | 32-byte crypto token, SHA-256 hash storage, 48h expiry, single-use. Verified in `tests/invite.test.js`. |
| **Shared Repositories**| `POST/GET/DELETE /api/workspaces/:id/repos` | Multi-tenant `SavedRepository` with workspace scope. Verified in `tests/workspaceRepos.test.js`. |
| **Persistent Reports** | `POST/GET /api/reports/personal`, `POST/GET /api/workspaces/:id/reports` | Immutable snapshot records. Verified in `tests/reports.test.js`. |
| **Security Hardening** | `middlewares/securityMiddleware.js` | Helmet, express-rate-limit, Origin CSRF protection, NoSQL sanitization. Verified in `tests/securityRbac.test.js`. |
| **Client Reliability** | `ErrorBoundary.jsx`, `RateLimitBanner.jsx` | Graceful crash recovery, GitHub rate limit countdown. Verified in production bundle. |
