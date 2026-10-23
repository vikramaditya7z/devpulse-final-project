# DevPulse — Agent Directives & Operational Rules

Welcome to **DevPulse** (GitHub Project Health & Collaboration Platform).

As an autonomous AI coding agent in an Antigravity `/goal` loop, you are bound by the mandatory protocols and guidelines documented in this repository.

---

## 1. Prime Directives for All Agents

1. **Read Before Writing:** At the start of every session or iteration, you must read:
   - [`PROJECT.md`](file:///Users/vikramaditya/Desktop/Project/PROJECT.md): Product scope, permission matrix, V1 exclusions, and demo requirements.
   - [`ARCHITECTURE.md`](file:///Users/vikramaditya/Desktop/Project/ARCHITECTURE.md): System boundaries, proposed models, schemas, and API design.
   - [`ENGINEERING_GUIDELINES.md`](file:///Users/vikramaditya/Desktop/Project/ENGINEERING_GUIDELINES.md): Code standards, security rules, and anti-patterns.
   - [`TASKS.md`](file:///Users/vikramaditya/Desktop/Project/TASKS.md): Priority backlog and task dependencies.
   - [`LOOP.md`](file:///Users/vikramaditya/Desktop/Project/LOOP.md): The mandatory 10-step execution cycle.

2. **Inspect Actual Workspace State:**
   - Never assume files, packages, or services exist based on prior chat transcripts.
   - Always verify reality by running file inspections and Git status commands.

3. **Follow the 10-Step Loop:**
   - Select the highest-priority `TODO` task in [`TASKS.md`](file:///Users/vikramaditya/Desktop/Project/TASKS.md) whose dependencies are `DONE`.
   - Implement real, functional code (never placeholders or mock metrics in live workflows).
   - Write automated tests that assert the acceptance criteria.
   - Execute verification commands and report the actual terminal output.
   - Mark tasks `DONE` only when verified. Never mark speculative work as complete.

4. **Security & Data Integrity Invariants:**
   - Always enforce authentication and role-based access control (RBAC) on the backend.
   - Never store plaintext passwords (use `bcrypt`, cost >= 10).
   - Never store plaintext invitation tokens (store only SHA-256 hashes).
   - Never commit `.env` or hardcode secrets in code.
   - Only flag review inactivity when GitHub API review/comment data explicitly confirms inactivity.

5. **No Scope Creep:**
   - Adhere strictly to the explicit V1 scope defined in [`PROJECT.md`](file:///Users/vikramaditya/Desktop/Project/PROJECT.md).
   - Private repositories, GitHub OAuth, chat, AI-generated analysis, and background schedulers are strictly out of scope.

6. **Honest Reporting:**
   - Never claim a command passed if it was not run or failed.
   - If blocked by infrastructure or missing credentials, document the blocker accurately in [`TASKS.md`](file:///Users/vikramaditya/Desktop/Project/TASKS.md) and move to an independent task.
