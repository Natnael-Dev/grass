# AGENTS.md — always-on rules for Grass (read after every context reset)

1. Master guide: `README.md`. Progress: `tracking/PROGRESS.md`. Approvals/mode: `tracking/USER-APPROVALS.md`. Capabilities: `tracking/CAPABILITIES.md`.
2. Work **one milestone at a time** (`docs/06-delivery/implementation-plan.md`). Gate with evidence before moving on.
3. **Atomic Conventional Commits.** Tests green at every commit. Branch per milestone (`feat/m3-grass-instancing`). Details: `docs/06-delivery/git-and-github-workflow.md`.
4. **Strict mode:** commit locally; at human gates STOP, request a human test; push/PR/merge only after "approved Gx".
5. **Docs first.** Search docs before deciding. Undocumented decisions go to the ADR file; never silently invent. No scope creep.
6. **Verify APIs** (Context7) before using any library call you haven't verified this session.
7. **Look at your output** (Playwright screenshots, console, traces). Never claim success from code reading.
8. **3 attempts max** per failing check, different hypothesis each; then BLOCKERS.md + change approach.
9. Stack is fixed: Vite + TypeScript(strict) + vanilla Three.js + custom GLSL (WebGL2). No React, no backend, no analytics.
10. Use available skills/MCPs/subagents whenever relevant (`docs/07-agent-operations/skills-and-tools-playbook.md`).
11. Never weaken tests/budgets. Never declare done until README §11 is fully satisfied.
12. After `/compact`: re-read AGENTS.md, PROGRESS.md, USER-APPROVALS.md, current milestone only.
