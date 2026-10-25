# DevPulse — GitHub Project Health & Collaboration Platform

DevPulse is a collaborative web platform designed for engineering teams and student project groups to monitor public GitHub repositories, calculate deterministic health metrics, and identify collaboration bottlenecks such as stale issues, overdue pull requests, and review deadlocks.

**Live Production Deployment:** [https://devpulse-final-project.onrender.com](https://devpulse-final-project.onrender.com)  
**Demo Video:** https://drive.google.com/drive/folders/1BLS3QTjA49BH4OEEJK_DlqL6YRipqNb9?usp=sharing

---

## Key Features

- **Public GitHub Repository Analysis:** On-demand and saved repository diagnostics executed directly against the GitHub REST API v3 without requiring private permissions.
- **Deterministic 4-Dimensional Health Scoring:** Transparent score (0–100) calculated across Pull Request Velocity (30%), Backlog Hygiene (25%), Commit Cadence (25%), and Review Responsiveness (20%).
- **Explainable Bottlenecks & Rule-Based Actions:** Clear diagnostic flags (stale issues >30 days, old open PRs >14 days, review inactivity >7 days) paired with prescriptive, rule-based recommendations.
- **Team Workspaces & Shared Repositories:** Multi-repository collaboration spaces with role-based access control (Owner vs. Member) and single-use, cryptographically hashed (SHA-256) invitation links.
- **Workspace Project Overview & Priorities:** Aggregated workspace health KPIs and automatically prioritized top 10 actionable team priorities ranked by critical severity and days inactive.
- **Historical Snapshot Comparisons:** Chronological diffing of any two report snapshots showing net score movement, dimensional changes, key metric transitions, and bottleneck evolution (*Newly Detected*, *Resolved*, and *Persisting*).
- **Snapshot Immutability:** Historical reports are permanently sealed upon generation; mutation attempts (`PUT` and `PATCH`) are strictly rejected with HTTP 405 Method Not Allowed.
- **Secure Authentication & RBAC:** Direct Express authentication with bcrypt password hashing (cost factor ≥ 10), signed JWTs stored in HttpOnly/SameSite cookies, and strict backend authorization.

---

## 1. Tech Stack Overview

- **Frontend:** React 18 (Vite SPA), Tailwind CSS, Lucide Icons, React Router DOM v6
- **Backend:** Node.js (v24), Express.js (MVC Architecture)
- **Database:** MongoDB & Mongoose ODM
- **Authentication:** Direct Express + bcrypt password hashing + signed JSON Web Tokens (JWT) in secure HttpOnly cookies + cookie-parser
- **External Integration:** GitHub REST API v3 (`https://api.github.com`)
- **Testing:** Jest, Supertest, MongoDB In-Memory Server (`mongodb-memory-server`), Headless Google Chrome

---

## 2. Project Architecture & Directory Layout

```
DevPulse/
├── client/                     # Frontend React + Vite SPA
│   ├── src/
│   │   ├── components/         # Reusable UI (Navbar, MetricCard, FindingsSection, DimensionalBreakdown, ProtectedRoute)
│   │   ├── context/            # AuthContext (user session, login, register, logout)
│   │   ├── pages/              # Landing, Login, Register, Dashboard, RepoHealth, QuickAnalyze, PersonalReports, ReportDetail, ReportCompare, Workspaces, WorkspaceDetail, WorkspaceRepoHealth, InviteAccept, NotFound
│   │   ├── services/           # Axios-like Fetch API client (authApi, repoApi, workspaceApi, reportApi, inviteApi)
│   │   ├── App.jsx             # React routing & application layout
│   │   └── main.jsx            # React entrypoint
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── server/                     # Backend Express REST API
│   ├── config/
│   │   └── db.js               # Mongoose connection & lifecycle management
│   ├── controllers/
│   │   ├── authController.js   # User registration, authentication, session profile, logout
│   │   ├── repoController.js   # Personal saved repositories & on-demand health analysis
│   │   ├── workspaceController.js     # Workspace lifecycle, overview KPIs, team priorities, members
│   │   ├── workspaceRepoController.js # Workspace shared repositories & repo health
│   │   ├── reportController.js        # Persistent snapshots, immutability, & comparison
│   │   └── inviteController.js        # Cryptographic single-use invitation tokens & redemption
│   ├── middlewares/
│   │   ├── authMiddleware.js   # HttpOnly JWT verification & req.user attachment
│   │   ├── rbacMiddleware.js   # Workspace membership & Owner role authorization
│   │   ├── securityMiddleware.js # Rate limiting, Helmet headers, CORS policies
│   │   └── errorHandler.js     # Centralized error formatting & HTTP status codes
│   ├── models/
│   │   ├── User.js             # User credentials with bcrypt pre-save hashing
│   │   ├── SavedRepository.js  # Saved repository schema (personal and workspace scopes)
│   │   ├── Workspace.js        # Team workspace metadata and ownership
│   │   ├── WorkspaceMember.js  # Workspace membership mapping with role (owner / member)
│   │   ├── WorkspaceInvitation.js # Single-use invitation tokens (SHA-256 hashed)
│   │   └── HealthReport.js     # Immutable historical health metrics & findings snapshot
│   ├── routes/
│   │   ├── authRoutes.js       # /api/auth endpoints
│   │   ├── repoRoutes.js       # /api/repos endpoints
│   │   ├── workspaceRoutes.js  # /api/workspaces endpoints (overview, repos, reports, members)
│   │   ├── reportRoutes.js     # /api/reports endpoints (personal snapshots & comparisons)
│   │   └── inviteRoutes.js     # /api/invitations endpoints (preview & acceptance)
│   ├── services/
│   │   ├── githubService.js    # Direct GitHub REST API v3 client with in-memory TTL caching
│   │   ├── analysisService.js  # Pure deterministic metrics & 4D bounded bottleneck calculations
│   │   └── comparisonService.js # Deterministic snapshot diffing, metrics transition, and change summaries
│   ├── utils/
│   │   ├── jwt.js              # Token signing, verification, and cookie helper
│   │   ├── crypto.js           # SHA-256 token hashing and secure random generators
│   │   └── urlHelper.js        # Canonical GitHub URL parsing and normalization
│   ├── tests/                  # Automated Jest + Supertest test suites (16 suites, 157 tests)
│   ├── app.js                  # Express middleware & route definitions (exported for testing)
│   ├── index.js                # Server entrypoint & DB connection bootstrap
│   ├── .env.example
│   └── package.json
│
├── reports/
│   └── DEV_DEMO_READINESS.md   # Comprehensive QA audit, browser verification, & demo walkthrough
├── ARCHITECTURE.md             # System boundaries, data schemas & API design
├── PROJECT.md                  # Product scope, permission matrix, & non-goals
├── package.json                # Root project orchestration scripts
└── README.md                   # Project overview & documentation
```

---

## 3. Environment Variables & Security

### Backend (`server/.env`)

Copy `server/.env.example` to `server/.env`:

```bash
cp server/.env.example server/.env
```

| Variable | Description | Local Development Default | Production Requirement |
| :--- | :--- | :--- | :--- |
| `PORT` | Port for the Express server | `5001` | Assigned by host environment (e.g., Render) |
| `NODE_ENV` | Runtime environment mode | `development` | Set to `production` |
| `MONGO_URI` | MongoDB connection URI | `mongodb://127.0.0.1:27017/devpulse` | Production MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key used to sign JWTs | `replace-with-a-long-random-secret-min-32-chars` | **Must be a strong, unique secret (minimum 32 random characters)** |
| `JWT_EXPIRES_IN` | Token expiration duration | `24h` | `24h` |
| `COOKIE_SECURE` | Enforces HTTPS-only cookies | `false` | `true` (Enforced over HTTPS) |
| `COOKIE_SAMESITE`| Cookie SameSite policy | `lax` | `lax` for unified hosting, `none` for split domains |
| `CLIENT_URL` | Allowed frontend origin for CORS | `http://localhost:5173` | Production frontend domain (e.g., `https://devpulse-final-project.onrender.com`) |
| `GITHUB_TOKEN` | *(Optional)* Personal Access Token | *(empty)* | Optional. Increases GitHub API rate limit from 60 to 5,000 req/hr |

> **Security Invariants:**
> - The example `JWT_SECRET` in `.env.example` is strictly for local testing. In production, a cryptographically secure, unpredictable secret must be configured via environment variables.
> - Plaintext invitation tokens and passwords are never stored in the database. Passwords use `bcrypt` (salt rounds ≥ 10); invitation tokens are hashed with SHA-256 before storage.
> - Secrets, environment files (`.env`), and tokens are excluded from Git via `.gitignore`.

### Frontend (`client/.env`)

Copy `client/.env.example` to `client/.env`:

```bash
cp client/.env.example client/.env
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base URL for API calls | `/api` (proxied by Vite in dev; same-origin in production) |

---

## 4. Installation & Development Commands

### Step 1: Install Dependencies

From the project root:
```bash
npm run install:all
```
*Or install separately in each folder:*
```bash
cd server && npm install
cd ../client && npm install
```

### Step 2: Configure Environment

Ensure `server/.env` exists with valid configuration:
```bash
cp server/.env.example server/.env
```

### Step 3: Run the Local Development Servers

In terminal 1 (start backend API server):
```bash
npm run server:dev
# Running on http://localhost:5001
```

In terminal 2 (start frontend Vite dev server):
```bash
npm run client
# Running on http://localhost:5173
```

Open `http://localhost:5173` in your browser.

### Step 4: Production Build & Startup

To build and run the production application locally:
```bash
# Build the client production bundle
npm run build

# Start the unified production server (serves API and client/dist static assets)
npm start
```

---

## 5. API Reference

All API responses follow a uniform JSON envelope format:
- **Success:** `{ "success": true, "data": { ... } }`
- **Error:** `{ "success": false, "error": { "code": "...", "message": "..." } }`

### System Health
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/health` | Returns service health status and timestamp. | Public |

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register new user. Sets HttpOnly JWT session cookie. | Public |
| `POST` | `/api/auth/login` | Authenticate with email/password. Sets HttpOnly JWT cookie. | Public |
| `GET` | `/api/auth/me` | Retrieve authenticated user profile. | Authenticated |
| `POST` | `/api/auth/logout` | Clears authentication session cookie. | Authenticated |

### Personal Repositories (`/api/repos`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/repos` | Save public repo by `{ repoIdentifier }` (`owner/repo` or URL). | Authenticated |
| `GET` | `/api/repos` | List current user's saved repositories. | Authenticated |
| `POST` | `/api/repos/analyze` | On-demand health analysis of any public repo without saving. | Authenticated |
| `GET` | `/api/repos/:id/health` | Calculate live health metrics for a saved repository. | Authenticated |
| `DELETE`| `/api/repos/:id` | Remove a repository from the user's dashboard. | Authenticated |

### Team Workspaces (`/api/workspaces`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/workspaces` | Create a new team workspace (creator assigned Owner). | Authenticated |
| `GET` | `/api/workspaces` | List all workspaces accessible to the authenticated user. | Authenticated |
| `GET` | `/api/workspaces/:id` | Get workspace details and member list. | Workspace Member |
| `GET` | `/api/workspaces/:id/overview` | Aggregated workspace pulse KPIs and top 10 team priorities. | Workspace Member |
| `PATCH`| `/api/workspaces/:id` | Rename workspace name or description. | Workspace Owner |
| `DELETE`| `/api/workspaces/:id` | Delete workspace and cascade-delete members, repos, and reports. | Workspace Owner |
| `GET` | `/api/workspaces/:id/members` | List workspace members with assigned roles. | Workspace Member |
| `DELETE`| `/api/workspaces/:id/members/:userId` | Remove member from workspace (cannot remove Owner). | Workspace Owner |
| `POST` | `/api/workspaces/:id/leave` | Leave workspace (regular members only; Owner must transfer/delete). | Workspace Member |
| `POST` | `/api/workspaces/:id/invitations` | Generate 48-hour single-use invitation link (stores SHA-256 hash). | Workspace Owner |
| `GET` | `/api/workspaces/:id/invitations` | List active pending invitations (hashes never exposed). | Workspace Owner |
| `DELETE`| `/api/workspaces/:id/invitations/:inviteId` | Revoke a pending invitation link. | Workspace Owner |
| `GET` | `/api/workspaces/:id/repos` | List repositories shared in the workspace. | Workspace Member |
| `POST` | `/api/workspaces/:id/repos` | Add public GitHub repository to workspace. | Workspace Member |
| `GET` | `/api/workspaces/:id/repos/:repoId/health` | Calculate live health metrics for workspace repository. | Workspace Member |
| `DELETE`| `/api/workspaces/:id/repos/:repoId` | Remove repository from workspace. | Workspace Owner |
| `POST` | `/api/workspaces/:id/reports` | Generate persistent health report snapshot in workspace. | Workspace Member |
| `GET` | `/api/workspaces/:id/reports` | List persistent health reports saved in workspace. | Workspace Member |
| `GET` | `/api/workspaces/:id/reports/:reportId` | View workspace report snapshot. | Workspace Member |
| `DELETE`| `/api/workspaces/:id/reports/:reportId` | Delete workspace report snapshot. | Workspace Owner |
| `PUT/PATCH`| `/api/workspaces/:id/reports/:reportId` | Strictly rejected (405 Method Not Allowed) to enforce immutability. | N/A |

### Persistent Reports & Comparisons (`/api/reports`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :---: |
| `GET/POST`| `/api/reports/compare` | Compare two historical snapshots (delta, dimensions, transitions). | Authenticated |
| `GET` | `/api/reports/repository-snapshots` | Query historical snapshots available for a repository. | Authenticated |
| `GET` | `/api/reports/personal` | List personal generated report snapshots. | Authenticated |
| `POST` | `/api/reports/personal` | Generate immutable report snapshot for personal saved repo. | Authenticated |
| `GET` | `/api/reports/personal/:id` | View personal report snapshot. | Creator Only |
| `DELETE`| `/api/reports/personal/:id` | Delete personal report snapshot. | Creator Only |
| `GET` | `/api/reports/:id` | Unified report lookup (verifies personal creator or workspace member). | Authenticated |
| `PUT/PATCH`| `/api/reports/:id` | Strictly rejected (405 Method Not Allowed) to enforce immutability. | N/A |

### Invitations (`/api/invitations`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/invitations/validate/:token` | Preview workspace name and inviter before accepting. | Public |
| `POST` | `/api/invitations/accept` | Accept single-use invitation token and join workspace. | Authenticated |

---

## 6. Deterministic Bottleneck Detection Rules

DevPulse uses 100% explainable, deterministic rules without speculative or artificial metrics:

1. **Stale Issues:** Flagged when an open issue has had zero comments or activity for **> 30 days**.
2. **Old Open PRs:** Flagged when a pull request has remained open without merge for **> 14 days**.
3. **Review Inactivity:** Flagged **only** when GitHub review data confirms reviewers were requested and **> 7 days** have passed with zero submitted reviews. *(Invariant: If review data is unavailable from GitHub, review inactivity is strictly not flagged).*

---

## 7. Running Automated Tests

DevPulse maintains a 100% passing test suite across 16 test suites covering security RBAC, immutability, comparisons, and workflows.

The test suite uses `mongodb-memory-server` and does **not** require a running local MongoDB instance.

Run tests from the project root:
```bash
npm test
```

Or run directly from the `server/` directory:
```bash
cd server
npm test
```

Run frontend production build verification:
```bash
npm run build
```

---

## 8. University Submission & Demo Reference

For a step-by-step evaluator demonstration walkthrough with visual highlights and talking points, refer to [`reports/DEV_DEMO_READINESS.md`](reports/DEV_DEMO_READINESS.md).
