# Milestone M1 Evidence Package: Tooling Scaffold, CI, Quality Hooks

## 1. Overview

- **Milestone:** M1
- **Status:** Complete (Automated Gate PASSED)
- **Commits on `chore/m1-tooling`:**
  - `8ec535d` `build(core): scaffold project skeleton and static entry overlay`
  - `f8a58e2` `build(core): configure strict typescript compiler options`
  - `bc362f0` `chore(core): add eslint flat config with layer rules and prettier`
  - `469762f` `test(core): configure vitest and add math unit tests`
  - `dc78fa1` `test(core): configure playwright with webgl flags and add smoke test`
  - `2092fa0` `build(core): add bundle size checker script`
  - `ed3f14a` `ci(core): add github actions workflow and project metadata`
  - `9a6f0d2` `chore(core): configure husky pre-commit and commit-msg quality hooks`
- **Requirements Covered:** FR-01 (Entry overlay static HTML), NFR-03 (Size budget), NFR-04 (Clean console), NFR-07 (Security & CSP), NFR-08 (Code quality).

---

## 2. Gate Verification Checklist

- [x] `npm run check` green locally (lint 0 warnings, typecheck 0 errors, unit 12/12 passed, build 132ms, size passed)
- [x] `npm run test:e2e` green (Chromium headless with WebGL2 SwiftShader args, overlay verified, zero console errors)
- [x] Visual review: `tracking/evidence/M1/entry-overlay.png` viewed and judged
- [x] Hooks demonstrably block bad commit messages (commitlint scope validation) and lint errors (ESLint `no-explicit-any`)
- [x] CI workflow validated (`.github/workflows/ci.yml`)
- [x] Commits atomic, conventional; working tree clean

---

## 3. Visual Review of Output (`tracking/evidence/M1/entry-overlay.png`)

1. **Composition & Hierarchy:** Centered stack with balanced vertical rhythm and dark radial vignette background (`radial-gradient` from `#0a0e1c` to `#060b24`).
2. **Typography & Wordmark:** `grass_` renders crisply in monospace, weight 600, with terminal aesthetic. Blinking underscore animation functions smoothly and pauses cleanly under `prefers-reduced-motion`.
3. **Copy Accuracy:** Tagline strictly matches copywriting specification: `"go outside for a minute. your build will wait."`. Secondary note `"sound starts when you click."` in 12px muted text.
4. **Primary CTA:** Button `"step outside"` styled with vibrant grass-neon green background (`#c5f277`) and dark green ink (`#10200c`). 48px height, 24px padding, pill radius, with visible gold focus outline (`#ffe08a`).
5. **DOM & A11y:** Canvas has `aria-hidden="true"`, noscript fallback banner present in HTML, zero console errors or warnings recorded.

---

## 4. Verbatim Command Logs

### `npm run check`

```
> grass@0.1.0 check
> npm run lint && npm run typecheck && npm run test && npm run build && npm run size

> grass@0.1.0 lint
> eslint . --max-warnings 0

> grass@0.1.0 typecheck
> tsc --noEmit

> grass@0.1.0 test
> vitest run

 RUN  v3.2.7 C:/Users/HP/OneDrive/Desktop/Grass
 ✓ tests/unit/math.test.ts (12 tests) 7ms

 Test Files  1 passed (1)
      Tests  12 passed (12)
   Duration  573ms

> grass@0.1.0 build
> tsc --noEmit && vite build

dist/index.html                5.11 kB │ gzip: 1.77 kB
dist/assets/index-Bf-UY7sM.js  1.22 kB │ gzip: 0.70 kB │ map: 1.15 kB
✓ built in 132ms

> grass@0.1.0 size
> node scripts/check-size.mjs

Asset Gzip Size Check:
--------------------------------------------------
- index-Bf-UY7sM.js: raw 1.19 KB -> gzip 0.68 KB
- index-Bf-UY7sM.js.map: raw 1.12 KB -> gzip 0.68 KB
--------------------------------------------------
Total bundle gzip: 1.36 KB (budget: 500 KB)
Largest JS file (index-Bf-UY7sM.js): 0.68 KB (budget: 300 KB)
Size check PASSED.
```

### `npm run test:e2e`

```
> grass@0.1.0 test:e2e
> playwright test

Running 1 test using 1 worker
  ok 1 [chromium] › tests\e2e\smoke.spec.ts:4:3 › Grass smoke test › boots without console errors and presents static entry overlay (566ms)

  1 passed (4.0s)
```

### Commit Hook Verification (Demonstrable Blocks)

1. **Bad Commit Message Rejection:**

```
⧗   input: test(e2e): configure playwright with webgl flags and add smoke test
✖   scope must be one of [core, world, grass, sky, camera, input, audio, ui, easter, debug, build, tracking, docs] [scope-enum]
✖   found 1 problems, 0 warnings
husky - commit-msg script failed (code 1)
```

2. **Bad Code / Type Error Rejection:**

```
Lint error test problems count: 2
Rule: @typescript-eslint/no-unused-vars
Rule: @typescript-eslint/no-explicit-any
```

3. **Production Dependency Audit:**

```
npm audit --omit=dev -> found 0 vulnerabilities
```
