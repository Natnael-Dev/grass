# Testing Strategy

**Purpose:** what to test, how, and the exact tooling. **Read in:** M1, and at every milestone's VERIFY step. Use skills `tdd`, `webapp-testing`, `bmad-qa-generate-e2e-tests`; MCPs `playwright`, `chrome-devtools-mcp`.

## Pyramid
1. **Unit (Vitest, jsdom only where DOM is needed):** every pure module. Required suites: `terrain` (determinism, bounds, continuity), `prng`, `math` (damp/spring/smoothstep/ease), `grass instance generation` (count, bounds, y==terrain, ring proportions, shuffle determinism), `BrushTrail` (ring buffer, response curve, expiry, overshoot bound), `GestureClassifier` (boundaries), `GroundRaycaster`, `MoodController` (lerp endpoints, retarget mid-fade, shortest-arc disc), `store`, `HintSequencer`, `eggs` (exit buffer, timers), `QualityController` (downgrade logic with synthetic frame times), `audio scheduler/gain mapping`, `uptime formatting`, `storage` (throwing localStorage), `flags` parsing.
2. **Integration (Vitest + jsdom):** UI components against the store (aria states, focus trap, copy from `copy.ts`).
3. **E2E (Playwright, Chromium; WebKit/Firefox smoke where WebGL2 works):** journeys J1–J7 from `00-product/user-journeys.md`.

## Playwright setup for WebGL in headless
Launch args (Chromium): `--use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --ignore-gpu-blocklist`. Build with `VITE_EXPOSE_DEBUG=1` for tests (`npm run build:test`, served by `vite preview`). Use `?seed=1&freeze=1` for deterministic frames. Software GL is slow: use generous timeouts and small viewports (e.g. 960×540) for pixel tests.

## Required e2e tests (names are suggestions; behaviors are required)
- boots without console errors/warnings; entry overlay visible before scene ready; button enabled; clicking enters (overlay gone, `phase=running`).
- canvas is non-blank: screenshot statistics (stddev of luminance > threshold, not a single colour) per mood.
- mood switching via click and keys: average colour of the sky region changes between moods; fireflies amount 1 only at night (`stats()`); `aria-pressed` correct; persists after reload.
- brush: after `brushAt` sweep, `stats().trailPoints > 0`; the screenshot region near the sweep differs from baseline.
- tap → seeds count > 0 then returns to 0 within 6 s; hold → `lying=true` and camera y < 0.6; release → returns to base within 1.2 s.
- hint sequence J1 (use fake timers via `page.clock` where possible); hints do not appear on 2nd visit.
- keyboard-only journey J4 (arrows, Enter, Space hold, 1/2/3, M, ?, Esc).
- sound: after entry `audioState==='running'`; `M` toggles; reload restores mute.
- exit easter egg `exit` shows exit screen; re-run returns.
- reduced-motion emulation (`page.emulateMedia({reducedMotion:'reduce'})`): no typed effect, shorter dip, `uReduced=1`.
- mobile emulation (iPhone 13 / Pixel 7 profiles): touch brush/tap/hold, layout screenshots, no horizontal scroll, targets >= 44 px.
- fallback: inject script making `getContext('webgl2')` return null → fallback visible, no console errors.
- 404 page renders (on preview server) and link works.
- production build asserts `window.__grass` is undefined (build test).
- visibility: simulate `visibilitychange` hidden → loop paused (`stats().frames` stops), resume without time jump.

## Performance tests
`docs/05-quality/performance-benchmarks.md`. Run via `web-perf` skill (Lighthouse) and `chrome-devtools-mcp` traces; soak test 10 min (headless, `?quality=low`) with heap snapshots at 1 / 5 / 10 min: growth < 10%.

## Visual review
Agent MUST *view* each screenshot (image viewing tool), compare to the art-direction checklist, and write 3–5 lines of findings in the evidence README for the milestone. Screenshots are evidence, not golden files (GPU variance); no pixel-exact snapshot gating.

## Security tests
`security-and-hardening` skill: dependency audit (`npm audit --omit=dev` → zero high/critical), CSP header check on the preview, no third-party requests (Playwright `page.on('request')` asserts all same-origin), no secrets in repo (grep + gitleaks-like check if available).

## Regression prevention
CI runs lint, typecheck, unit, build, e2e smoke on every PR; hooks run lint-staged + typecheck on commit. Every bug fix starts with a failing test (`tdd`).

## Definition of done (per task / per milestone)
Task: code + tests + docs touched + lint/type/unit green + visual check + atomic commit. Milestone: gate commands pass, evidence stored, review swarm findings resolved, PROGRESS/TRACEABILITY updated, PR description complete.
