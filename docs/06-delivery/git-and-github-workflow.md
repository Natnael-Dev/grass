# Git and GitHub Workflow

**Purpose:** how every change reaches GitHub. **Read in:** M0 and before every commit/PR. Use skill `git-workflow-and-versioning`, MCP `github`.

## Principles
Atomic commits · Conventional Commits · trunk-based with short-lived branches · PR per milestone · rebase-merge (keeps atomic history) · **never squash, never force-push `main`** · the human tests before anything is pushed or merged (strict mode).

## Repository bootstrap (M0)
1. Read `Repo:` in `tracking/USER-APPROVALS.md`. If empty, check `git remote -v` and the `github` MCP for an existing repo named `grass` / `Grass` owned by the authenticated user. If none is found, ask the human **once** for the repo URL (recommend creating a new public repo named `grass`). Do not guess.
2. `git init -b main` if needed; first commit `chore: add handoff documentation` containing the docs, tracking files, README, AGENTS.md. Add the remote. Push `main` (this initial docs commit is allowed without a gate).
3. Enable (or ask the human to enable, if the MCP cannot): branch protection on `main` requiring PR + passing CI (`ci` workflow), no force push, allow rebase merging, disable squash/merge-commit merging if possible. Record the result in `CAPABILITIES.md`.
4. Default licence: MIT (ADR-011); add `LICENSE` in M1.

## Branches
`main` (always green/deployable) · work branches `<type>/<milestone>-<slug>` e.g. `feat/m3-grass-instancing`, `fix/m5-trail-overshoot`, `chore/m1-tooling`, `docs/m12-readme`, `test/m12-e2e-fallback`. One branch per milestone; hotfix branches for review-driven changes. Delete after merge.

## Commits
- Format: `type(scope): imperative summary` (<= 72 chars). Types: `feat fix perf refactor test docs build ci chore style revert`. Scopes: `core world grass sky camera input audio ui easter debug build tracking docs`.
- Body (when non-trivial): *why*, trade-offs, references (`Refs: FR-05`, `ADR-012`). Breaking change: `!` + `BREAKING CHANGE:` footer.
- **Atomic:** one logical change; builds, lints and passes tests at that commit (bisectable); tests ship in the *same* commit as the behavior (or red test commit immediately followed by the green commit in TDD—both must still not break CI on the branch tip; prefer same commit); no mixed refactor+feature; no unrelated formatting churn; no "wip", "fix stuff", "update" messages; target diff <= ~300 changed lines (split otherwise).
- Never commit: secrets, `.env`, `node_modules`, `dist`, large binaries (> 200 KB) without an ADR, editor files.
- Tracking updates: separate `chore(tracking): …` commits (not mixed with code).
- Pre-commit hook (Husky + lint-staged): Prettier, ESLint on staged files, `tsc --noEmit`; commit-msg hook validates Conventional Commits (commitlint). Never bypass hooks (`--no-verify` is forbidden).

## Pull requests (one per milestone; opened only after human approval in strict mode)
Title: `feat(m3): grass instancing and wind (G2)`. Use `.github/pull_request_template.md`:
```
## What / Why
## Requirements covered (IDs)
## How to test (commands + what to look at)
## Evidence (paths in tracking/evidence/Mx/, screenshots, trace summary)
## Checklist
- [ ] atomic commits, conventional messages
- [ ] lint, typecheck, unit, e2e green
- [ ] docs/ADR updated if behavior or decisions changed
- [ ] human gate Gx approved (link/quote)
- [ ] no TODO/FIXME without ADR
```
Wait for CI green (poll via `github` MCP). Merge with **rebase and merge**. If the repo disallows it, merge-commit (never squash) and note it in an ADR. If required reviews/permissions block merging, tell the human exactly what to click.

## After merge
`git switch main && git pull --ff-only`; delete local/remote branch; update PROGRESS; start next milestone from fresh main.

## Tags and versions
SemVer. Optional pre-release tags at human-approved milestones (`v0.2.0` after G2, etc.) — not required. `v1.0.0` after G12. Maintain `CHANGELOG.md` (Keep a Changelog format) updated in the same PR as the change set of each milestone.

## Issues
Open GitHub issues (via MCP) for: deferred optional enhancements (OE-xx), discovered non-blocking bugs, human feedback not yet addressed. Link them in PROGRESS.

## Safety rules
No force-push to `main`; no history rewriting after a branch is pushed (before push, interactive cleanup of local commits is allowed to keep them atomic); no deleting remote branches that are not yours/merged; never push credentials; if a push is rejected, `git fetch` + rebase, don't force.
