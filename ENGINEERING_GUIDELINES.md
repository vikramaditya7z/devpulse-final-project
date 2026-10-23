# DevPulse — Engineering Guidelines & Quality Standards

These engineering guidelines establish mandatory coding standards, security requirements, and operational rules for DevPulse. All contributors and autonomous agent loops must strictly adhere to these guidelines.

---

## 1. Core Engineering Principles

1. **Scoped & Incremental Changes:** Focus only on the task at hand. Do not execute broad unsolicited refactorings, rewrite unrelated modules, or add unrequested features.
2. **Clarity Over Cleverness:** Prefer straightforward, idiomatic JavaScript/React over dense abstractions, excessive metaprogramming, or premature micro-optimizations.
3. **Separation of Concerns:**
   - **Frontend:** Presentation, UI component state, user interaction, client-side routing.
   - **Backend Controllers:** HTTP parsing, parameter extraction, status codes, response formatting.
   - **Backend Services:** Pure business logic, external API communication, deterministic calculations.
   - **Backend Models:** Schema validation, constraints, indexes, data persistence.
4. **Preserve Documentation Integrity:** Maintain existing comments, type hints, and docstrings. Update documentation whenever architecture, schema, endpoints, or limitations change.

---

## 2. Security & Data Protection Standards

### 2.1 Server-Side Validation & Input Normalization
- **Rule:** Never trust client-provided data. All inputs (URL parameters, query strings, request bodies) must be validated and sanitized on the backend.
- **Rule:** Reject unknown keys on mutation endpoints. Validate MongoDB ObjectIds with `mongoose.Types.ObjectId.isValid()` before querying.
- **Rule:** Email addresses must be trimmed, validated against an RFC 5322 regex, and lowercased before querying or saving.

### 2.2 Password & Credential Handling
- **Rule:** Passwords must be hashed using `bcrypt` (or `argon2`) with a minimum cost factor of 10 prior to database insertion.
- **Rule:** Password hashes must NEVER be returned in API responses. Mark `passwordHash: { select: false }` or explicitly sanitize user objects before sending JSON.
- **Rule:** Password length must be enforced at a minimum of 8 characters.

### 2.3 Invitation Token Security
- **Rule:** Invitation tokens must be generated using cryptographically secure random bytes (e.g., `crypto.randomBytes(32).toString('hex')`).
- **Rule:** Plaintext tokens must NEVER be stored in the database. Only the SHA-256 hash (`crypto.createHash('sha256').update(token).digest('hex')`) may be persisted.
- **Rule:** When accepting an invite, hash the incoming raw token and query by the hash.

### 2.4 Secrets & Environment Management
- **Rule:** Never commit secrets, API keys, JWT signing keys, or credentials into Git.
- **Rule:** All secrets must be loaded from environment variables via `process.env`.
- **Rule:** Maintain a safe, complete `.env.example` in both root and backend with placeholder values.
- **Rule:** Client-side bundles must never contain backend secrets or GitHub personal access tokens.

### 2.5 Server-Side Authorization Enforcement
- **Rule:** Never rely on frontend UI controls (such as disabling or hiding buttons) as a security boundary.
- **Rule:** Every protected endpoint must verify authentication (`req.user`).
- **Rule:** Every workspace-scoped endpoint must verify workspace membership (`req.membership`).
- **Rule:** Destructive workspace operations (rename, delete, remove member, revoke invite) must verify that `req.membership.role === 'owner'`.

---

## 3. External API & GitHub Integration Standards

### 3.1 Rate Limit Awareness & Respect
- **Rule:** Always inspect GitHub API rate limit headers (`x-ratelimit-remaining`, `x-ratelimit-reset`).
- **Rule:** If the rate limit is exceeded (remaining = 0 or HTTP 403), do not crash or hang. Return an explicit HTTP 429 error with the reset timestamp.
- **Rule:** Support an optional server-side `GITHUB_TOKEN` environment variable to raise rate limits for development and grading.

### 3.2 Controlled Pagination & Timeouts
- **Rule:** Uncontrolled loops over GitHub API pages are strictly forbidden. Bound pagination requests (e.g., maximum 100 items per request, max 1-2 pages for initial metric calculations).
- **Rule:** All outgoing requests to GitHub must have a timeout (maximum 8,000ms) using `AbortController`.

### 3.3 Zero Fabricated Data in Production Paths
- **Rule:** Never return mock, simulated, or fabricated metrics in live application paths.
- **Rule:** If GitHub returns an error (404 Not Found, 403 Rate Limit), communicate that exact error state to the user. Do not substitute synthetic numbers or mock charts.

