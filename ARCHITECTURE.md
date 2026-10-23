# DevPulse — System Architecture & Technical Specification

> **Status Notice:** The technical architecture, schemas, and API contracts defined in this document represent the **PROPOSED specification** for DevPulse. As the workspace is currently in the initial setup phase, no modules or endpoints are currently implemented. All implementations must conform strictly to these architectural boundaries.

---

## 1. System Overview & Technology Stack

DevPulse is structured as a decoupled client-server web application designed for simplicity, deterministic behavior, and ease of university demonstration.

```
+-----------------------------------------------------------+
|                        Browser                            |
|             React 18 + Vite SPA + Tailwind CSS            |
+-----------------------------+-----------------------------+
                              |
                     HTTPS / JSON REST API
                              |
+-----------------------------v-----------------------------+
|                      Node.js / Express                    |
|  - Auth & RBAC Middleware    - Rate Limiter & Validator   |
|  - GitHub REST API Service   - Bottleneck Rule Engine     |
+---------------+-----------------------------+-------------+
                |                             |
       MongoDB Queries (Mongoose)     HTTPS Requests (REST v3)
                |                             |
+---------------v-------------+ +-------------v-------------+
|        MongoDB Database     | |       GitHub REST API     |
| - Users      - Workspaces   | | - Repos     - Pull Requests|
| - Members    - Invitations  | | - Issues    - Commits      |
| - Repos      - Reports      | +---------------------------+
+-----------------------------+
```

### Component Responsibilities

| Tier | Technology | Key Responsibilities |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons, React Router | User interface, client-side routing, auth context, form validation feedback, responsive dashboards, metric visualizations, error presentation. |
| **Backend API** | Node.js (v24 LTS), Express 4/5 | REST API routing, input validation & sanitization, authentication (JWT), RBAC authorization middleware, deterministic bottleneck logic, GitHub API integration with rate limit handling, database operations. |
| **Database** | MongoDB (v7+) via Mongoose ODM | Relational-like schema modeling with strict schemas, uniqueness constraints, compound indexes, timestamps, and referential integrity. |
| **External Integration**| GitHub REST API v3 (`api.github.com`) | Fetching public repository metadata, commit histories, pull requests, issues, and review state. |

---

## 2. Frontend / Backend Architectural Boundaries

1. **Separation of Concerns:** The frontend is strictly a presentation and interaction layer. It never directly accesses the database, never makes direct requests to the GitHub API on behalf of the application, and never holds application secrets.
2. **Backend Authority:** All business logic, bottleneck calculations, data filtering, and security checks occur on the backend:
   - Backend performs GitHub REST API querying. This prevents client CORS issues, centralizes rate-limit management, and protects optional server-side GitHub Personal Access Tokens (`GITHUB_TOKEN`).
   - Backend enforces all workspace membership and ownership checks before returning data or modifying state.
3. **Stateless Communication:** Backend API endpoints communicate via standard JSON over HTTP(S). Sessions are authenticated using cryptographic JSON Web Tokens (JWT) or secure HttpOnly cookies.

---

## 3. Proposed Directory Structure

DevPulse uses a clean, two-tier modular directory structure in a single repository:

