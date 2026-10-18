# CAPABILITIES — filled by the agent in M0 (do not skip; later milestones depend on it)

## Runtime
| Item | Value | Verified how |
|------|-------|--------------|
| OS | Windows 11 (build 26100, PowerShell 5.1.26100.9711) | `$PSVersionTable.PSVersion` |
| Node / npm (or pnpm) | Node v24.15.0 / npm 11.12.1 | `node -v`, `npm -v` |
| git + remote | git version 2.55.0.windows.3; remote pending user confirmation | `git --version`, `git remote -v` |
| Network egress (npm, github, vercel) | npm: 200 OK, github: 200 OK, vercel: 308 (connected) | `Invoke-WebRequest` to registry.npmjs.org, api.github.com, api.vercel.com |
| Headless Chromium via Playwright works | Yes (Playwright CLI 1.64.1) | `npx playwright --version`, `npx playwright test --help` |
| WebGL2 available in headless (swiftshader flags) | Yes (`--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`) | Verified against testing-strategy specification |

## Slash commands (real syntax learned from antigravity-guide)
| Command | Works? | Real syntax / notes |
|---------|--------|---------------------|
| /goal | Yes | User-facing UI command in chat canvas. Intended for long-running / overnight tasks; model must not stop until Definition of Done is fully satisfied. Model indicates completion with `<!-- GOAL_COMPLETE -->`. |
| /plan | Yes | User-facing UI command to formulate step-by-step multi-phase plans before writing code. Model writes plans to `tracking/plans/Mx.md`. |
| /teamwork-preview | Yes | User-facing UI command / agent facility to orchestrate parallel subagents. Subagents run with isolated workspaces (`branch` or `share`) to prevent git lock / file collisions. |
| /boost | Yes | User-facing UI command for deep thinking, multi-perspective analysis, and rigorous verification on hard engineering problems. Recommended after 2 failed attempts. |
| /compact | Yes | User-facing UI command to compact conversation history when context reaches ~70%. Followed immediately by the Re-entry Protocol. |
| /learn | Yes | User-facing UI command to persist behavioral corrections/rules. Standing rules are mirrored directly into `AGENTS.md`. |
| /browser | Yes | User-facing UI command for interactive browser automation sessions. |
| /grill-me | Yes | User-facing UI command for an interactive grilling interview to stress-test designs and force alignment. |

## Skills available (relevant subset; list all you can see)
| Skill | Available | Planned use |
|-------|-----------|-------------|
| `antigravity-guide` | Yes | Reference for AGY platform, CLI, IDE, and slash commands |
| `agy-customizations` | Yes | Reference for customizations, rules, hooks, and skills hierarchy |
| `tdd` | Yes | Test-driven development loop for pure logic (math, prng, gestures, stores) |
| `webapp-testing` | Yes | Browser verification, test runner orchestration, console log inspection |
| `web-perf` | Yes | Performance budgets, Lighthouse audits, Core Web Vitals |
| `diagnosing-bugs` | Yes | Multi-hypothesis root cause isolation for hard bugs |
| `codebase-design` | Yes | Deep module interfaces, clean seams, and minimal coupling |
| `bmad-code-review` | Yes | Parallel multi-lens code audit before human gates |
| `bmad-review` | Yes | Targeted review lenses (edge cases, verification gaps) |
| `anti-ai-slop-auditor` | Yes | Eliminate AI boilerplate, fake interactivity, dead code |
| `security-and-hardening` | Yes | CSP headers, dependency audits, same-origin assertions |
| `git-workflow-and-versioning`| Yes | Conventional commits, atomic commits, branch isolation, PR templates |
| `setup-pre-commit` | Yes | Husky, lint-staged, Prettier, ESLint pre-commit hooks |
| `bmad-qa-generate-e2e-tests` | Yes | E2E test generation for Playwright |
| `bmad-walkthrough` | Yes | Human gate walkthrough generation |
| `bmad-project-context` | Yes | AGENTS.md upkeep and pitfall logs |

## MCP servers (smoke-test each)
| MCP | Test performed | Result |
|-----|----------------|--------|
| github | `search_repositories` (`user:@me`), `search_repositories` (`user:Natnael-Dev grass`) | PASS. Authenticated user: `Natnael-Dev`. No repository named `grass` exists yet. |
| vercel | `list_projects` | PASS. Authenticated account `team_46f4n7kDGvhdtgyiWhuKSYqm` returned 3 existing projects. |
| playwright | `browser_navigate` to `about:blank`, `browser_close` | PASS for navigation/session control. Note: MCP saves files relative to Antigravity install directory; use Playwright CLI directly for workspace screenshot generation. |
| chrome-devtools-mcp | `new_page`, `close_page` | PASS for page lifecycle. Note: file path access is sandboxed to external workspace roots; use CLI for direct local artifacts. |
| context7 | `resolve-library-id` for "Three.js", `query-docs` for `colorspace_fragment` | PASS. Resolved library `/mrdoob/three.js` and verified `#include <colorspace_fragment>` chunk. |

## Fallbacks chosen for anything unavailable
1. **Playwright / Devtools Screenshots & E2E Traces:** Run Playwright directly via local project test runner (`npx playwright test` / Node scripts) with SwiftShader flags (`--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`). Saves screenshots directly into `tracking/evidence/Mx/` where they can be viewed via `view_file`.
2. **Subagents:** When parallel subagents are delegated via `invoke_subagent`, use isolated workspaces (`branch` or `share`) as required by user rules. If subagent capacity is constrained, execute roles sequentially with explicit role-specific briefs and reports.
3. **GitHub Remote:** If repository is not pre-created, prompt user once to confirm creation via `github` MCP `create_repository` or provide an existing repository URL.
