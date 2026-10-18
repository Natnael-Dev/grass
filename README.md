# GRASS — MASTER INSTRUCTIONS FOR THE AI CODING AGENT

> You are the autonomous engineer for **Grass**: a calm, stylized, interactive 3D meadow that runs in the browser, built for developers who need a one-minute break from their screen. This folder is the complete handoff. You do **not** have access to the conversation that produced it, and you do not need it. Everything is written down here.
>
> **Read this file completely before doing anything else. Then follow it literally.**

---

## 0. The one-paragraph product

Grass is a static website (Vite + TypeScript + vanilla Three.js + custom GLSL, WebGL2, no backend, hosted on Vercel). The user clicks **"step outside"** and is in a hill meadow with thousands of shader-animated grass blades, a lone tree, drifting clouds, and three moods (**dawn / golden hour / night with fireflies**). The mouse (or finger) parts the grass; a click scatters seeds; holding the mouse **lies you down** in the grass (camera dip). Procedural audio, a friendly dev-voiced guidance layer, and a few easter eggs complete it. Desktop-first, graceful on mobile. Full detail: `docs/00-product/product-vision.md`.

---

## 1. Prime directives (violating any of these is a failure)

1. **Docs are the source of truth.** If something is specified, implement it exactly. If it is not specified, check the docs again, then follow the *Undocumented Decision Protocol* (§9). Never silently invent.
2. **One milestone at a time.** Milestones are `M0 … M13` in `docs/06-delivery/implementation-plan.md`. Never start milestone N+1 before milestone N's gate is passed, evidenced, logged in `tracking/PROGRESS.md`, and (where required) approved by the human.
3. **No big-bang implementation.** Never write the whole app in one step. Work in small slices: write → run → look → fix → commit.
4. **Evidence or it didn't happen.** A task is "done" only when you have *run* the verification (build, tests, Playwright screenshot you actually *looked at*, trace) and stored the proof in `tracking/evidence/<milestone>/`. Never claim something works from reading code.
5. **Atomic commits, always.** One logical change per commit, Conventional Commits, build+tests green at every commit. Rules: `docs/06-delivery/git-and-github-workflow.md`.
6. **The human tests before anything is pushed or merged** (default mode). See §7 and `tracking/USER-APPROVALS.md`.
7. **Use your tools.** Discover your own capabilities first (§3), then use every relevant skill, MCP server, slash command and subagent *whenever it helps*. Playbook: `docs/07-agent-operations/skills-and-tools-playbook.md`.
8. **Verify library APIs before using them** (Context7 MCP / official docs). Your memory of Three.js APIs may be outdated. Never guess a signature.
9. **Loop until correct, but never loop blindly.** Max 3 failed attempts per gate with *different* hypotheses, then log a blocker and change approach (§8).
10. **Do not stop early.** The `/goal` is complete **only** when §11 is satisfied. Waiting at a human gate is *not* completion and *not* failure.

---

## 2. Re-entry protocol (do this at session start AND after every `/compact` or context reset)

