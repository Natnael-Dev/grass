# Implementation Plan (milestones M0–M13)

**Purpose:** the step-by-step build order with gates. Follow strictly. For each milestone: re-read **Read** docs, run `/plan` → `tracking/plans/Mx.md`, build in atomic commits, run **Gate**, store evidence in `tracking/evidence/Mx/` (with a short `README.md` listing commands run, results, screenshot findings), update PROGRESS + TRACEABILITY, review swarm, then the human gate if marked.
"Skills/MCP" lists *suggested* tools; use any others that fit.
Common gate for every milestone (in addition to the milestone's own): `npm run check` passes; no console errors; working tree clean; commits atomic/conventional.

---
## M0 — Capability discovery, repo + GitHub bootstrap (no human gate)
**Read:** README, AGENTS.md, `07-agent-operations/*`, `06-delivery/git-and-github-workflow.md`.
**Tasks:** (1) capability inventory + MCP smoke tests → `tracking/CAPABILITIES.md`; (2) learn real `/goal`, `/plan`, `/teamwork-preview`, `/learn` syntax from `antigravity-guide`; run `/learn` to persist: "atomic conventional commits; strict approval gates; verify APIs with Context7; look at screenshots"; (3) git/GitHub bootstrap per git doc; (4) initial docs commit and push; (5) ADR-010 versions research (latest stable Node LTS, Vite, TypeScript, Three, Vitest, Playwright, ESLint, Prettier) via Context7/npm.
**Gate:** CAPABILITIES.md complete with real test results; `git log` shows the docs commit; remote reachable (`git ls-remote`); branch protection status recorded; PROGRESS shows M0 done.
**Skills/MCP:** antigravity-guide, agy-customizations, git-workflow-and-versioning, bmad-project-context (AGENTS.md audit), github, context7.

## M1 — Tooling scaffold, CI, quality hooks (no human gate)
**Read:** technology-decisions, development-setup, code-quality-standards, testing-strategy, git workflow.
**Tasks (each an atomic commit):** Vite+TS project skeleton and `index.html` with static entry overlay markup + noscript; tsconfig strict; ESLint flat config with layer-boundary rules; Prettier/EditorConfig; Vitest config + one real test (`math`); Playwright config with WebGL args + a smoke test (page loads, overlay visible); Husky + lint-staged + commitlint (`setup-pre-commit`); `size` script; CI workflow; PR template; LICENSE; CHANGELOG; `vercel.json`; `.gitignore`.
**Gate:** `npm run check` green locally; `npm run test:e2e` green; hooks demonstrably block a bad commit message and a lint error (evidence: terminal log); CI workflow file validated (and green on the first PR/push if pushing is permitted — M0/M1 may push their branches since no features are involved; open PR; merge on green).
**Skills/MCP:** setup-pre-commit, security-and-hardening (supply chain), webapp-testing, playwright, github, git-workflow-and-versioning.

## M2 — Render core (G1) — FR-02, FR-19
**Read:** scene-and-camera, art-direction, system-architecture, performance-strategy (loop/pause).
**Tasks:** `math.ts`/`prng.ts` with tests; `terrainHeight` with tests; `Renderer` + `Loop` (rAF, dt clamp, visibility pause) + DPR handling; `Terrain` mesh+material; `Sky` shader (gradient + disc + clouds; golden preset hardcoded for now); `Ridges`; `Tree`; `CameraRig` base pose; shared fog GLSL; flags/capabilities/Fallback hook; debug stats overlay; resize handling; dispose.
**Gate:** Playwright screenshot of golden mood matches art-direction checklist items (composition, tree reads as tree, ridges layered, horizon ~42%); loop pauses on hidden; unit tests for terrain/math/prng/loop clamp; `renderer.info` draw calls small.
**Human test (G1):** `npm run dev`; look at composition and feel; resize window; switch tabs.
**Skills/MCP:** frontend-design, threeui-designcode, tdd, playwright, chrome-devtools-mcp, context7, codebase-design.

## M3 — Grass instancing + wind (G2) — FR-03
**Read:** environment-and-grass, performance-strategy, design-system (tiers), art-direction (grass/wind).
**Tasks:** instance generator + tests; blade geometry per tier; noise `DataTexture`; grass shader (vertex+fragment) with wind, fog, AO, rim/back-light; density rings + shuffle + `instanceCount` tier support + `uDensityComp`; tier flag `?quality=`; terrain material tuned to blend with grass; stats `blades`.
**Gate:** `stats().blades` = 90k/45k/18k per tier; grass draw call = 1; screenshot (foreground, mid, far) shows no seams/tiling; two screenshots 1 s apart show wind motion; frame-time sanity trace recorded.
**Human test (G2):** check the grass look at all three `?quality=` values; judge beauty/density/wind; report fps from `?debug=1`.
**Skills/MCP:** frontend-design, web-perf, chrome-devtools-mcp, tdd, diagnosing-bugs, context7, /boost for shader math.

## M4 — Mood system (G3) — FR-04
**Read:** design-system (presets), motion-and-interactions (crossfade), state-and-ui-components.
**Tasks:** `moods.ts` data exactly per table + test; `MoodController` (retargetable lerp, linear-sRGB, disc arc) + tests; wire all systems to `MoodState`; `store` minimal; time-based first-visit default; `?mood=`; stars; moon/sun disc variants; temporary dev key bindings 1/2/3 (final UI in M8).
**Gate:** unit test asserts preset equality with the doc table; 10-frame crossfade sampling monotonic; 3 screenshots (one per mood) reviewed against art checklist; no pops when switching mid-fade.
**Human test (G3):** switch moods repeatedly (keys 1/2/3), judge distinctness and beauty.
**Skills/MCP:** frontend-design, tdd, playwright.

## M5 — Brush interaction + hand cursor (G4) — FR-05
**Read:** motion-and-interactions (brush), input-and-controls, environment-and-grass (trail uniform).
**Tasks:** `Pointer`, `GroundRaycaster` + tests; `BrushTrail` ring buffer + response curve + tests; shader uniform wiring (`uTrail`, `uTrailCount`); radius scaling; hand cursor SVG states (`HandCursor`); brush event emission; keyboard virtual brush (arrows) basic.
**Gate:** unit tests (trail, raycast); e2e sweep test; screenshot sequence at t=0, 0.4, 1.0, 2.0, 3.0 s after a sweep shows push → recovery with slight overshoot (note findings); cursor states verified; no GC spikes in trace.
**Human test (G4):** brush near and far, fast and slow; judge feel and spring-back; cursor feel.
**Skills/MCP:** micro-interactions-motion (use its spring/physics principles; do NOT add Framer Motion), tdd, web-perf, playwright, diagnosing-bugs.

## M6 — Lie-down, parallax, idle (G5) — FR-06, FR-20
**Read:** scene-and-camera, motion-and-interactions (lie down/parallax/idle/entry).
**Tasks:** `GestureClassifier` + boundary tests; `CameraRig` states (parallax spring, dip, idle drift, gust, entry dolly, ground clamp); vignette overlay; near-camera dither fade in shader; `holdStart/holdEnd` events; Space key hold; EE-2 hook point.
**Gate:** tests for classifier boundaries (249/250 ms, 8/9 px); e2e: hold lowers camera (<0.6 m) and release restores; screenshot lying vs standing; no clipping through terrain at 5 sampled positions; idle triggers at 25 s using fake clock.
**Human test (G5):** hold to lie down repeatedly; judge the cosy feel; try idle.
**Skills/MCP:** micro-interactions-motion, tdd, playwright.

## M7 — Seeds + fireflies (G6) — FR-07, FR-08
**Read:** environment-and-grass (fireflies/seeds), motion-and-interactions (seeds).
**Tasks:** seed texture + `Seeds` system (CPU particles, tier counts) + tests of lifecycle math; tap → seeds + impulse; `Fireflies` (GPU-animated Points, night-weighted); sprite shaders; dispose tests.
**Gate:** e2e tap → seeds > 0 → 0 within 6 s; night screenshot shows fireflies, golden none; counts by tier; triangle/draw-call budgets still met.
**Human test (G6):** tap around; watch night fireflies; judge charm.
**Skills/MCP:** frontend-design, tdd, playwright, web-perf.

## M8 — UI shell, hints, help, uptime, easter eggs, 404 (G7) — FR-01, FR-09, FR-11, FR-12, FR-13, FR-16, FR-17
**Read:** ui-ux-specification, design-system, copywriting, motion-and-interactions (hints/eggs), state-and-ui-components, responsive-and-accessibility.
**Tasks:** tokens/base CSS; `copy.ts`; icons; Entry (loading/ready); Hud + MoodSwitch + SoundToggle (UI only; audio wired in M9) + Uptime; HintLine + HintSequencer; HowItWorks dialog (focus trap); `eggs.ts` EE-1..4; ExitScreen; `storage.ts`; `404.html`; fade-on-activity HUD; final key map (1/2/3, ?, Esc, M).
**Gate:** e2e J1/J2/J4 pass; hint sequence timings via fake clock; dialog a11y (roles, focus trap); EE tests; copy equals `copywriting.md` (test against `copy.ts`); 404 renders; screenshots of every UI state reviewed; Lighthouse a11y >= 95 on entry.
**Human test (G7):** play J1 fully; read copy; try `exit`; open help; keyboard only.
**Skills/MCP:** frontend-design, threeui-designcode (glass panels), micro-interactions-motion, bmad-ux (if useful to formalize), tdd, webapp-testing, bmad-qa-generate-e2e-tests.

## M9 — Audio (G8) — FR-10
**Read:** audio-design.
**Tasks:** `AudioEngine` graph + unlock on entry + suspend/resume; Wind; Rustle (brush-driven); Crickets; Birds; Sfx (seed, lie-down filter); mood crossfade; mute persistence + SoundToggle wiring; scheduler tests; (M9b optional CC0 samples per doc, or skip with a log).
**Gate:** unit tests (scheduler, gain mapping, mute); e2e: silent before entry (no context running), running after, mute toggling, hidden suspends; no console errors without AudioContext (simulated).
**Human test (G8):** listen in all moods with headphones and speakers; judge pleasantness, loudness, lie-down muffling.
**Skills/MCP:** tdd, playwright, diagnosing-bugs, context7 (Web Audio specifics).

## M10 — Mobile, touch, accessibility, reduced motion, fallbacks (G9) — FR-14, FR-15, NFR-05
**Read:** responsive-and-accessibility, input-and-controls (touch), ui-ux-specification (states).
**Tasks:** touch gesture path verified; responsive layout rules; safe areas; fov by aspect; reduced-motion behaviors incl. live `matchMedia` changes; forced-colors; no-WebGL2 Fallback; context-lost recovery; contrast checker script per mood; keyboard path polish; start-tier heuristics for touch.
**Gate:** mobile emulation e2e (iPhone/Pixel profiles) incl. screenshots portrait+landscape; reduced-motion e2e; fallback e2e; context-loss simulation (`WEBGL_lose_context`) recovers; Lighthouse a11y >= 95; manual keyboard run notes in evidence.
**Human test (G9):** test on a real phone via LAN dev URL or preview; try rotate, touch gestures, reduced-motion OS setting if possible.
**Skills/MCP:** frontend-design, webapp-testing, playwright, security-and-hardening (touch/gesture), bmad-review.

## M11 — Performance tuning + adaptive quality (G10) — NFR-01, NFR-02, NFR-10, FR-15
**Read:** performance-strategy, performance-benchmarks.
**Tasks:** `QualityController` + tests with synthetic frames; tier downgrade wiring (instanceCount, trail, fireflies, seeds, DPR, `uDensityComp`); init chunking; allocation audit of hot paths; dispose audit; size budgets enforced; Lighthouse; trace comparisons; 10-min soak.
**Gate:** all rows of performance-benchmarks measurable in CI/headless are met and recorded; soak growth < 10%; hot-path allocation review documented.
**Human test (G10):** `?debug=1` fps on the human's machine(s) at each tier; report numbers; approve or request tuning.
**Skills/MCP:** web-perf, chrome-devtools-mcp, diagnosing-bugs, improve-codebase-architecture, /boost.

## M12 — Hardening + full QA audit + traceability (G11) — FR-18, NFR-03/04/06/08/09
**Read:** acceptance-criteria, testing-strategy, code-quality-standards, asset-specification.
**Tasks:** favicon, meta/OG tags, OG image from real build screenshot; full e2e suite complete; WebKit/Firefox smoke where possible; security pass (`npm audit`, CSP review, same-origin request assertion); anti-slop audit; multi-lens code review (swarm); docs-vs-code consistency pass (update docs or ADRs where reality differs); fill TRACEABILITY completely (no TODO).
**Gate:** every acceptance criterion row verified with evidence; TRACEABILITY all PASS (or human-WAIVED); `npm run check` + full e2e green; review findings closed; no TODO/FIXME.
**Human test (G11):** full playthrough on desktop + phone, Firefox/Safari if available; sign off quality.
**Skills/MCP:** bmad-code-review, bmad-review, anti-ai-slop-auditor, security-and-hardening, bmad-qa-generate-e2e-tests, bmad-walkthrough, webapp-testing, web-perf.

## M13 — Release (G12 final) 
**Read:** deployment, git workflow (tags), README §11.
**Tasks:** Vercel project + preview deploy; smoke test preview (headers, CSP, 404, same-origin, console); human final test; production deploy after "approved G12"; production smoke + Lighthouse; public README + move agent README to `docs/AGENT-README.md` + update AGENTS.md; CHANGELOG; tag `v1.0.0`; GitHub Release; final audit of README §11 checklist.
**Gate:** README §11 fully checked with evidence; production URL reported to the human.
**Skills/MCP:** vercel, github, web-perf, playwright, git-workflow-and-versioning.

---
## Parallelization map (for subagents; see `07-agent-operations/subagent-orchestration.md`)
- M2: Graphics agent (Sky/Terrain/Tree/Ridges) ∥ Core agent (Loop/Renderer/CameraRig) after the lead defines interfaces.
- M3: Graphics (shader) ∥ QA agent (tests for instance generator, e2e harness).
- M8: UI agent (Entry/Hud/Dialog/CSS) ∥ Logic agent (HintSequencer/eggs/store/storage) ∥ QA agent.
- M9: Audio agent ∥ QA agent.
- M10/M12: reviewer swarm (3 lenses) always parallel.
Never parallelize two agents on the same files.