```
DevPulse/
├── client/                          # React + Vite Frontend
│   ├── public/                      # Static assets (favicons, logos)
│   ├── src/
│   │   ├── assets/                  # Images, SVGs, styles
│   │   ├── components/              # Reusable UI components
│   │   │   ├── common/              # Buttons, Cards, Inputs, Modals, Badges
│   │   │   ├── layout/              # Navbar, Sidebar, PageContainer
│   │   │   ├── metrics/             # HealthScoreCard, BottleneckList, MetricCharts
│   │   │   └── workspace/           # MemberList, InviteModal, RepoManager
│   │   ├── context/                 # AuthContext, WorkspaceContext
│   │   ├── hooks/                   # Custom React hooks (useAuth, useRepoMetrics)
│   │   ├── pages/                   # Route page components
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── PersonalDashboardPage.jsx
│   │   │   ├── RepoAnalysisPage.jsx
│   │   │   ├── WorkspaceDashboardPage.jsx
│   │   │   ├── WorkspaceSettingsPage.jsx
│   │   │   ├── InviteAcceptPage.jsx
│   │   │   └── ReportDetailsPage.jsx
│   │   ├── services/                # Axios / Fetch API client wrappers
│   │   │   ├── api.js               # Base HTTP client with interceptors
│   │   │   ├── authService.js
│   │   │   ├── repoService.js
│   │   │   ├── reportService.js
│   │   │   └── workspaceService.js
│   │   ├── utils/                   # Date formatters, metric math, validators
│   │   ├── App.jsx                  # Main routing & provider wrapper
│   │   ├── main.jsx                 # Vite application entrypoint
│   │   └── index.css                # Tailwind directives & theme configuration
│   ├── index.html                   # HTML entrypoint
│   ├── tailwind.config.js           # Tailwind CSS configuration
│   ├── vite.config.js               # Vite build configuration
│   └── package.json                 # Frontend dependencies
│
├── server/                          # Node.js + Express Backend
│   ├── src/
│   │   ├── config/                  # Configuration loaders (db, env, constants)
│   │   │   ├── db.js                # Mongoose connection logic
│   │   │   └── env.js               # Validated environment variables
│   │   ├── controllers/             # Request handlers
│   │   │   ├── authController.js
│   │   │   ├── repoController.js
│   │   │   ├── reportController.js
│   │   │   ├── workspaceController.js
│   │   │   └── inviteController.js
│   │   ├── middleware/              # Express middlewares
│   │   │   ├── authMiddleware.js    # JWT verification & req.user attachment
│   │   │   ├── rbacMiddleware.js    # Workspace Owner / Member access guards
│   │   │   ├── validateMiddleware.js# Joi / Zod request body validation
│   │   │   └── errorHandler.js      # Global error handling middleware
│   │   ├── models/                  # Mongoose Schemas & Models
│   │   │   ├── User.js
│   │   │   ├── Workspace.js
│   │   │   ├── WorkspaceMember.js
│   │   │   ├── WorkspaceInvitation.js
│   │   │   ├── SavedRepository.js
│   │   │   └── HealthReport.js
│   │   ├── routes/                  # Express route declarations
│   │   │   ├── index.js             # Route aggregator (/api/v1)
│   │   │   ├── authRoutes.js
│   │   │   ├── repoRoutes.js
│   │   │   ├── reportRoutes.js
│   │   │   └── workspaceRoutes.js
│   │   ├── services/                # Core business logic & external integrations
│   │   │   ├── githubService.js     # GitHub REST API v3 client with caching
│   │   │   ├── analysisService.js   # Deterministic metric & bottleneck calculations
│   │   │   └── inviteService.js     # Crypto token generation & SHA-256 hashing
│   │   ├── utils/                   # Logging, error classes, date utilities
│   │   ├── app.js                   # Express application setup
│   │   └── server.js                # HTTP server bootstrap & graceful shutdown
│   ├── tests/                       # Unit and integration test suites
│   │   ├── auth.test.js
│   │   ├── analysis.test.js
│   │   ├── workspace.test.js
│   │   └── invite.test.js
│   ├── .env.example                 # Environment template
│   └── package.json                 # Backend dependencies
│
├── .gitignore                       # Root ignore (node_modules, .env, build)
├── PROJECT.md                       # Product requirements & specs
├── ARCHITECTURE.md                  # This document
├── ENGINEERING_GUIDELINES.md        # Quality, security & code rules
├── TASKS.md                         # Dependency-aware task backlog
├── LOOP.md                          # Antigravity goal loop instructions
├── AGENTS.md                        # Persistent agent directives
└── package.json                     # Root package for workspace orchestration
```

---

## 4. Proposed Data Models & Mongoose Schemas

All schemas enforce strict typing, validation rules, timestamps, and indexes.

### 4.1 User Schema (`server/src/models/User.js`)
```javascript
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email address format']
  },
  passwordHash: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100
  }
}, { timestamps: true });
```

### 4.2 Workspace Schema (`server/src/models/Workspace.js`)
```javascript
const workspaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 80
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  }
}, { timestamps: true });
```

### 4.3 WorkspaceMember Schema (`server/src/models/WorkspaceMember.js`)
```javascript
const workspaceMemberSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['owner', 'member'],
    default: 'member',
    required: true
  },
  joinedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Prevent duplicate membership in the same workspace
workspaceMemberSchema.index({ workspaceId: userId }, { unique: true });
```

### 4.4 WorkspaceInvitation Schema (`server/src/models/WorkspaceInvitation.js`)
```javascript
const workspaceInvitationSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
    index: true
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Store only the hex digest of sha256(rawToken), NEVER raw token
  tokenHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true // Supports TTL or expiration queries
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'revoked'],
    default: 'pending',
    required: true,
    index: true
  }
}, { timestamps: true });
```

