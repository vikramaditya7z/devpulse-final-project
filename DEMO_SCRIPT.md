# DevPulse — University Capstone Demonstration Video Script

**Project Title:** DevPulse (GitHub Project Health & Collaboration Platform)  
**Target Duration:** 3 to 5 minutes (Target: ~4 minutes)  
**Evaluator Submission Deadline:** October 27, 2026, 11:59 PM IST  
**Demonstration Mode:** Live Web Application (React + Express + MongoDB Atlas)  

---

## 1. Pre-Demo Setup & Environment Checklist

Before recording the screencast:
1. Ensure the production build is fresh:
   ```bash
   npm run build
   ```
2. Start the unified production server:
   ```bash
   npm start
   # Confirms MongoDB Atlas connected and server listening on http://localhost:5001
   ```
3. Open two browser windows side-by-side:
   - **Window 1 (Alice — Team Lead / Workspace Owner):** Standard Chrome window at `http://localhost:5001/login`.
   - **Window 2 (Bob — Team Member / Invitee):** Incognito window at `http://localhost:5001/login`.
4. Keep one public repository identifier ready to analyze:
   - Recommended: `octocat/Hello-World` or a representative student repository (e.g. `facebook/react`).

---

## 2. Timed Demonstration Walkthrough

### Part 1: Project Introduction & Problem Statement (0:00 – 0:45)
- **Visual:** DevPulse Landing / Login Screen (`http://localhost:5001/login`).
- **Narration:**
  > "Hello evaluators, welcome to DevPulse, an explainable GitHub project health and collaboration platform designed for student engineering squads and small software teams.
  >
  > In course projects and capstone teams, collaboration bottlenecks frequently stall progress: pull requests sit unreviewed for weeks, issues grow stale, and teams lack visibility into their repository velocity without paying for complex enterprise analytics tools.
  >
  > DevPulse solves this by connecting directly to the public GitHub REST API, calculating deterministic repository vitals, and flagging collaboration bottlenecks with 100% evidentiary data. Let's demonstrate the full collaboration workflow."

---

### Part 2: Team Lead Onboarding & Personal Health Analysis (0:45 – 1:45)
- **Screen:** Window 1 (Alice).
- **Actions:**
  1. Click **"Create one now"** (`/register`).
  2. Register Alice: Name: `Alice TeamLead`, Email: `alice@university.edu`, Password: `Password123!`. Click **"Create Account"**.
  3. Arrive at the **Personal Dashboard** (`/dashboard`). Point out the empty state with the "Add Repository" prompt.
  4. In the Add Repository card, enter `octocat/Hello-World` and click **"Add to Dashboard"**.
  5. The repository appears instantly with its GitHub metadata (stars, forks, open issues count).
  6. Click **"View Health Analysis"** to open `/repo/:id/health`.
- **Expected UI State:**
  - Health Score banner renders dynamically (e.g. `25 / 100 Needs Attention`).
  - Repository vitals grid displays Open Issues, Open PRs, Merged PRs, Average Merge Time, and Recent Commits.
  - "Identified Collaboration Bottlenecks" section lists deterministic findings with concrete evidence (e.g. `Issue #... has had no comments or updates for over 30 days`).
- **Narration:**
  > "Alice logs in and adds a repository to her personal dashboard. DevPulse queries live GitHub data and deterministically computes repository vitals. Notice our bottleneck detection engine: every finding is explainable and backed by real GitHub timestamps—we never use fabricated mock data or hallucinated summaries."
- **Action:**
  7. Click **"Save Persistent Report"**.
  8. A green banner confirms snapshot generation. Click **"View All Reports"** to view `/reports` and open `/reports/:id`.
- **Narration:**
  > "Alice captures an immutable snapshot of this analysis. Even if subsequent commits occur, this report remains preserved as an official record."

---

### Part 3: Team Workspace & Cryptographic Single-Use Invitation (1:45 – 2:45)
- **Screen:** Window 1 (Alice).
- **Actions:**
  1. Click **"Workspaces"** in the top navigation (`/workspaces`).
  2. Click **"Create Workspace"**, name it `Senior Capstone Team 4`, and click **"Create Workspace"**.
  3. Alice is automatically assigned the **Owner** badge.
  4. Click on the workspace card to open Workspace Detail (`/workspaces/:id`).
  5. Switch to the **Members & Invites** tab.
  6. Click **"Generate Invitation Link"**.
  7. The modal displays the single-use 48-hour invitation link. Click **"Copy Link"**.
