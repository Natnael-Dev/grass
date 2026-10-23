# Requirements

**Purpose:** the numbered, testable requirements. IDs are referenced by `tracking/TRACEABILITY.md`, the plan and acceptance criteria. **Read in:** M0, then per milestone.
Keywords: MUST / SHOULD / MAY as in RFC 2119.

## Functional requirements

- **FR-01 Entry.** The page MUST show a static HTML entry overlay (wordmark, tagline, "step outside" button) painting before any JS-heavy scene code runs. The scene initializes behind it. Click/Enter/Space on the button starts the experience (fade overlay, camera entry dolly, audio unlock). If the scene is not ready, the button shows "growing grass…" disabled; if ready in <300 ms the loading text MUST NOT flash.
- **FR-02 World.** A single hill meadow: analytic terrain (`terrainHeight(x,z)`), gradient sky dome with sun/moon disc, clouds, 2–3 distant ridge silhouettes, one lone tree on the hill. Spec: `03-frontend/scene-and-camera.md`.
- **FR-03 Grass.** Grass MUST be GPU-instanced shader blades with per-blade variation, distance-weighted density, wind animation, and fog. Tiers: high 90k / medium 45k / low 18k blades (`02-architecture/performance-strategy.md`). One draw call for grass.
- **FR-04 Moods.** Three moods: `dawn`, `golden`, `night`, as data presets (`design-system.md`). Switching crossfades ALL parameters over 2.5 s with ease-in-out, never popping. First-visit default by local time: 05:00–09:59 dawn, 10:00–18:59 golden, else night; afterwards the stored choice wins. `?mood=` overrides.
- **FR-05 Brush.** Moving the pointer over the ground MUST push blades away and flatten them near the pointer, leaving a trail that springs back with a slight overshoot over ~2 s. Interaction radius stays visually consistent across distance. A custom hand cursor (open/moving/pressed states) is shown on pointer devices.
- **FR-06 Lie down.** Holding the primary button (>= 250 ms, movement < 8 px) MUST lower the camera into the grass (dip), raise FOV slightly, tilt up, add a soft vignette and dampen/open audio ambience; releasing returns smoothly. Camera never clips the terrain.
- **FR-07 Seeds.** A short click (< 250 ms, < 8 px move) MUST scatter 18 (high) dandelion-like seeds from the clicked ground point that drift with the wind for 3.5–5.5 s and fade. The clicked area also receives a strong brush impulse. (Plucking blades is a non-goal.)
- **FR-08 Fireflies.** In night mood, glowing additive fireflies (90/60/30 by tier) drift and blink. Their visibility crossfades with mood.
- **FR-09 Mood switcher.** HUD pill group (dawn / golden / night) and keys `1` `2` `3`. Current mood indicated with `aria-pressed`.
- **FR-10 Audio.** Procedural Web Audio ambience (wind, rustle on brush, crickets at night, birds at dawn/golden, seed "pff") that starts only after the entry click, fades in 1.2 s, has a sound toggle and key `M`, persists mute, suspends when tab hidden. Optional CC0 samples per `audio-design.md`.
- **FR-11 Guidance.** First-visit hint sequence and a "how it works" panel (dialog) listing controls for mouse, touch and keyboard, in dev voice (`copywriting.md`). Hints do not show again once completed.
- **FR-12 Uptime.** HUD counter `uptime outside: mm:ss`, started on entry, paused while the tab is hidden.
- **FR-13 Easter eggs.** EE-1 type `exit`; EE-2 hold lie-down 10 s; EE-3 timed lines at 03:00 and 10:00 uptime; EE-4 console greeting. Exact behavior in `motion-and-interactions.md` and `copywriting.md`.
- **FR-14 Touch.** One-finger drag brushes, tap scatters, press-and-hold (250 ms) lies down, two-finger gestures ignored (page must not zoom/scroll inside the scene). HUD respects safe areas; touch targets >= 44 px.
- **FR-15 Fallbacks.** No WebGL2 → friendly static fallback page (gradient + message, no JS errors). Adaptive quality downgrade on sustained slow frames. `prefers-reduced-motion` honored (see `responsive-and-accessibility.md`).
- **FR-16 Persistence.** localStorage only (wrapped in try/catch): `grass:mood`, `grass:muted`, `grass:hints-seen`. App MUST work if storage throws.
- **FR-17 404.** A themed static `404.html`: "404: grass not found" with a link back.
- **FR-18 Metadata.** Title, description, theme-color, Open Graph/Twitter tags, SVG favicon, 1200×630 OG image generated from a real screenshot.
- **FR-19 Visibility.** Rendering and audio pause when the tab is hidden; time delta clamps so no jump on resume.
- **FR-20 Idle.** After 25 s with no input: slow camera drift and a gentle gust; after 40 s one idle hint line (at most once per 90 s).

## Non-functional requirements

- **NFR-01 Desktop performance.** Target 60 fps at high tier on a mid-range integrated GPU laptop at 1080p. Verified by the human (`?debug=1` overlay) plus draw-call/triangle budgets in CI.
- **NFR-02 Mobile performance.** >= 30 fps at medium/low tier on a mid-range phone; start tier medium on touch devices; auto-downgrade allowed.
- **NFR-03 Size.** Initial JS <= 300 KB gzip, total initial transfer <= 500 KB excluding optional audio samples (<= 250 KB total, lazy). No third-party requests.
- **NFR-04 Clean console.** Zero errors and warnings during normal use (excluding intentional EE-4 greeting).
- **NFR-05 Accessibility.** UI text contrast >= 4.5:1; full keyboard operability including a keyboard path for brush/seeds/lie-down; visible focus; dialog focus trap; `aria` labels; reduced-motion; Lighthouse a11y >= 95. The scene canvas is `aria-hidden` with an accessible description in the help panel.
- **NFR-06 Privacy.** No analytics, cookies, fingerprinting or third-party network requests (including fonts). System font stacks only.
- **NFR-07 Security.** Static security headers and a strict CSP via `vercel.json` (`deployment.md`). No `eval`, no inline script requirement beyond hashed/nonce-free approach documented there.
- **NFR-08 Code quality.** TypeScript `strict`, ESLint zero warnings, Prettier clean, unit tests for all pure logic, standards in `05-quality/code-quality-standards.md`.
- **NFR-09 Browsers.** Last 2 versions of Chrome, Edge, Firefox; Safari/iOS Safari 16.4+. WebGL2 required.
- **NFR-10 Resources.** No unbounded memory growth in a 10-minute soak; all GPU resources disposed on teardown; no per-frame allocations in hot paths.