### 4.5 SavedRepository Schema (`server/src/models/SavedRepository.js`)
```javascript
const savedRepositorySchema = new mongoose.Schema({
  owner: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true,
    trim: true
  },
  scope: {
    type: String,
    enum: ['personal', 'workspace'],
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    default: null,
    index: true
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

// Unique compound indexes: prevent duplicate saved repos in the same scope
savedRepositorySchema.index(
  { owner: 1, name: 1, userId: 1 },
  { unique: true, partialFilterExpression: { scope: 'personal' } }
);
savedRepositorySchema.index(
  { owner: 1, name: 1, workspaceId: 1 },
  { unique: true, partialFilterExpression: { scope: 'workspace' } }
);
```

### 4.6 HealthReport Schema (`server/src/models/HealthReport.js`)
```javascript
const healthReportSchema = new mongoose.Schema({
  repository: {
    owner: { type: String, required: true },
    name: { type: String, required: true },
    url: { type: String, required: true },
    defaultBranch: { type: String, default: 'main' }
  },
  scope: {
    type: String,
    enum: ['personal', 'workspace'],
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    default: null,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  metrics: {
    openIssuesCount: { type: Number, required: true },
    closedIssuesCount: { type: Number, required: true },
    totalIssuesCount: { type: Number, required: true },
    openPRsCount: { type: Number, required: true },
    mergedPRsCount: { type: Number, required: true },
    closedUnmergedPRsCount: { type: Number, required: true },
    recentCommitsCount: { type: Number, required: true },
    avgPRMergeTimeHours: { type: Number, default: 0 }
  },
  findings: [{
    type: {
      type: String,
      enum: ['stale_issue', 'old_open_pr', 'review_inactivity'],
      required: true
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'critical'],
      required: true
    },
    title: { type: String, required: true },
    explanation: { type: String, required: true },
    evidence: {
      itemNumber: { type: Number },
      itemUrl: { type: String },
      daysInactive: { type: Number },
      lastActivityDate: { type: Date }
    }
  }],
  reportingPeriodDays: {
    type: Number,
    default: 30,
    required: true
  },
  generatedAt: {
    type: Date,
    default: Date.now,
    required: true
  }
}, { timestamps: true });
```

---

## 5. API Design Conventions & Route Organization

### Standard Response Envelope
All API responses adhere strictly to a standard envelope format:

