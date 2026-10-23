# Milestone M3 Evidence: Grass Instancing + Wind (Gate G2)

## Requirements Covered

- **FR-01 Grass Instancing:** Single draw call instancing (`InstancedBufferGeometry`) rendering up to 90,000 blades across the meadow (`z in [-70, 22]`, `x in [-60, 60]`). Seeded deterministically with Mulberry32 PRNG (`seed: 1337`).
- **FR-03 Quality Tiers & Blade LOD:**
  - High tier: 90,000 blades, 4 segments (7 vertices, 6 triangles).
  - Medium tier: 45,000 blades, 3 segments (5 vertices, 4 triangles).
  - Low tier: 18,000 blades, 2 segments (3 vertices, 2 triangles).
  - Density compensation (`uDensityComp = min(1.8, sqrt(90000 / count))`) ensures the meadow retains its lush perceived density on lower-end devices.
  - Dynamic runtime tier switching without page reloads.
- **FR-04 Wind System & Procedural Animation:**
  - Seamless 256×256 dual-octave wind noise texture generated procedurally via Simplex noise (R: slow rolling gusts; G: high-frequency flutter).
  - Custom vertex shader with static lean, quadratic height displacement (`t^2 * h`), yaw orientation matrix, and near-camera 4×4 Bayer matrix dither fade.
- **Stylized Shading & Seamless Blending:**
  - Root-to-tip gradient from deep forest green (`#3d7a3a`) to vibrant chartreuse (`#98cf42`).
  - Large-scale meadow patch variation and per-blade hue jitter.
  - Root ambient occlusion (`mix(0.55, 1.0, smoothstep(0.0, 0.5, vH))`).
  - Sun back-light translucency and grazing rim lighting.
  - Seamless color match between grass root and terrain plane (`#3d7a3a`).
  - Exponential squared atmospheric fog (`exp2`) blending into the golden horizon.

---

## Gate Checklist

- [x] Milestone tasks all done; no TODO/FIXME left behind
- [x] `npm run check` passed (verbatim output below)
- [x] Milestone-specific gate commands passed (`npx playwright test`)
- [x] Screenshot viewed and judged against the art-direction checklist via `view_file` tool
- [x] Review swarm / diagnostic audit passed; no blockers
- [x] `PROGRESS.md` updated
- [x] Commits atomic, conventional; tree clean

---

## Screenshot Visual Evaluation

File: `tracking/evidence/M3/grass-vista.png`

**Evaluator judgment (inspected via `view_file` tool):**

1. **Foreground Blades:** Distinct, crisp stylized grass blades in the near field with natural taper and individual yaw/curvature.
2. **Meadow Receding & Density:** Lush, continuous green carpet extending toward the crest without visible ring transitions, gaps, or banding.
3. **Terrain Seam:** The terrain ground underneath matches the root color (`#3d7a3a`) with root AO, making the grass-to-ground transition completely seamless.
4. **Lone Tree on Crest:** Low-poly tree sits prominently on the distant hill crest, perfectly framed against warm sunset ridges.
5. **Draw Calls & Budget:** Entire scene renders in 7 draw calls (Sky: 1, Ridges: 3, Terrain: 1, Grass: 1, Tree: 1), well below the 12 draw-call budget.

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

 ✓ tests/unit/math.test.ts (12 tests) 11ms
 ✓ tests/unit/prng.test.ts (8 tests) 31ms
 ✓ tests/unit/loop.test.ts (5 tests) 7ms
 ✓ tests/unit/grass-geometry.test.ts (3 tests) 10ms
 ✓ tests/unit/app.test.ts (5 tests) 12ms
 ✓ tests/unit/camera.test.ts (5 tests) 13ms
 ✓ tests/unit/noise.test.ts (3 tests) 28ms
 ✓ tests/unit/terrain.test.ts (6 tests) 9ms
 ✓ tests/unit/world-render.test.ts (4 tests) 118ms
 ✓ tests/unit/grass-generator.test.ts (4 tests) 428ms
 ✓ tests/unit/grass-system.test.ts (3 tests) 410ms

 Test Files  11 passed (11)
      Tests  58 passed (58)
   Start at  11:05:58
   Duration  1.34s (transform 679ms, setup 0ms, collect 2.66s, tests 1.08s, environment 3ms, prepare 2.11s)

> grass@0.1.0 build
> tsc --noEmit && vite build

vite v6.4.4 building for production...
transforming...
✓ 36 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                  5.15 kB │ gzip:   1.78 kB
dist/assets/index-p3qMdAAl.js  562.91 kB │ gzip: 144.07 kB │ map: 3,002.22 kB
✓ built in 1.99s

> grass@0.1.0 size
> node scripts/check-size.mjs

Asset Gzip Size Check:
--------------------------------------------------
- index-p3qMdAAl.js: raw 549.71 KB -> gzip 140.69 KB
--------------------------------------------------
Total bundle gzip: 140.69 KB (budget: 500 KB)
Largest JS file (index-p3qMdAAl.js): 140.69 KB (budget: 300 KB)
Size check PASSED.
```

### 2. `npx playwright test` (E2E Verification)

```
Running 6 tests using 1 worker

  ok 1 [chromium] › tests\e2e\grass.spec.ts:7:3 › M3 Grass Instancing & Wind Motion › renders grass with single draw call within total budget and default 90k blades (23.6s)
  ok 2 [chromium] › tests\e2e\grass.spec.ts:45:3 › M3 Grass Instancing & Wind Motion › configures blade counts via URL flag and supports runtime tier switching (6.1s)
  ok 3 [chromium] › tests\e2e\grass.spec.ts:83:3 › M3 Grass Instancing & Wind Motion › verifies wind displacement animation produces visible motion between frames (31.1s)
  ok 4 [chromium] › tests\e2e\grass.spec.ts:132:3 › M3 Grass Instancing & Wind Motion › captures golden grass meadow vista for visual review (39.2s)
  ok 5 [chromium] › tests\e2e\rendercore.spec.ts:5:3 › M2 Render Core & Golden Vista › boots 3D render core, satisfies draw call budget, handles visibility pause, and captures golden vista (47.7s)
  ok 6 [chromium] › tests\e2e\smoke.spec.ts:4:3 › Grass smoke test › boots without console errors and presents static entry overlay (20.4s)

  6 passed (3.1m)
```
