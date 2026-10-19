# Milestone M4 Evidence: Mood System (Gate G3)

## Requirements Covered

- **FR-04 Atmospheric Mood System:**
  - Three distinct presets (`dawn`, `golden`, `night`) implemented strictly to the data specifications in `design-system.md`.
  - Seamless 2.5s crossfade driven by an ease-in-out Hermite curve (`smoothstep(0, 1, t)`).
  - Colors interpolate strictly in linear-sRGB space (avoiding gamma-space darkening or hue shifts).
  - Celestial disc motion: elevation and azimuth angles interpolate spherically so the sun/moon travels in an authentic arc across the sky.
  - Retargetable crossfade: switching moods mid-transition captures current interpolated values as the new origin, guaranteeing zero pops, jumps, or visual discontinuities.
- **Atmospheric Celestial Shaders:**
  - Dawn / Golden: Radiant solar disc with soft atmospheric exponential halo (`uHalo`) and warm golden horizon fog.
  - Night: Luminous lunar disc with subtle procedural crater-less surface mottling (no bitmap textures), accompanied by a crisp, twinkling star field masked cleanly at the horizon (`uStarsAmount = 1`).
- **Input & Controls:**
  - Dev keyboard shortcuts: keys `1` (dawn), `2` (golden), `3` (night).
  - URL parameter flag `?mood=dawn|golden|night` for deterministic testing.
  - Time-of-day initial resolution on first visit: 05:00–09:59 dawn, 10:00–18:59 golden, else night.

---

## Gate Checklist

- [x] Milestone tasks all done; no TODO/FIXME left behind
- [x] `npm run check` passed (verbatim output below)
- [x] Milestone-specific gate commands passed (`npx playwright test`)
- [x] Screenshots viewed and judged against art-direction checklist via `view_file` tool (all 3 moods)
- [x] Review swarm / diagnostic audit passed; no blockers
- [x] `PROGRESS.md` updated
- [x] Commits atomic, conventional; tree clean

---

## Visual Evaluation

### 1. Dawn Mood (`tracking/evidence/M4/mood-dawn.png`)

- **Sky:** Soft rose-lavender vertical gradient (`#4a5a9c` to `#c88fb0` to `#ffc9a3`).
- **Sun:** Rising low on the horizon at elevation 6°, azimuth 35°, with gentle morning glow.
- **Meadow:** Cool dewy morning green tones (`#2f6b4a` base, `#a8d878` tip).
- **Ridges:** Layered pastel violet silhouette ribbons receding into warm rose fog (`#e8b9a8`).
- **Tree:** Crisp silhouette on hill crest framed against sunrise.

### 2. Golden Mood (`tracking/evidence/M4/mood-golden.png`)

- **Sky:** Cerulean upper dome transitioning through golden peach into warm amber horizon.
- **Sun:** Mid-sky position at elevation 14°, azimuth 30°, with rich golden bloom.
- **Meadow:** Lush warm golden-green carpet (`#3d7a3a` base, `#d4e36a` tip).
- **Ridges:** Warm olive-gold tones receding into sunset fog (`#f3cf9f`).
- **Tree:** Warm tree silhouette against glowing sun.

### 3. Night Mood (`tracking/evidence/M4/mood-night.png`)

- **Sky:** Deep midnight indigo (`#060b24` to `#101b4a` to `#24366e`).
- **Moon:** High in the sky at elevation 38°, azimuth 25°, with subtle soft surface mottling and silver illumination.
- **Stars:** Sparkling, twinkling star field distributed naturally across the celestial dome.
- **Meadow:** Deep teal-blue grass blades (`#0c2a2a` base, `#2f6f5a` tip) catching cool moon highlights.
- **Ridges:** Dark navy silhouettes receding into deep midnight fog (`#0f1a3a`).

---

## Verbatim Verification Outputs

### 1. `npm run check` (lint, typecheck, unit tests, build, bundle size)

