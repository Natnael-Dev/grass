# Milestone M2 Evidence: Render Core (Gate G1)

## Requirements Covered

- **FR-02 World:** Analytic terrain (`terrainHeight(x, z)`), procedural gradient sky dome with glowing sun disc and clouds, 3 layered mountain ridge silhouettes (`z = -160, -230, -310`), lone stylized low-poly tree on hill crest `(6, terrainHeight(6, -26), -26)`.
- **FR-19 Visibility:** Rendering automatically pauses when tab is hidden via `visibilitychange`; frame delta time clamps to 0.1s to prevent physics/animation jumps on resume.

---

## Gate Checklist

- [x] Milestone tasks all done; no TODO/FIXME left behind
- [x] `npm run check` passed (verbatim output below)
- [x] Milestone-specific gate commands passed (`npm run test:e2e`)
- [x] Screenshot viewed and judged against the art-direction checklist
- [x] Review swarm done; no blockers
- [x] Docs/ADR updated (`ADR-012` for case-insensitive filesystem module naming)
- [x] `PROGRESS.md` updated
- [x] Commits atomic, conventional; tree clean

---

## Screenshot Visual Evaluation

File: `tracking/evidence/M2/golden-vista.png`

**Evaluator judgment (inspected via `view_file` tool):**

1. **Composition & Horizon:** The horizon sits at ~42-45% from the top of the frame, adhering to the composition rules in `art-direction.md`.
2. **Sun Disc & Atmosphere:** The golden sun disc with soft halo is positioned in the upper-right third of the frame, casting warm golden illumination.
3. **Mountain Ridges:** Three distinct mountain silhouette ribbons are visible against the horizon, progressively receding into atmospheric exponential squared fog (`fogDensity = 0.016`).
4. **Tree on Crest:** The low-poly silhouette tree sits atop the hill crest slightly left of center-right; trunk and segmented icosahedral foliage clusters read distinctly as an organic silhouette tree.
5. **Draw Call & Triangle Budget:** Debug stats overlay in the upper-left reports `fps: 60`, `calls: 6` (well under the budget of 10 draw calls), `tris: 35.2k` (well under the 50k budget), `blades: 0`.

---

## Verbatim Verification Outputs

### 1. `npm run check`

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

 ✓ tests/unit/math.test.ts (12 tests) 9ms
 ✓ tests/unit/prng.test.ts (8 tests) 29ms
 ✓ tests/unit/loop.test.ts (5 tests) 8ms
 ✓ tests/unit/app.test.ts (5 tests) 13ms
 ✓ tests/unit/camera.test.ts (5 tests) 13ms
 ✓ tests/unit/terrain.test.ts (6 tests) 9ms
 ✓ tests/unit/world-render.test.ts (4 tests) 102ms

 Test Files  7 passed (7)
      Tests  45 passed (45)
   Start at  01:05:50
   Duration  1.06s (transform 592ms, setup 0ms, collect 1.28s, tests 184ms, environment 2ms, prepare 1.75s)

> grass@0.1.0 build
> tsc --noEmit && vite build

vite v6.4.4 building for production...
transforming...
✓ 29 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                  5.15 kB │ gzip:   1.79 kB
dist/assets/index-CJCfpNUK.js  550.01 kB │ gzip: 140.14 kB │ map: 2,962.23 kB

✓ built in 2.19s

> grass@0.1.0 size
> node scripts/check-size.mjs

Asset Gzip Size Check:
--------------------------------------------------
- index-CJCfpNUK.js: raw 537.12 KB -> gzip 136.86 KB
--------------------------------------------------
Total bundle gzip: 136.86 KB (budget: 500 KB)
Largest JS file (index-CJCfpNUK.js): 136.86 KB (budget: 300 KB)
Size check PASSED.
```

### 2. `npm run test:e2e`

```
> grass@0.1.0 test:e2e
> playwright test

Running 2 tests using 1 worker

  ok 1 [chromium] › tests\e2e\rendercore.spec.ts:5:3 › M2 Render Core & Golden Vista › boots 3D render core, satisfies draw call budget, handles visibility pause, and captures golden vista (4.8s)
  ok 2 [chromium] › tests\e2e\smoke.spec.ts:4:3 › Grass smoke test › boots without console errors and presents static entry overlay (3.7s)

  2 passed (12.2s)
```

---

## Commits on `feat/m2-render-core`

- `cfc64a9` — `feat(core): add deterministic PRNG with unit tests`
- `3fff182` — `feat(world): add analytic terrainHeight function and normal generator with unit tests`
- `bc41cd6` — `feat(core): implement WebGL2 Renderer and rAF Loop with visibility pause and dt clamping`
- `d300ad6` — `feat(camera): implement CameraRig with base vista pose and ground clearance clamp`
- `38867fd` — `feat(world): add procedural gradient Sky shader with sun disc and clouds`
- `79e4f09` — `feat(world): add Terrain mesh and layered Ridges with fog integration`
- `50d8f20` — `feat(world): add low-poly silhouette Tree on hill crest`
- `8393e80` — `feat(core): add app state store, URL flags, capabilities check, and debug stats overlay`
- `a3cd6ea` — `test(core): add render core visual verification test and capture golden vista screenshot`
