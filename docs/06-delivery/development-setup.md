# Development Setup

**Purpose:** install, run, scripts. **Read in:** M1.

## Requirements
Node.js active LTS (verify the current LTS; write it to `.nvmrc` and `engines`), npm (use npm unless CAPABILITIES shows pnpm is the standard; stay consistent), git, Chromium via `npx playwright install chromium`.

## Commands
```
npm install
npm run dev            # Vite dev server (http://localhost:5173)
npm run build          # tsc --noEmit && vite build  -> dist/
npm run build:test     # VITE_EXPOSE_DEBUG=1 build for e2e
npm run preview        # serve dist/
npm run typecheck      # tsc --noEmit
npm run lint           # eslint . --max-warnings 0
npm run format         # prettier --write .
npm run test           # vitest run
npm run test:watch
npm run test:e2e       # playwright test (builds test bundle, serves preview)
npm run size           # fails if gzip budgets exceeded (see performance-benchmarks.md)
npm run check          # lint + typecheck + test + build + size (used by CI and gates)
```
Implement `size` as a small Node script reading `dist/assets/*.js` gzip sizes (zlib), no extra dependency.

## Environment variables
`VITE_EXPOSE_DEBUG` (test builds only). No secrets needed anywhere. `.env*` is git-ignored.

## Config files to create (M1)
`package.json` (exact pins, `type: module`, `engines`), `tsconfig.json` (strict flags per code-quality), `vite.config.ts`, `eslint.config.js` (flat; `no-restricted-imports` for layer boundaries; `import/no-cycle` equivalent), `.prettierrc`, `.editorconfig`, `.gitignore` (node_modules, dist, .vercel, playwright-report, test-results, .env*), `.nvmrc`, `playwright.config.ts`, `vitest.config.ts`, `.github/workflows/ci.yml`, `.github/pull_request_template.md`, `LICENSE`, `CHANGELOG.md`, `vercel.json` (finalized in M13 but created with headers in M1).

## CI (`ci.yml`)
Triggers: PR and push to main. Steps: checkout → setup-node (LTS, npm cache) → `npm ci` → lint → typecheck → unit → build → size → install Playwright chromium → `build:test` → e2e smoke → upload report/screenshots on failure. Pin actions by major version. Least-privilege `permissions: contents: read`.

## Troubleshooting
WebGL fails in headless → check launch args (testing strategy). Slow e2e → reduce viewport, `?quality=low`, `?freeze=1`. Port in use → change Vite port, don't kill unknown processes.
