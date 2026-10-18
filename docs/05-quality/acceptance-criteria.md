# Acceptance Criteria

**Purpose:** pass/fail checks per requirement. The agent must satisfy ALL before claiming completion. Each row's evidence is recorded in `tracking/TRACEABILITY.md`. "Auto" = automated test; "Look" = agent views screenshot; "Human" = confirmed at a gate.

| ID | Criterion (pass when…) | Type |
|---|---|---|
| FR-01 | Overlay HTML visible in the first paint (check with JS disabled: noscript copy visible too); button focus on load; click starts the experience; overlay removed from a11y tree afterwards; "growing grass…" never shown when ready < 300 ms | Auto + Look |
| FR-02 | Screenshot shows terrain, hill, tree, 3 ridges, sky with disc and clouds; art-direction checklist ticked; `terrainHeight` tests pass | Look + Auto |
| FR-03 | `stats().blades` == tier count (90k/45k/18k); grass draw call count == 1; blades differ in height/colour; two frames 1 s apart show moving grass; no seams | Auto + Look |
| FR-04 | 3 presets match `design-system.md` exactly (unit test compares); crossfade of 2.5 s without discontinuity (sample 10 frames: monotonic interpolation); first-visit time rule; `?mood=` works | Auto + Look |
| FR-05 | After a pointer sweep, displaced blades visible and recover over ~2.4 s with overshoot; radius visually consistent near/far; hand cursor states switch | Auto + Look + Human |
| FR-06 | Hold >= 250 ms lowers camera to ≈ terrain+0.38 in 1.1 s; fov +4; vignette up; release returns in 0.9 s; no terrain clipping; tap < 250 ms does not lie down | Auto + Human |
| FR-07 | Tap spawns tier count of seeds, all gone after ≤ 5.5 s; nearby grass reacts | Auto + Look |
| FR-08 | Night shows glowing blinking fireflies; other moods none; counts by tier | Auto + Look |
| FR-09 | Pills and keys 1/2/3 change mood; `aria-pressed` accurate | Auto |
| FR-10 | Audio silent before entry; running after entry; layers per mood; mute persists; suspend on hidden; sfx on tap; no console errors if AudioContext missing | Auto + Human |
| FR-11 | Hint sequence matches `copywriting.md` order/timing; not shown on revisit; dialog contents match; focus trap and Esc work | Auto |
| FR-12 | Counter shows mm:ss, increments, pauses when hidden | Auto |
| FR-13 | EE-1..EE-4 behave exactly as specified | Auto + Human |
| FR-14 | Touch emulation journey passes; no scroll/zoom on canvas; targets >= 44 px | Auto + Human (real phone if available) |
| FR-15 | Fallback appears when WebGL2 absent; adaptive downgrade triggers under synthetic slow frames (unit) and keeps running; reduced-motion behaviors per spec | Auto |
| FR-16 | Values persist across reload; app works with throwing localStorage | Auto |
| FR-17 | `/404.html` renders themed page; Vercel unknown path returns it | Auto (preview) |
| FR-18 | Head tags present; favicon loads; `og.png` exists 1200×630 ≤ 150 KB | Auto |
| FR-19 | Loop stops when hidden; no dt spike on resume (dt <= 0.1) | Auto |
| FR-20 | Idle drift/gust start at 25 s, hint at 40 s, end on input, rate limited | Auto |
| NFR-01 | `?debug=1` on the human's machine shows avg frame <= 16.7 ms and p95 <= 20 ms at high tier (waivable by human) | Human |
| NFR-02 | Mobile: p95 <= 33 ms at medium/low on human's phone (waivable) | Human |
| NFR-03 | Size budget checks pass (script `npm run size` fails the build if exceeded) | Auto |
| NFR-04 | Playwright console listener: zero errors/warnings across all e2e (EE-4 `info` excluded) | Auto |
| NFR-05 | Lighthouse a11y >= 95; keyboard journey passes; reduced-motion test passes; contrast script passes for each mood | Auto |
| NFR-06 | All requests same-origin; no cookies set; no storage keys beyond the 3 | Auto |
| NFR-07 | Headers present on the deployed preview (CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, frame-ancestors) | Auto |
| NFR-08 | `npm run lint` zero warnings; `tsc --noEmit` clean; coverage on pure modules >= 85% lines | Auto |
| NFR-09 | Playwright passes on Chromium; WebKit/Firefox smoke if available else documented as unverified, human tests Safari/Firefox at G11 | Auto + Human |
| NFR-10 | 10-min soak heap growth < 10%; `renderer.info.memory` geometries/textures stable; dispose test passes | Auto |

## Global acceptance
README §11 checklist complete. No TODO/FIXME left in `src/` except linked ADR items. All docs consistent with shipped behavior (update docs if behavior legitimately changed via ADR).
