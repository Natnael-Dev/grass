# Capability Discovery (M0, first thing)

**Purpose:** make the agent learn its *real* environment instead of assuming. **Output:** `tracking/CAPABILITIES.md`.

## Procedure
1. **Skills.** List every skill visible to you. Read `antigravity-guide` and `agy-customizations` (and `skill-creator` only if you decide to author a project skill). Note each skill's trigger description. Mark which apply to this project (playbook lists likely ones, but your list is the truth).
2. **Slash commands.** Learn actual syntax and limits for `/goal`, `/plan`, `/teamwork-preview`, `/boost`, `/compact`, `/learn`, `/browser`, `/grill-me` from the guide skill or by trying them safely. In particular: how subagents are spawned, how many run concurrently, whether they get isolated worktrees, how results return, and whether `/goal` survives context compaction.
3. **MCP servers.** Smoke-test each you will use with a harmless call, and record the exact result:
   - `github`: authenticated user; list repos; confirm you can create a branch/PR in the target repo.
   - `vercel`: list teams/projects.
   - `playwright`: open `about:blank`, then a local page; take a screenshot; confirm you can *view* the image.
   - `chrome-devtools-mcp`: open a page, start/stop a performance trace.
   - `context7`: resolve "three" and fetch a docs snippet.
4. **Runtime.** `node -v`, `npm -v`, `git --version`, OS, shell, free disk, network egress to npm/GitHub/Vercel, ability to run a dev server in the background and keep it alive, ability to run headless Chromium with WebGL2 (swiftshader flags in testing-strategy).
5. **Gaps.** For anything unavailable, choose and record a fallback (e.g., no subagents → sequential role-switching with explicit review passes; no Playwright MCP → run Playwright via CLI and view saved images; no GitHub MCP → `gh`/git CLI; no network → stop and ask the human).
6. **Extending.** If a tool would materially help (e.g. an image-diff or Lighthouse CLI), you may install **free, secret-less** dev tools yourself and record them. Anything needing credentials, paid plans, or global machine changes: ask the human first.
7. **Persist rules.** Run `/learn` with the human's standing rules: atomic conventional commits; strict gates (never push before approval); verify APIs via Context7; always look at screenshots; max 3 attempts per failing check.
8. Re-run capability discovery if a tool call starts failing mysteriously (tools may disconnect) and update the file.

## Done when
`CAPABILITIES.md` has real results for every table row (no blanks), and fallbacks are chosen.
