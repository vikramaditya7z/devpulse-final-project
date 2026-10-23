# DevPulse — GitHub Project Health & Collaboration Platform

DevPulse is a collaborative web platform designed for student and small engineering teams to monitor public GitHub repositories, calculate deterministic health metrics, and pinpoint collaboration bottlenecks (stale issues, old unmerged pull requests, and review deadlocks).

Built for a university end-term software engineering capstone project (Due: October 27, 2026).

---

## 1. Tech Stack Overview

- **Frontend:** React 18 (Vite SPA), Tailwind CSS, Lucide Icons, React Router DOM v6
- **Backend:** Node.js (v24), Express.js (MVC Architecture)
- **Database:** MongoDB & Mongoose ODM
- **Authentication:** Direct Express + bcrypt password hashing + signed JSON Web Tokens (JWT) in secure HttpOnly cookies + cookie-parser
- **External Integration:** GitHub REST API v3 (`https://api.github.com`)
- **Testing:** Jest, Supertest, MongoDB In-Memory Server (`mongodb-memory-server`)

---

## 2. Project Architecture & Directory Layout

```
DevPulse/
├── client/                     # Frontend React + Vite SPA
│   ├── src/
│   │   ├── components/         # Reusable UI (Navbar, MetricCard, FindingsSection, ProtectedRoute)
│   │   ├── context/            # AuthContext (user session, login, register, logout)
│   │   ├── pages/              # Login, Register, Dashboard, RepoHealth, QuickAnalyze, NotFound
│   │   ├── services/           # API client with credentials support (authApi, repoApi)
│   │   ├── App.jsx             # React routing & layout wrapper
│   │   └── main.jsx            # Entry point
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
│
├── server/                     # Backend Express REST API
│   ├── config/
│   │   └── db.js               # Mongoose connection & lifecycle management
│   ├── controllers/
│   │   ├── authController.js   # Register, Login, Me, Logout
│   │   └── repoController.js   # Save repo, list repos, health analysis, delete repo
│   ├── middlewares/
│   │   ├── authMiddleware.js   # HttpOnly cookie JWT verification & req.user attachment
│   │   └── errorHandler.js     # Centralized error formatting & HTTP status codes
│   ├── models/
│   │   ├── User.js             # User schema with bcrypt pre-save hashing & safe JSON serialization
│   │   └── SavedRepository.js  # Saved public repository schema with per-user compound unique index
│   ├── routes/
│   │   ├── authRoutes.js       # /api/auth endpoints
│   │   └── repoRoutes.js       # /api/repos endpoints
│   ├── services/
│   │   ├── githubService.js    # Direct GitHub REST API v3 client with in-memory TTL caching
│   │   └── analysisService.js  # Pure deterministic metrics & bottleneck calculations
│   ├── utils/
│   │   └── jwt.js              # Token signing, verification, and cookie helper
│   ├── tests/                  # Automated Jest + Supertest suites
│   ├── app.js                  # Express middleware & route definitions (exported for testing)
│   ├── index.js                # Server entrypoint & DB connection bootstrap
│   ├── .env.example
│   └── package.json
│
├── .gitignore
├── PROJECT.md                  # Product scope, permission matrix, demo flow
├── ARCHITECTURE.md             # System boundaries & schema design
├── ENGINEERING_GUIDELINES.md   # Coding standards & anti-patterns
├── TASKS.md                    # Implementation backlog & tracking
├── LOOP.md                     # Antigravity goal execution loop protocol
├── AGENTS.md                   # Agent directives
└── package.json                # Root project orchestration scripts
```

---

## 3. Environment Variables Configuration

### Backend (`server/.env`)

Copy `server/.env.example` to `server/.env`:

```bash
cp server/.env.example server/.env
```

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | Port for the backend server | `5001` |
| `MONGO_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/devpulse` |
| `JWT_SECRET` | Secret key used to sign JWTs (min 32 chars) | `devpulse_jwt_secret_dev_key_at_least_32_chars_long` |
| `JWT_EXPIRES_IN` | Token expiration duration | `24h` |
| `COOKIE_SECURE` | Set to `true` in production with HTTPS | `false` |
| `CLIENT_URL` | Frontend origin for CORS | `http://localhost:5173` |
| `GITHUB_TOKEN` | *(Optional)* GitHub Personal Access Token to raise rate limits | `ghp_...` |

### Frontend (`client/.env`)

Copy `client/.env.example` to `client/.env`:

```bash
cp client/.env.example client/.env
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base URL for backend API calls | `/api` (proxied by Vite) or `http://localhost:5001/api` |

---

## 4. Installation & Quickstart

### Step 1: Install all dependencies

From the project root:

```bash
npm run install:all
```

Or individually:
```bash
cd server && npm install
cd ../client && npm install
```

### Step 2: Start MongoDB
Ensure a MongoDB instance is accessible (e.g. local MongoDB service on `mongodb://127.0.0.1:27017/devpulse` or a MongoDB Atlas URI configured in `server/.env`).

> **Note for Testing:** The automated test suite uses `mongodb-memory-server` and does **not** require a running local MongoDB daemon to execute tests.

### Step 3: Run the Application

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

---