**Success Response (HTTP 200, 201):**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response (HTTP 400, 401, 403, 404, 409, 429, 500):**
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested workspace does not exist.",
    "details": null
  }
}
```

### Proposed Endpoint Table

| Method | Path | Auth Required | Permission Required | Description |
| :--- | :--- | :---: | :---: | :--- |
| `POST` | `/api/v1/auth/register` | No | Public | Register a new user |
| `POST` | `/api/v1/auth/login` | No | Public | Authenticate user & return token |
| `POST` | `/api/v1/auth/logout` | Yes | Authenticated | Invalidate session |
| `GET` | `/api/v1/auth/me` | Yes | Authenticated | Retrieve current user profile |
| `POST` | `/api/v1/repos/analyze` | Yes | Authenticated | Run live GitHub analysis on `owner/repo` |
| `GET` | `/api/v1/repos/personal` | Yes | Authenticated | List user's saved personal repos |
| `POST` | `/api/v1/repos/personal` | Yes | Authenticated | Save a repo to personal dashboard |
| `DELETE`| `/api/v1/repos/personal/:id` | Yes | Authenticated | Remove repo from personal dashboard |
| `GET` | `/api/v1/reports/personal` | Yes | Authenticated | List personal generated reports |
| `POST` | `/api/v1/reports/personal` | Yes | Authenticated | Save a personal health report snapshot |
| `GET` | `/api/v1/reports/:id` | Yes | Authenticated | View report details (verifies personal/workspace access) |
| `GET` | `/api/v1/workspaces` | Yes | Authenticated | List workspaces where user is Member or Owner |
| `POST` | `/api/v1/workspaces` | Yes | Authenticated | Create a new workspace (creator is Owner) |
| `GET` | `/api/v1/workspaces/:id` | Yes | Workspace Member | Retrieve workspace details |
| `PATCH`| `/api/v1/workspaces/:id` | Yes | Workspace Owner | Rename workspace |
| `DELETE`| `/api/v1/workspaces/:id`| Yes | Workspace Owner | Delete workspace & associated resources |
| `POST` | `/api/v1/workspaces/:id/invitations` | Yes | Workspace Owner | Create single-use 48h invitation link |
| `GET` | `/api/v1/workspaces/:id/invitations` | Yes | Workspace Owner | List active pending invitations |
| `DELETE`| `/api/v1/workspaces/:id/invitations/:inviteId` | Yes | Workspace Owner | Revoke pending invitation |
| `POST` | `/api/v1/invitations/accept` | Yes | Authenticated | Accept invitation using raw token |
| `DELETE`| `/api/v1/workspaces/:id/members/:userId` | Yes | Workspace Owner | Remove member from workspace |
| `GET` | `/api/v1/workspaces/:id/repos` | Yes | Workspace Member | List workspace saved repositories |
| `POST` | `/api/v1/workspaces/:id/repos` | Yes | Workspace Member | Add public repo to workspace |
| `DELETE`| `/api/v1/workspaces/:id/repos/:repoId` | Yes | Workspace Owner | Remove repo from workspace |
| `GET` | `/api/v1/workspaces/:id/reports` | Yes | Workspace Member | List shared reports for workspace |
| `POST` | `/api/v1/workspaces/:id/reports` | Yes | Workspace Member | Save health report snapshot to workspace |

---

## 6. Authentication & Authorization Boundaries

### Authentication Strategy
- **Password Security:** Server validates passwords (minimum 8 characters, containing numbers/letters). Password is hashed with `bcrypt` (10 rounds) before persistence.
- **Session Tokens:** Stateless JWT signed with `JWT_SECRET` (HMAC SHA-256). The token payload contains: `{ sub: userId, email: user.email }` with a 24-hour expiration (`exp`).
- **Token Delivery Options:**
  - *Recommended:* Stored in an `HttpOnly`, `SameSite=Lax`, `Secure` (in production) cookie named `devpulse_token`.
  - *Fallback/API alternative:* `Authorization: Bearer <token>` header.

### RBAC Authorization Flow
Every workspace-scoped route passes through two middleware stages:
1. `authenticateToken`: Validates JWT, extracts `req.user`. If token is missing, expired, or tampered with, responds `401 Unauthorized`.
2. `requireWorkspaceRole(role)`:
   - Queries `WorkspaceMember` collection for `{ workspaceId, userId: req.user._id }`.
   - If no membership record exists, responds `403 Forbidden` (`NOT_A_WORKSPACE_MEMBER`).
   - If `role === 'owner'` is requested but member has `role === 'member'`, responds `403 Forbidden` (`OWNER_ROLE_REQUIRED`).
   - Attaches `req.membership = memberRecord` to the Express request for downstream controller use.

---

## 7. GitHub API Integration Architecture

### Public API Consumption
DevPulse integrates directly with GitHub REST API v3:
- Base URL: `https://api.github.com`
- Headers:
  - `Accept: application/vnd.github.v3+json`
  - `User-Agent: DevPulse-App`
  - `Authorization: Bearer <GITHUB_TOKEN>` (optional server-side token configured in `.env` to lift rate limits from 60/hr to 5,000/hr).

### Endpoints Used
1. `GET /repos/{owner}/{repo}`: Checks existence, verifies public visibility, retrieves default branch and star/watcher counts.
2. `GET /repos/{owner}/{repo}/issues?state=all&per_page=100`: Fetches open and closed issues. (Note: GitHub returns PRs in the issues endpoint; the service filters out objects containing a `pull_request` key).
3. `GET /repos/{owner}/{repo}/pulls?state=all&per_page=100`: Fetches open, closed, and merged pull requests.
4. `GET /repos/{owner}/{repo}/commits?per_page=100&since={date}`: Fetches commits on default branch within the analysis window.
5. `GET /repos/{owner}/{repo}/pulls/{pull_number}/reviews`: Fetches review activity for open pull requests to evaluate review staleness.

### Rate Limit & Performance Strategy
1. **Header Inspection:** Every response inspects:
   - `x-ratelimit-limit`
   - `x-ratelimit-remaining`
   - `x-ratelimit-reset` (UNIX epoch timestamp)
