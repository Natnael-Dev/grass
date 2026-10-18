# Skills, MCPs and Commands Playbook

**Purpose:** use your full toolkit deliberately. At the start of each milestone, scan your skill list and invoke every one that matches; the table is a starting point, not a limit. If a skill exists that is not listed here and is relevant, use it.

## Skills (as observed in the human's Antigravity install; verify in CAPABILITIES.md)
| Need | Skill |
|---|---|
| Visual/UI design quality, avoid templated look | `frontend-design`, `threeui-designcode` (glass/3D UI), `micro-interactions-motion` (apply spring/physics principles in vanilla code; do not add its React/Framer dependencies) |
| Test-first development | `tdd` |
| Browser verification, screenshots, console | `webapp-testing` + `playwright` MCP |
| Performance, Core Web Vitals, Lighthouse | `web-perf` + `chrome-devtools-mcp` |
| Hard bugs / regressions | `diagnosing-bugs` |
| Architecture, module seams | `codebase-design`, `improve-codebase-architecture` |
| Code review (multi-lens) | `bmad-code-review`, `bmad-review` |
| Anti-boilerplate/fake-interactivity audit | `anti-ai-slop-auditor` |
| Security | `security-and-hardening` |
| Git, branches, PRs, semver, changelog | `git-workflow-and-versioning` |
| Hooks and pre-commit | `setup-pre-commit` |
| E2E test generation | `bmad-qa-generate-e2e-tests` |
| Reviewer walkthroughs for the human's testing | `bmad-walkthrough` |
| Repo agent-instructions upkeep | `bmad-project-context` |
| Requirement sanity / pre-mortem on risky decisions | `bmad-advanced-elicitation` |
| Library research | `bmad-deep-recon` (only if Context7 insufficient) |
| Learn Antigravity itself | `antigravity-guide`, `agy-customizations` |
| Diagrams/visual explanations for the human if useful | `generative_ui` |
**Not relevant (do not use):** cloudflare*, wrangler, workers-*, durable-objects, agents-sdk, sandbox*, supabase*, turnstile-spin, nextjs-on-cloudflare, android-cli, g* Google Workspace skills, bento-dashboard-architecture, automation/`/schedule` (unless the human asks).

## MCP servers
| MCP | Use |
|---|---|
| `context7` | Before using any library API not verified this session; before pinning versions |
| `playwright` | Launch app, interact, screenshot, read console, network assertions. **Look at the screenshots.** |
| `chrome-devtools-mcp` | Performance traces, heap snapshots, network, console |
| `github` | Branches, PRs, CI status polling, issues, releases, branch protection |
| `vercel` | Project link, preview/production deploys, deployment logs |
Others installed (supabase, render, cloudflare-docs, uptimerobot) are irrelevant to this project.

## Slash commands
| Command | When |
|---|---|
| `/goal` | the outer autonomous loop; do not end it before README §11 |
| `/plan` | start of every milestone → `tracking/plans/Mx.md` |
| `/teamwork-preview` | parallel subagents per the orchestration doc |
| `/boost` | after 2 failed attempts on a hard problem (shader math, perf, racing animations) or before irreversible decisions |
| `/compact` | context ~70% full; then run the re-entry protocol |
| `/learn` | persist the human's corrections/preferences immediately when given |
| `/browser` | research docs/techniques on the web |
| `/grill-me` | only when you must interview the human about a blocking ambiguity; prefer one precise question otherwise |
| `/plugin` | only if a plugin clearly helps; ask first |

## Working tips for a fast model (Gemini Flash)
- Patch files; do not rewrite whole files for small edits. `grep` before creating anything (avoid duplicates). View a file before editing it.
- After every edit run the quickest relevant check (`tsc --noEmit`, unit test) — fail fast.
- Keep the dev server running in the background; reload and screenshot after visual changes.
- Read full error messages; fix the first error first.
- Don't hallucinate APIs: Context7 first. Three.js changes between releases (colour management, shader chunks, `Color`/`Points` details).
- Keep context small: re-read only the current milestone's docs; write findings into tracking files rather than keeping them in memory.
- When unsure whether something is in scope, grep `scope-and-roadmap.md`.
- Prefer boring, explicit code over clever code.
- When you finish a unit of work, state precisely what you verified and how.