- **Narration:**
  > "Next, Alice creates a team workspace. She generates an invitation link. In our architecture, the server generates a 32-byte cryptographically secure random token, but only stores its SHA-256 hash in MongoDB Atlas. The plaintext token is never stored in the database, expires in 48 hours, and is single-use."
- **Screen:** Window 2 (Bob in Incognito).
- **Actions:**
  8. Paste the invite link (`/invite/<rawToken>`).
  9. Bob sees the public workspace preview with workspace name and expiration date.
  10. Bob clicks **"Create Account"**, registers as `Bob Engineer` (`bob@university.edu`, `Password123!`).
  11. Upon registration, Bob is automatically redirected back to the invitation page.
  12. Click **"Accept & Join Workspace"**.
- **Expected UI State:**
  - Bob is accepted and redirected to `/workspaces/:id` as a **Member**.

---

### Part 4: Collaborative Workspace Health & Role-Based Access Control (2:45 – 3:45)
- **Screen:** Window 2 (Bob — Member).
- **Actions:**
  1. In the **Repositories** tab, Bob clicks **"Add Repository"**, enters `octocat/Hello-World`, and adds it to the shared workspace.
  2. Click **"View Health Analysis"** to view `/workspaces/:id/repos/:repoId/health`.
  3. Click **"Save Persistent Report"** to snapshot the workspace health report.
  4. Return to the workspace and switch to the **Persistent Reports** tab. Both Bob and Alice can view the shared historical report.
- **Screen:** Window 2 (Bob — Demonstrating RBAC Enforcement).
- **Actions:**
  5. Switch to **Workspace Settings** tab or attempt to delete a repository. Notice that destructive controls (Delete Workspace, Revoke Invite, Remove Member, Delete Repo) are hidden from regular members.
  6. Even if Bob makes a direct unauthorized API request, the backend's `requireWorkspaceOwner` middleware returns HTTP 403 Forbidden.
- **Screen:** Window 1 (Alice — Owner Control).
- **Actions:**
  7. Alice refreshes her view. Bob appears in the member list with the Member role.
  8. Alice has full owner controls to manage settings, members, and shared resources.
- **Narration:**
  > "Bob adds a repository to the shared workspace and generates a persistent team report. The permission matrix strictly enforces separation: Members can add repos and view health, but only the Owner can remove members, revoke invites, or delete workspace resources. Backend middleware verifies every request."

---

### Part 5: Technical Architecture & Conclusion (3:45 – 4:30)
- **Visual:** Architecture Diagram or Terminal showing tests and production build.
- **Narration:**
  > "Under the hood, DevPulse is built using clean MVC architecture on Node.js, Express, MongoDB Atlas, and React with Vite:
  > - **Authentication:** Stateless signed JWTs stored in secure, HttpOnly, SameSite cookies with bcrypt password hashing.
  > - **Security:** Helmet HTTP security headers, recursive NoSQL injection sanitization, Origin-based CSRF protection, and route rate limiters.
  > - **Testing:** Over 100 automated integration and unit tests passing with 100% success rate.
  > - **Integrity:** Purely deterministic GitHub metrics with explicit evidence—never mock data.
  >
  > DevPulse provides student and software teams with transparent, actionable repository health insights. Thank you for evaluating DevPulse."

---

## 3. Fallback Contingency Plans During Live Recording

| Potential Incident | Immediate Fallback Action |
| :--- | :--- |
| **GitHub API Rate Limit (HTTP 403 / 429)** | DevPulse's dedicated `RateLimitBanner` displays the exact quota reset time. Alternatively, configure a personal `GITHUB_TOKEN` in `server/.env` to immediately raise the rate limit from 60 to 5,000 req/hr. |
| **Network Timeout to GitHub API** | Outbound requests enforce an 8,000ms timeout with an informative error card and a one-click "Retry Analysis" button. |
| **Accidental Cookie Expiration** | The application's `AuthContext` seamlessly clears stale sessions and redirects to `/login` without crashing. |