Read, in this order, and nothing else until done:
1. `AGENTS.md` (short rules).
2. `tracking/PROGRESS.md` (where you are, what's next, open blockers).
3. `tracking/USER-APPROVALS.md` (autonomy mode + approvals).
4. The current milestone section in `docs/06-delivery/implementation-plan.md` and the docs it lists under **Read**.

Then continue from the first unchecked item in PROGRESS.md. Do not restart finished work. Do not re-read the entire docs tree every time (context is precious).

---

## 3. First actions (Milestone M0) — in this exact order

1. Read this README fully, then `AGENTS.md`, then `docs/07-agent-operations/capability-discovery.md`.
2. **Discover your capabilities** exactly as that doc says: inventory skills, MCP servers, slash commands, runtime (Node, npm/pnpm, git, OS, network). Read your own `antigravity-guide` and `agy-customizations` skills to learn the *real* syntax of `/goal`, `/plan`, `/teamwork-preview`, subagents, etc. Smoke-test each MCP you will need (github, vercel, playwright, chrome-devtools, context7). Write results to `tracking/CAPABILITIES.md`.
3. Read, in order, the **full** reading list in §4 once (skim the rest of the docs; you will re-read each when its milestone starts).
4. Use `/plan` (or your planning facility) to produce `tracking/plans/M0.md`, then execute M0.
5. Never skip to coding before `tracking/CAPABILITIES.md` exists and PROGRESS.md shows M0 started.

---

## 4. Documentation map and reading order

**Initial read (M0), in this order:**

| # | File | Why |
|---|------|-----|
| 1 | `README.md` (this) | Rules and workflow |
| 2 | `AGENTS.md` | Condensed always-on rules |
| 3 | `docs/00-product/product-vision.md` | What and why |
| 4 | `docs/00-product/requirements.md` | The numbered requirements (FR/NFR IDs) |
| 5 | `docs/00-product/scope-and-roadmap.md` | MVP vs optional vs non-goals |
| 6 | `docs/07-agent-operations/*` (all 5 files) | How to operate |
| 7 | `docs/06-delivery/implementation-plan.md` | The milestone list |
| 8 | `docs/06-delivery/git-and-github-workflow.md` | Commits, branches, PRs |

**Just-in-time (read when the milestone's "Read" line says so):**

| Area | Files |
|------|-------|
| Design | `docs/01-design/art-direction.md`, `ui-ux-specification.md`, `design-system.md`, `motion-and-interactions.md`, `audio-design.md`, `copywriting.md`, `asset-specification.md` |
| Architecture | `docs/02-architecture/technology-decisions.md`, `system-architecture.md`, `performance-strategy.md` |
| Frontend | `docs/03-frontend/scene-and-camera.md`, `environment-and-grass.md`, `input-and-controls.md`, `state-and-ui-components.md`, `responsive-and-accessibility.md` |
| Backend | `docs/04-backend/no-backend.md` (decision: there is none) |
| Quality | `docs/05-quality/testing-strategy.md`, `acceptance-criteria.md`, `performance-benchmarks.md`, `code-quality-standards.md` |
| Delivery | `docs/06-delivery/development-setup.md`, `deployment.md` |
| Decisions | `docs/decisions/architecture-decision-records.md` |

Precedence when documents appear to conflict: `requirements.md` > `acceptance-criteria.md` > design docs > architecture docs > frontend docs > everything else. Log any conflict you find (§9).

---

## 5. The milestone workflow loop (repeat for every milestone)

```
A. SYNC      Re-entry protocol (§2). Create branch from up-to-date main.
B. PLAN      Read the milestone's docs. Run /plan -> tracking/plans/Mx.md (tasks, atomic-commit list, risks, parallelizable work).
C. BUILD     Implement task by task. For logic: TDD (red-green-refactor, use the `tdd` skill). After EACH task:
               run lint + typecheck + unit tests; run the dev server and LOOK at it (Playwright screenshot / browser);
               commit atomically.
D. SWARM     Where the plan marks work parallelizable, delegate to subagents (§10). Lead integrates.
E. VERIFY    Run the milestone Gate commands verbatim. Capture evidence into tracking/evidence/Mx/.
F. REVIEW    Review swarm: adversarial code review + anti-slop audit + a11y/perf lens (bmad-code-review, bmad-review,
             anti-ai-slop-auditor). Fix findings, re-run Gate.
G. RECORD    Update tracking/PROGRESS.md and tracking/TRACEABILITY.md (requirement IDs -> evidence).
H. HUMAN GATE  If the milestone has a human gate and MODE is strict: STOP and ask the human to test (§7).
I. SHIP      After approval: push branch, open PR, wait for CI green, merge (rebase-merge; never squash), delete branch.
J. NEXT      Sync main, update PROGRESS, start the next milestone.
```

A milestone is never "mostly done". It is gated or it is not done.

---

## 6. Milestones at a glance (details in the plan)

| M | Name | Human gate |
|---|------|-----------|
| M0 | Capability discovery, repo + GitHub bootstrap | no |
| M1 | Tooling scaffold, CI, quality hooks | no |
| M2 | Render core: loop, terrain, sky, ridges, tree, camera | **G1** |
| M3 | Grass instancing + wind | **G2** |
| M4 | Mood system (dawn / golden / night) | **G3** |
| M5 | Brush interaction + hand cursor | **G4** |
| M6 | Lie-down camera dip, parallax, idle drift | **G5** |
| M7 | Seed scatter + fireflies | **G6** |
| M8 | UI shell, hints, how-it-works, uptime, easter eggs, 404 | **G7** |
| M9 | Procedural audio (+ optional CC0 samples) | **G8** |
| M10 | Mobile/touch, accessibility, reduced motion, fallbacks | **G9** |
| M11 | Performance tuning + adaptive quality | **G10** |
| M12 | Hardening + full QA audit + traceability | **G11** |
| M13 | Release: Vercel preview, final test, production, v1.0.0 | **G12 (final)** |

---

## 7. Human gates and autonomy mode

`tracking/USER-APPROVALS.md` contains `MODE: strict` (default). 

- **strict:** at each human gate, you stop *after* all automated checks pass and *before* pushing. You commit locally only. You then print a **Human Test Request** (template in `docs/07-agent-operations/checkpoint-and-gate-protocol.md`): the exact command to run, the URL, what to try, what "good" looks like, known limitations. You then wait for the human to reply "approved Gx" (or to write it in USER-APPROVALS.md) or to request changes. Requested changes become new atomic commits, then re-verify, then re-request.
- **trust:** (only if the human changes MODE to `trust`) after automated gates and review pass, you push, open the PR, merge it yourself, and continue. The human tests later; their feedback becomes fix tasks.

Waiting at a gate = stop output and do not start the next milestone. Do not pretend approval. Never write "approved" yourself.

---

## 8. Loop rules (retries, blockers, anti-spin)

- A failing gate: diagnose with the `diagnosing-bugs` skill (multi-hypothesis). Record each attempt in `tracking/PROGRESS.md` (attempt #, hypothesis, change, result).
- **Max 3 attempts per failing check**, each with a *different* hypothesis. After 3: write `tracking/BLOCKERS.md` entry, use `/boost` for one deep re-think, and try a fundamentally different approach (simpler technique, reduced scope within the documented fallback). If still blocked: ask the human one precise question with a recommendation, and continue with unblocked work if any exists.
- Never weaken a test, gate, budget or requirement to make it pass. Never delete a failing test. Never comment out checks. If a requirement is genuinely wrong, use the Undocumented Decision Protocol.
- Never repeat the same command hoping for a different result. Never "fix" by adding try/catch that hides errors.
- Context hygiene: run `/compact` when context is heavy (~70%), then do the Re-entry protocol.

---

## 9. Undocumented Decision Protocol

When the docs are silent, ambiguous or contradictory:
1. Search the docs (`grep -ri`). 2. Prefer the simplest option consistent with `docs/00-product/product-vision.md` principles. 3. Record it as a numbered entry in `docs/decisions/architecture-decision-records.md` (status: *agent-proposed*) and a line in PROGRESS.md. 4. If it is user-visible, costly, or hard to reverse: ask the human (one question, with recommendation) before building on it. 5. Never expand MVP scope: anything in `scope-and-roadmap.md` marked Optional/Future/Non-goal stays out unless the human approves.

---

## 10. Skills, MCP servers, commands, subagents (summary)

Full detail in `docs/07-agent-operations/skills-and-tools-playbook.md` and `subagent-orchestration.md`.

- Re-check your skill list at the start of **every milestone**; invoke every skill that matches (frontend-design, threeui-designcode, micro-interactions-motion, tdd, webapp-testing, web-perf, security-and-hardening, git-workflow-and-versioning, setup-pre-commit, codebase-design, diagnosing-bugs, anti-ai-slop-auditor, bmad-code-review, bmad-review, bmad-qa-generate-e2e-tests, bmad-walkthrough, bmad-project-context, ...).
- MCP: `context7` (verify APIs/versions), `playwright` + `chrome-devtools-mcp` (look at it, trace it), `github` (branches/PRs/CI), `vercel` (deploy).
- Commands: `/plan` each milestone, `/teamwork-preview` for parallel subagents, `/boost` for hard problems, `/compact` for context, `/learn` to persist the user's working rules, `/browser` for research, `/goal` is your outer loop.
- You may discover or add other tools yourself if they help (free, no secrets). Anything needing credentials or cost: ask the human.
- Not relevant here (do **not** use): Cloudflare*, Supabase*, Render, UptimeRobot, Next.js-on-Cloudflare, Sandbox*, Turnstile, Google Workspace skills. Deploy target is Vercel only.

---

## 11. Definition of Done for the whole `/goal`

The goal is complete **only when ALL are true** (verify each, with evidence, in the final audit of M12/M13):
- [ ] Every milestone M0–M13 is checked in `tracking/PROGRESS.md` with evidence links.
- [ ] Every requirement ID in `tracking/TRACEABILITY.md` is `PASS` with evidence (no blanks, no "assumed").
- [ ] Every acceptance criterion in `docs/05-quality/acceptance-criteria.md` passes.
- [ ] Performance budgets in `docs/05-quality/performance-benchmarks.md` are met or have a human-approved waiver.
- [ ] All human gates G1–G12 approved (strict) or the human has explicitly accepted trust mode.
- [ ] CI green on `main`; no console errors; Lighthouse targets met.
- [ ] Production deployed on Vercel, smoke-tested by Playwright against the production URL, `v1.0.0` tagged, release notes written.
- [ ] Public-facing `README.md` created (this file moved to `docs/AGENT-README.md`; `AGENTS.md` updated to point there), CHANGELOG complete.
- [ ] You re-read all of `requirements.md` and `acceptance-criteria.md` one final time and found nothing unmet.

Then, and only then, report completion with a summary table.

---

## 12. Forbidden

Pushing/merging before approval (strict) · force-pushing `main` · squash-merging · committing secrets, `node_modules`, `dist` · adding analytics/trackers/cookies · adding a backend · adding React/Next/R3F/postprocessing/physics libraries · adding npm dependencies not listed in `technology-decisions.md` without an ADR · editing docs to hide a failure · declaring done early · stubs/fake interactivity/placeholder "TODO" features shipped as complete · copying the layout, copy or assets of any existing "touch grass" website.

---

## 13. The command to start (the human will paste this)

> **/goal** Read README.md first and follow all instructions and documentation to build the project step by step.
