# AGENTS.md — always-on rules for Grass (read after every context reset)

1. **Master guides:** `README.md`, `ARCHITECTURE.md`, and `docs/STATE.md`. Progress: `tracking/PROGRESS.md`. Approvals/mode: `tracking/USER-APPROVALS.md`. Capabilities: `tracking/CAPABILITIES.md`.
2. Work **one phase/milestone at a time** (`docs/STATE.md` and `docs/archive/06-delivery/implementation-plan.md`). Gate with evidence in `tracking/evidence/` before moving on.
3. **Atomic Conventional Commits.** Tests green at every commit. Branch per feature/phase (`cleanup/phase-a`). Details: `docs/archive/06-delivery/git-and-github-workflow.md`.
4. **Strict mode:** commit locally; at human gates STOP, request human review; push/PR/merge only after user approval.
5. **Docs first.** Search docs before deciding. Undocumented decisions go to `docs/archive/decisions/architecture-decision-records.md`; never silently invent. No scope creep.
6. **Verify APIs** (Context7) before using any library call you haven't verified this session.
7. **Look at your output** (Playwright screenshots, console, traces). Never claim success from code reading alone.
8. **3 attempts max** per failing check, different hypothesis each; then log to `tracking/BLOCKERS.md` and change approach.
9. Stack is fixed: Vite + TypeScript (strict) + vanilla Three.js + custom GLSL (WebGL2). No React, no backend, no analytics.
10. Use available skills/MCPs/subagents whenever relevant (`docs/archive/07-agent-operations/skills-and-tools-playbook.md`).
11. Never weaken tests/budgets. Never declare done until `npm run check` is 100% green and requirements in `docs/AGENT-README.md` §11 / `docs/STATE.md` are satisfied.
12. After `/compact`: re-read `AGENTS.md`, `docs/STATE.md`, `tracking/PROGRESS.md`, and `tracking/USER-APPROVALS.md`.