```
> grass@0.1.0 lint
> eslint . --max-warnings 0

> grass@0.1.0 typecheck
> tsc --noEmit

> grass@0.1.0 test
> vitest run

 RUN  v3.2.7 C:/Users/HP/OneDrive/Desktop/Grass

 ✓ tests/unit/moods.test.ts (7 tests) 13ms
 ✓ tests/unit/loop.test.ts (5 tests) 9ms
 ✓ tests/unit/math.test.ts (12 tests) 13ms
 ✓ tests/unit/prng.test.ts (8 tests) 41ms
 ✓ tests/unit/noise.test.ts (3 tests) 25ms
 ✓ tests/unit/grass-geometry.test.ts (3 tests) 13ms
 ✓ tests/unit/mood-controller.test.ts (4 tests) 15ms
 ✓ tests/unit/terrain.test.ts (6 tests) 10ms
 ✓ tests/unit/app.test.ts (5 tests) 13ms
 ✓ tests/unit/camera.test.ts (5 tests) 13ms
 ✓ tests/unit/world-render.test.ts (4 tests) 105ms
 ✓ tests/unit/grass-generator.test.ts (4 tests) 375ms
 ✓ tests/unit/grass-system.test.ts (3 tests) 382ms

 Test Files  13 passed (13)
      Tests  69 passed (69)
   Start at  19:30:54
   Duration  1.41s (transform 1.56s, setup 0ms, collect 4.05s, tests 1.03s, environment 4ms, prepare 2.35s)

> grass@0.1.0 build
> tsc --noEmit && vite build

vite v6.4.4 building for production...
transforming...
✓ 38 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                  5.15 kB │ gzip:   1.78 kB
dist/assets/index-VQX1b0bn.js  577.63 kB │ gzip: 147.22 kB │ map: 3,041.38 kB
✓ built in 2.02s

> grass@0.1.0 size
> node scripts/check-size.mjs

Asset Gzip Size Check:
--------------------------------------------------
- index-VQX1b0bn.js: raw 564.09 KB -> gzip 143.77 KB
--------------------------------------------------
Total bundle gzip: 143.77 KB (budget: 500 KB)
Largest JS file (index-VQX1b0bn.js): 143.77 KB (budget: 300 KB)
Size check PASSED.
```

### 2. `npx playwright test` (E2E Full Suite)

```
Running 10 tests using 1 worker

  ok  1 [chromium] › tests\e2e\grass.spec.ts:7:3 › M3 Grass Instancing & Wind Motion › renders grass with single draw call within total budget and default 90k blades (23.4s)
  ok  2 [chromium] › tests\e2e\grass.spec.ts:45:3 › M3 Grass Instancing & Wind Motion › configures blade counts via URL flag and supports runtime tier switching (6.4s)
  ok  3 [chromium] › tests\e2e\grass.spec.ts:83:3 › M3 Grass Instancing & Wind Motion › verifies wind displacement animation produces visible motion between frames (31.6s)
  ok  4 [chromium] › tests\e2e\grass.spec.ts:132:3 › M3 Grass Instancing & Wind Motion › captures golden grass meadow vista for visual review (36.6s)
  ok  5 [chromium] › tests\e2e\moods.spec.ts:7:3 › M4 Mood System & Crossfade › boots with URL mood flag and switches moods via dev keys 1, 2, 3 (22.4s)
  ok  6 [chromium] › tests\e2e\moods.spec.ts:58:3 › M4 Mood System & Crossfade › captures visual evidence for dawn mood (18.8s)
  ok  7 [chromium] › tests\e2e\moods.spec.ts:83:3 › M4 Mood System & Crossfade › captures visual evidence for golden mood (25.8s)
  ok  8 [chromium] › tests\e2e\moods.spec.ts:108:3 › M4 Mood System & Crossfade › captures visual evidence for night mood (26.0s)
  ok  9 [chromium] › tests\e2e\rendercore.spec.ts:5:3 › M2 Render Core & Golden Vista › boots 3D render core, satisfies draw call budget, handles visibility pause, and captures golden vista (37.2s)
  ok 10 [chromium] › tests\e2e\smoke.spec.ts:4:3 › Grass smoke test › boots without console errors and presents static entry overlay (21.9s)

  10 passed (4.4m)
```
