# DevPulse — Antigravity `/goal` Loop Execution Protocol

This document defines the strict, repeatable operational protocol for all autonomous Antigravity `/goal` execution loops on the DevPulse project. Every agent iteration must follow this step-by-step cycle without deviation.

---

## 1. Ten-Step Iteration Protocol

```
+-------------------------------------------------------------+
| 1. Read Project Documentation                               |
|    (PROJECT.md, ARCHITECTURE.md, GUIDELINES, TASKS.md)      |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
| 2. Inspect Workspace State & Git Status                     |
|    (Verify actual files, git status, environment)           |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
| 3. Select Highest-Priority Ready Task                       |
|    (Highest priority P0 > P1 whose dependencies are DONE)    |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
| 4. Bound the Work Scope                                     |
|    (Scope strictly to what can be finished & verified now)  |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
| 5. Implement Actual Functionality                           |
|    (Write real, functional code; NO placeholders or mocks)  |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
| 6. Add or Update Automated Tests                            |
|    (Unit / integration tests meeting acceptance criteria)   |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
| 7. Execute Verification Commands                            |
|    (Run real test/build commands; record actual output)     |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
| 8. Diagnose & Remediate Failures                            |
|    (Investigate root cause; fix code, NEVER weaken tests)   |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
| 9. Update Task Backlog & Docs                               |
|    (Mark task DONE in TASKS.md only after verification)     |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
| 10. Generate Structured Iteration Report                    |
|     (Changed files, verified checks, blockers, next task)   |
+-------------------------------------------------------------+
```

### Step 1: Read Project Documentation
Before modifying any files, read `PROJECT.md`, `ARCHITECTURE.md`, `ENGINEERING_GUIDELINES.md`, and `TASKS.md` to establish context, architectural boundaries, and coding rules.

### Step 2: Inspect Actual Workspace State
Run commands (e.g., `git status`, directory listing) to inspect the current filesystem. Never rely on assumptions or stale memory from prior iterations. Verify which files, packages, and services actually exist.

### Step 3: Identify the Next Unfinished Task
Examine `TASKS.md`. Identify the highest-priority task (`P0` before `P1`, etc.) marked `TODO` whose dependencies are all marked `DONE`. If a task is marked `BLOCKED`, evaluate whether the blocker can now be resolved or select the next unblocked ready task.

### Step 4: Bound the Work Scope
Select a single, well-defined task or cohesive sub-task that can be completely implemented, tested, and verified within the current session. Do not attempt to tackle an entire multi-task phase in a single iteration.

### Step 5: Implement Real Functionality
Write clean, robust, and maintainable code adhering to `ENGINEERING_GUIDELINES.md`. Never use placeholders, `TODO` stub comments in lieu of implementation, or fake/mock metrics in production code paths.

### Step 6: Add or Update Automated Tests
Write corresponding unit or integration tests that directly assert the task's acceptance criteria. Ensure tests cover both happy paths and edge/error cases (e.g., invalid input, unauthorized access).

### Step 7: Execute Verification Commands
Run the actual verification commands (e.g., `npm test`, `npm run build`, `npm run lint`) inside the workspace terminal. Capture and evaluate the real terminal output and exit codes.

### Step 8: Diagnose and Fix Failures
If any test or build check fails:
- Diagnose the root cause from the error trace.
- Fix the implementation code.
- **NEVER** delete tests, comment out failing assertions, or relax security checks just to make tests pass.
- If an external blocker prevents resolution after multiple reasonable attempts, mark the task `BLOCKED` in `TASKS.md`, document the exact blocker, and transition to an independent task.

### Step 9: Update Task Tracking & Documentation
- Once all acceptance criteria are verified by passing automated checks, update the task's status in `TASKS.md` from `TODO` or `IN_PROGRESS` to `DONE`.
- If an architectural decision or schema was refined during implementation, update `ARCHITECTURE.md` and `PROJECT.md` accordingly.

### Step 10: Deliver Structured Iteration Report
Output a clear, factual summary using the mandatory report template below.

---

## 2. Inviolable Operational Rules

1. **Zero Fabrication:** Never claim a command passed, a test succeeded, or a file exists unless verified by executing real commands.
2. **Acceptance Criteria Gate:** A task must NEVER be marked `DONE` in `TASKS.md` unless all its documented acceptance criteria have been verified.
3. **No Test Weakening:** Never modify test assertions to expect incorrect behavior or bypass security rules.
4. **Scope Discipline:** Do not introduce unrequested features, private repo support, chat tools, or AI dependencies. DevPulse V1 is strictly bounded.
5. **No Infinite Loops:** Do not endlessly repeat the exact same failed command or editing strategy. If a command fails twice for the same reason, analyze the root cause and alter the approach.
6. **Preserve Workspace Integrity:** Never run destructive Git commands (`git reset --hard`, `git clean -fd`) that risk deleting uncommitted user work without explicit instruction.
7. **Runnable Application State:** Ensure the repository remains in a coherent, buildable, and runnable state at the conclusion of every iteration.

---

## 3. Mandatory Iteration Report Template

At the conclusion of every `/goal` loop turn, the agent must output a summary adhering to this structure:

```markdown
### DevPulse Iteration Summary — [TASK-ID]: [Task Title]

- **Task Status:** [DONE | IN_PROGRESS | BLOCKED]
- **Files Modified / Created:**
  - `path/to/file1.ext` (Description of change)
  - `path/to/file2.ext` (Description of change)
- **Key Behavior Implemented:**
  - Brief, bulleted list of functional logic implemented.
- **Verification Checks Executed:**
  - Command: `npm test path/to/test.js` -> Result: PASS (X tests passed, 0 failed)
  - Command: `npm run build` -> Result: SUCCESS (exit code 0)
- **Blockers / Unresolved Issues:**
  - None (or detail any environmental/credential blockers)
- **Next Logical Task:**
  - `[TASK-ID]`: [Title of next ready task from TASKS.md]
```
