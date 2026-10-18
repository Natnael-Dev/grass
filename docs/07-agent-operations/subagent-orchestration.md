# Subagent Orchestration ("swarm") Protocol

**Purpose:** use parallel subagents without chaos. Learn the real mechanism via `/teamwork-preview` and the guide skill (M0). If subagents are unavailable, run the same roles sequentially, each in its own explicit pass with a written report.

## Roles and ownership (file boundaries prevent conflicts)
| Role | Owns | Typical work |
|---|---|---|
| **Lead** (you) | `src/app/**`, `src/main.ts`, config files, `docs/**`, `tracking/**`, integration | planning, interfaces, merging, gates |
| **Graphics** | `src/world/**`, `src/camera/**` (shaders, scene) | M2–M7 rendering |
| **Interaction** | `src/input/**`, `src/core/**` | pointer, gestures, loop, quality |
| **UI** | `src/ui/**`, `public/*.html`, CSS | M8, M10 |
| **Audio** | `src/audio/**` | M9 |
| **QA** | `tests/**`, `playwright.config.ts`, `vitest.config.ts` | tests, evidence, a11y/perf checks |
| **Reviewers (3 lenses)** | read-only (write reports only) | see below |

## Rules
1. Lead writes a **brief** per subagent in `tracking/briefs/Mx-<role>.md`: objective, exact files owned, interfaces to implement/consume (TypeScript signatures), requirement IDs, tests required, definition of done, what NOT to touch.
2. Define shared interfaces **before** fan-out (e.g., `System`, `MoodState`, store actions, event names). Interface changes go through the Lead only.
3. Max 4 concurrent subagents. Each works on its own branch/worktree if the platform supports it (`feat/mX-<slug>-<role>`), otherwise strictly separate files. Two agents never edit the same file.
4. Subagent reports land in `tracking/reports/Mx-<role>.md`: what changed, commits, commands run, results, open issues. The Lead verifies by *running* checks, not by trusting reports.
5. The Lead integrates (rebase/merge sub-branches into the milestone branch preserving atomic commits), resolves conflicts, runs the full gate.
6. Subagents obey every README rule (atomic commits, evidence, no scope creep, no pushing before approval).
7. Don't parallelize tightly coupled work (e.g., the grass shader and trail uniform layout) — sequence it.

## Review swarm (every milestone, before the human gate)
Spawn three read-only reviewers in parallel, each with a different lens and a fresh context:
1. **Correctness & performance:** logic errors, race conditions, per-frame allocations, GPU resource leaks, math/edge cases (`bmad-code-review` edge-case lens, `diagnosing-bugs` mindset).
2. **UX, accessibility & spec conformance:** compare behavior with design/requirements docs; keyboard/reduced-motion/contrast; copy exactness (`bmad-review`, `bmad-walkthrough`).
3. **Code quality & slop:** dead code, fake interactivity, duplication, naming, layering, security (`anti-ai-slop-auditor`, `security-and-hardening`, `codebase-design`).
Each writes findings with severity (blocker/major/minor) to `tracking/reports/Mx-review-<lens>.md`. Lead triages: fix blockers/majors (new atomic commits), log minors as GitHub issues or fix if trivial; re-run the gate.

## Anti-patterns
Fan-out before interfaces exist · subagents "fixing" each other's files · trusting a subagent's "done" without running the gate · spawning agents just to look busy · leaving agents running across a human gate.
