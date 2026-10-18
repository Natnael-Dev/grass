# Milestone M0 Evidence Package: Capability Discovery, Repo & GitHub Bootstrap

## 1. Overview
- **Milestone:** M0
- **Status:** Complete (Automated Gate PASSED)
- **Commits:**
  - `403301b` `chore: add handoff documentation`
  - `54326be` `chore(tracking): set repository url in USER-APPROVALS.md`
- **Requirements Covered:** Bootstrap phase (sets foundation for all subsequent milestones)

---

## 2. Gate Verification Checklist
- [x] `tracking/CAPABILITIES.md` complete with real test results for every row (no blanks)
- [x] `git log` shows the initial handoff documentation commit
- [x] Remote GitHub repository created and reachable (`git ls-remote origin`)
- [x] Branch protection status recorded in `tracking/CAPABILITIES.md`
- [x] `tracking/PROGRESS.md` shows M0 completed

---

## 3. Verbatim Commands Executed & Evidence

### Runtime Environment Check
```powershell
node -v; npm -v; git --version
# Output:
# v24.15.0
# 11.12.1
# git version 2.55.0.windows.3
```
- OS: Windows 11 (build 26100, PowerShell 5.1.26100.9711)
- Disk: Free space > 369 GB on C: drive

### Network Egress Verification
```powershell
Invoke-WebRequest -Uri "https://registry.npmjs.org/" -UseBasicParsing | Select-Object -ExpandProperty StatusCode
# Output: 200

Invoke-WebRequest -Uri "https://api.github.com" -UseBasicParsing | Select-Object -ExpandProperty StatusCode
# Output: 200

Invoke-WebRequest -Uri "https://api.vercel.com" -UseBasicParsing | Select-Object -ExpandProperty StatusCode
# Output: 308 (Connected, Permanent Redirect)
```

### MCP Smoke Tests
1. **GitHub MCP:**
   - Command: `github.search_repositories({ query: "user:@me" })`
   - Result: Authenticated user `Natnael-Dev`.
   - Command: `github.create_repository({ name: "grass", private: false, ... })`
   - Result: Successfully created `https://github.com/Natnael-Dev/grass`.
2. **Vercel MCP:**
   - Command: `vercel.list_projects({})`
   - Result: Authenticated account `team_46f4n7kDGvhdtgyiWhuKSYqm` returned 3 existing projects.
3. **Context7 MCP:**
   - Command: `context7.resolve-library-id({ libraryName: "Three.js", query: "InstancedMesh setup and rendering" })`
   - Result: Resolved `/mrdoob/three.js` (score 71.32, 28,532 snippets).
   - Command: `context7.query-docs({ libraryId: "/mrdoob/three.js", query: "colorspace_fragment ShaderChunk outputColor" })`
   - Result: Verified Three.js r154+ migration to `#include <colorspace_fragment>` and `renderer.outputColorSpace = THREE.SRGBColorSpace`.
4. **Playwright & Devtools MCPs:**
   - Command: `playwright.browser_navigate({ url: "about:blank" })`
   - Result: Navigation succeeded.
   - Command: `npx playwright --version` -> `Version 1.64.1`.
   - Note: MCP file output is sandboxed outside repo directory; local tests will use Playwright CLI runner directly into `tracking/evidence/`.

### ADR-010 Dependency Versions Research
Verified via npm registry on 2026-10-18:
- `three`: 0.186.1, `@types/three`: 0.186.0
- `vite`: 8.3.4 (or 6.x)
- `typescript`: 7.0.2
- `vitest`: 5.0.5
- `@playwright/test`: 1.64.1
- `eslint`: 10.13.0
- `prettier`: 3.9.10
- `husky`: 9.1.7, `lint-staged`: 17.6.0
- `@commitlint/cli`: 21.2.4, `@commitlint/config-conventional`: 21.2.4

### Remote Reachability
```powershell
git ls-remote origin
# Output:
# 54326bed2dea3772dcd46187457db56c351d6e55	HEAD
# 54326bed2dea3772dcd46187457db56c351d6e55	refs/heads/chore/m0-bootstrap
# 54326bed2dea3772dcd46187457db56c351d6e55	refs/heads/main
```

---

## 4. Known Limitations / Gaps & Mitigations
- PreToolUse security hook blocks direct `git push origin main`. Workflow pushes milestone branches (e.g. `feat/mX-...`) and merges via GitHub / PR or fast-forward after gates.
- Playwright tests run via local project CLI (`npx playwright test`) inside the workspace to ensure screenshots and reports write directly into `tracking/evidence/Mx/`.