## 5. API Overview

All API responses follow a consistent JSON envelope format:
- Success: `{ "success": true, "data": { ... } }`
- Error: `{ "success": false, "error": { "code": "...", "message": "..." } }`

### Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/register` | Register new user (name, email, password min 8 chars). Sets HttpOnly JWT cookie. | No |
| `POST` | `/api/auth/login` | Authenticate with email/password. Sets HttpOnly JWT cookie. | No |
| `GET` | `/api/auth/me` | Retrieve authenticated user profile. | Yes (Cookie) |
| `POST` | `/api/auth/logout` | Clears authentication cookie. | Yes (Cookie) |

### Repository Health Endpoints (`/api/repos`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/repos` | Save public repo by `{ repoIdentifier }` (e.g., `owner/repo` or full URL). Verifies on GitHub. | Yes |
| `GET` | `/api/repos` | List current user's saved repositories. | Yes |
| `GET` | `/api/repos/:id/health` | Calculate deterministic metrics & bottlenecks for a saved repo. | Yes |
| `POST` | `/api/repos/analyze` | Run on-demand health analysis on any public repo without saving. | Yes |
| `DELETE`| `/api/repos/:id` | Remove a repository from user's dashboard (verifies user ownership). | Yes |

### Team Workspace Endpoints (`/api/workspaces`)

| Method | Endpoint | Description | Role / Auth |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/workspaces` | Create workspace; creator automatically assigned Owner role. | Authenticated User |
| `GET` | `/api/workspaces` | List all workspaces accessible to current user with role badges. | Authenticated User |
| `GET` | `/api/workspaces/:id` | Get workspace details and member list. | Workspace Member |
| `PATCH`| `/api/workspaces/:id` | Rename workspace name and description. | Workspace Owner |
| `DELETE`| `/api/workspaces/:id` | Delete workspace and cascade-delete memberships, invites, repos, and reports. | Workspace Owner |
| `GET` | `/api/workspaces/:id/members` | List workspace members with roles. | Workspace Member |
| `DELETE`| `/api/workspaces/:id/members/:userId` | Remove member from workspace (cannot remove owner). | Workspace Owner |
| `POST` | `/api/workspaces/:id/leave` | Leave workspace (regular members only). | Workspace Member |
| `POST` | `/api/workspaces/:id/invitations` | Generate 48h single-use invitation link (stores SHA-256 hash). | Workspace Owner |
| `GET` | `/api/workspaces/:id/invitations` | List pending invitations (never leaks token hashes). | Workspace Owner |
| `DELETE`| `/api/workspaces/:id/invitations/:inviteId` | Revoke an active invitation. | Workspace Owner |
| `GET` | `/api/workspaces/:id/repos` | List repositories shared with the workspace. | Workspace Member |
| `POST` | `/api/workspaces/:id/repos` | Add public GitHub repository to workspace. | Workspace Member |
| `DELETE`| `/api/workspaces/:id/repos/:repoId` | Remove repository from workspace. | Workspace Owner |
| `GET` | `/api/workspaces/:id/repos/:repoId/health` | Calculate live health metrics for workspace repo. | Workspace Member |
| `GET` | `/api/workspaces/:id/reports` | List persistent health reports for workspace. | Workspace Member |
| `POST` | `/api/workspaces/:id/reports` | Generate persistent health report snapshot in workspace. | Workspace Member |
| `DELETE`| `/api/workspaces/:id/reports/:reportId` | Delete workspace report snapshot. | Workspace Owner |

### Persistent Health Report Endpoints (`/api/reports`)

| Method | Endpoint | Description | Role / Auth |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/reports/personal` | List personal generated report snapshots. | Authenticated User |
| `POST` | `/api/reports/personal` | Generate immutable report snapshot for personal saved repo. | Authenticated User |
| `GET` | `/api/reports/personal/:id` | View personal report snapshot. | Creator Only |
| `DELETE`| `/api/reports/personal/:id` | Delete personal report snapshot. | Creator Only |
| `GET` | `/api/reports/:id` | Unified report lookup (verifies personal creator or workspace membership). | Authenticated User |

### Invitation Endpoints (`/api/invitations`)

| Method | Endpoint | Description | Role / Auth |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/invitations/validate/:token` | Preview invitation workspace details before joining. | Public |
| `POST` | `/api/invitations/accept` | Accept single-use invitation and join as Workspace Member. | Authenticated User |

---

## 6. Deterministic Bottleneck Detection Rules

DevPulse uses 100% explainable, deterministic rules without artificial hallucinations or mock metrics:

1. **Stale Issues:** Flagged when an open issue has had zero comments or updates for **> 30 days**.
2. **Old Open PRs:** Flagged when a pull request has been open without merge for **> 14 days**.
3. **Review Inactivity:** Flagged **only** when GitHub review data is explicitly verified, reviewers were requested, and **> 7 days** have elapsed with zero review submissions. *(Invariant: If review data is unavailable, the review inactivity flag is strictly omitted).*

---

## 7. Running Automated Tests

Run backend tests from the project root:

```bash
npm test
```

Or from the `server/` directory:
```bash
cd server
npm test
```

Run frontend production build verification:
```bash
npm run build
```