### 3.4 Explainable & Evidence-Based Bottleneck Detection
- **Rule:** Every bottleneck finding must cite concrete, verifiable data (issue/PR number, timestamps, age in days).
- **CRITICAL DATA RULE:** Review inactivity must ONLY be flagged when GitHub API review or comment records explicitly prove that reviews were requested and zero review submissions occurred. If review data is unavailable or ambiguous, do NOT generate a review inactivity finding.

---

## 4. UI & Frontend Standards

1. **State Completeness:** Every view that fetches asynchronous data must handle four distinct states:
   - **Loading State:** Clear loading spinner or skeleton component.
   - **Empty State:** Informative empty state message with call-to-action (e.g., "No repositories saved yet. Add a public repository above.").
   - **Error State:** Human-readable error message explaining what failed and how to recover.
   - **Success/Content State:** Clean presentation of data.
2. **Responsive & Accessible Design:** Use standard Tailwind CSS utility classes. Ensure all interactive elements have accessible labels, keyboard focus rings, and proper contrast ratios.
3. **No Unhandled Promise Rejections:** All API calls in React components must be wrapped in `try/catch` blocks or handled via custom data hooks with error boundary protection.

---

## 5. Testing & Verification Requirements

1. **Meaningful Test Coverage:**
   - Unit tests must cover deterministic metric calculations and bottleneck rule edge cases.
   - Integration tests must verify authentication, registration, token generation, invite hashing, and RBAC authorization boundaries.
2. **Never Weaken Tests to Force Passes:** Never remove assertions, delete tests, or comment out failing checks just to achieve a passing build. If a test fails, diagnose and fix the underlying implementation.
3. **Honest Verification Reporting:** Never claim a command passed unless it was executed in the workspace and returned an exit code of 0.

---

## 6. Concrete Anti-Patterns & Unacceptable Behavior

To prevent common engineering mistakes, the following behaviors are strictly forbidden:

### ❌ Anti-Pattern 1: Client-Only Authorization
```javascript
// UNACCEPTABLE in React component:
{user.isOwner && (
  <button onClick={() => deleteWorkspace(ws.id)}>Delete Workspace</button>
)}

// ...while the backend endpoint does this:
app.delete('/api/v1/workspaces/:id', authenticateToken, async (req, res) => {
  // BUG: Any authenticated member can delete the workspace because role was not checked!
  await Workspace.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});
```
**Correct Pattern:** Always verify `WorkspaceMember.findOne({ workspaceId, userId: req.user._id, role: 'owner' })` on the server before executing deletion.

---

### ❌ Anti-Pattern 2: Silent Error Swallowing
```javascript
// UNACCEPTABLE:
try {
  const data = await fetchGitHubData(repo);
} catch (error) {
  // BUG: Silent error swallowing returning fake empty metrics
  return { openIssues: 0, openPRs: 0 };
}
```
**Correct Pattern:** Catch the error, log the context, and rethrow or return a structured application error:
```javascript
try {
  const data = await fetchGitHubData(repo);
} catch (error) {
  logger.error(`Failed to fetch GitHub data for ${repo}:`, error.message);
  throw new ExternalServiceError('GitHub API request failed', { cause: error });
}
```

---

### ❌ Anti-Pattern 3: Mocking Live Data When External API Fails
```javascript
// UNACCEPTABLE:
if (response.status === 403) {
  // BUG: Returning fabricated numbers when rate limit is hit
  return { openIssues: 12, openPRs: 4, isMock: true };
}
```
**Correct Pattern:** Bubble up the rate-limit failure to the client:
```javascript
if (response.status === 403) {
  const resetEpoch = response.headers.get('x-ratelimit-reset');
  throw new RateLimitError('GitHub API rate limit exceeded', { resetEpoch });
}
```

---

### ❌ Anti-Pattern 4: Hardcoding Secrets in Code
```javascript
// UNACCEPTABLE:
const JWT_SECRET = 'my-super-secret-jwt-key-12345';
const GITHUB_TOKEN = 'ghp_xxxxxxxxxxxxxxxxxxxx';
```
**Correct Pattern:** Always load from `process.env`:
```javascript
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable is not defined.');
}
```

---

### ❌ Anti-Pattern 5: Storing Plaintext Invite Tokens
```javascript
// UNACCEPTABLE:
await WorkspaceInvitation.create({
  workspaceId,
  token: rawRandomToken // BUG: Storing raw token in database
});
```
**Correct Pattern:** Store only the cryptographic hash:
```javascript
const tokenHash = crypto.createHash('sha256').update(rawRandomToken).digest('hex');
await WorkspaceInvitation.create({
  workspaceId,
  tokenHash,
  expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
});
```