2. **Rate Limit Handling:** If remaining quota drops to 0 (or HTTP 403 rate limit error is received), `githubService` captures the reset timestamp and throws an explicit `RateLimitExceededError`. The API returns HTTP 429 / 403 with `{ code: 'GITHUB_RATE_LIMIT_EXCEEDED', resetAt: ... }`.
3. **In-Memory TTL Cache:** To avoid duplicate GitHub API calls during repetitive user navigation, repository metrics queries are cached in memory (Node-cache or basic Map) with a 5-minute TTL keyed by `owner/repo`.
4. **Timeouts:** All outbound HTTP requests to GitHub enforce a strict 8,000ms timeout using `AbortController` to prevent hanging backend requests.

---

## 8. Deterministic Bottleneck Detection Logic

All bottleneck findings are calculated purely deterministically:

### 1. Stale Issues
- **Condition:** Issue `state === 'open'` AND `updated_at < (Now - 30 days)` AND `comments === 0` (or no comment in > 30 days).
- **Severity:** `warning`.
- **Finding Payload:**
  - `type`: `"stale_issue"`
  - `title`: `Issue #${number}: ${title} is stale`
  - `explanation`: `This issue has had no comments or updates for over 30 days.`
  - `evidence`: `{ itemNumber, itemUrl, daysInactive }`

### 2. Old Open Pull Requests
- **Condition:** PR `state === 'open'` AND `created_at < (Now - 14 days)`.
- **Severity:** If > 28 days: `critical`; else: `warning`.
- **Finding Payload:**
  - `type`: `"old_open_pr"`
  - `title`: `PR #${number}: ${title} has been open for ${days} days`
  - `explanation`: `This pull request has been open without merge for over 14 days, creating potential merge conflict debt.`
  - `evidence`: `{ itemNumber, itemUrl, daysInactive }`

### 3. Review Inactivity
- **Condition:** PR `state === 'open'` AND reviews requested/pending AND reviews array length === 0 for > 7 days since PR creation (or last review submission was > 7 days ago).
- **CRITICAL DATA RULE:** Only flag review inactivity when GitHub API review or comment data explicitly confirms inactivity. If review data cannot be verified or endpoint returns empty/ambiguous status, do NOT flag.
- **Severity:** `warning`.
- **Finding Payload:**
  - `type`: `"review_inactivity"`
  - `title`: `PR #${number}: ${title} pending review for ${days} days`
  - `explanation`: `A review was requested but no review submissions have been recorded in the past 7 days.`

---

## 9. Security & Sensitive-Data Handling

1. **No Stored Plaintext Secrets:**
   - User passwords: Hashed with `bcrypt` (10 rounds).
   - Invitation tokens: Plaintext tokens are sent only once in the invite URL. The database stores only `crypto.createHash('sha256').update(rawToken).digest('hex')`.
2. **CORS & Headers:** Backend configures `cors` to allow requests solely from the frontend origin (`http://localhost:5173` in development) and utilizes standard security headers (Helmet).
3. **Parameter Tampering Prevention:**
   - ObjectIds are validated before Mongoose queries (`mongoose.Types.ObjectId.isValid`).
   - All write endpoints validate body inputs with strict schemas, rejecting unknown keys.
4. **Environment Variables:**
   - Secrets are loaded exclusively from `.env` via `dotenv`.
   - `.env` is strictly git-ignored.
   - `.env.example` provides safe templates with dummy placeholders.

---

## 10. Testing Strategy & Deployment Considerations

### Testing Strategy
- **Backend Unit Tests:** Vitest or Jest covering:
  - Metric math and PR merge duration calculations.
  - Bottleneck detection rules (ensuring review inactivity is not falsely triggered).
  - Invitation token generation and SHA-256 verification.
- **Backend API Integration Tests:** Supertest against an in-memory MongoDB (`mongodb-memory-server`) testing:
  - Registration, login, duplicate email rejection.
  - Workspace creation, invitation generation, and acceptance.
  - RBAC boundaries (verifying Member receives 403 on Owner endpoints).
- **Frontend Verification:** Component and unit tests for key render states (loading, empty, error, active metrics).

### Deployment Considerations (University Demo)
- **Architecture:** Monolithic or coordinated container deployment suitable for local grading or single-platform cloud hosting (e.g., Render, Railway, or Fly.io).
- **Database:** MongoDB Atlas Free Tier (M0) or local Dockerized MongoDB.
- **Frontend Build:** Vite builds to `/client/dist`, served either by Express static hosting or a static site host (e.g., Vercel / Netlify) proxying `/api/v1` to the backend.
