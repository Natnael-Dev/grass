# Milestone M7: Seeds and Fireflies Evidence

## 1. Overview & Verification Summary

Milestone M7 introduces the tactile dandelion seed scattering interaction and luminous night fireflies:

- **Procedural Seed Texture & System (`Seeds`)**:
  - Procedural 64x64 RGBA 6-spoke dandelion fluff texture generated via mathematical radial symmetry and filament bristles with soft falloff.
  - CPU-side typed-array simulation (positions, velocities, ages, lifetimes, alphas, base sizes) with a zero-allocation particle pool.
  - Tier spawn counts: 18 (high), 14 (medium), 10 (low).
  - Physical motion:
    - Initial velocity: vertical $v_y \in [1.2, 2.4]\text{ m/s}$ upward impulse, horizontal $v_h \in [0.3, 0.8]\text{ m/s}$ in random direction.
    - Wind acceleration: $0.6 \cdot \text{windStrength}$ along the active meadow wind direction vector.
    - Drag: $0.8/\text{s}$ linear damping.
    - Sink: after apex ($v_y \le 0$), smoothly settles downwards towards terminal sink speed of $-0.25\text{ m/s}$.
    - Ground settling: upon reaching ground level ($y \le \text{terrainHeight}(x, z)$), seeds settle softly.
    - Alpha curve: 0.15s fade-in, steady full opacity, 1.0s fade-out over random lifetime $3.5 - 5.5\text{ s}$.
    - Tint: dandelion fluff tinted by current mood `lightColor`.
    - Coupled tap impulse: pushing ground tap also injects a strong brush trail impulse (radius $\times 1.3$, strength $1.0$).
  - Draw call optimization: when active count is 0, `mesh.visible = false` (0 draw calls).
- **GPU-Animated Fireflies System (`Fireflies`)**:
  - Tier capacities: 90 (high), 60 (medium), 30 (low) using dynamic draw range.
  - Distributed across the meadow volume in front of the camera ($x \in [-35, 35]\text{ m}$, $z \in [-30, 15]\text{ m}$, height $0.25 - 2.2\text{ m}$ above ground).
  - GPU-side continuous 3D Lissajous wander in vertex shader.
  - Blinking curve: `smoothstep(0.55, 1.0, sin(t * f + phase))^2` with varied individual frequencies and phases.
  - Soft glowing additive falloff in fragment shader with `#d9ff7a` color.
  - Mood crossfade: visibility and intensity ride `moodState.firefliesAmount` (1.0 at night, 0.0 in dawn/golden). When amount $\le 0.001$, `mesh.visible = false` to completely eliminate the draw call during daylight!
- **Budgets & Performance**:
  - Total scene draw calls: 7 (daytime without seeds), 8 (daytime with seeds or night without seeds), 9 (night with active seeds). All $\le 9$ calls, well within the $\le 12$ budget!
  - Hot path: zero runtime allocations.

---

## 2. Automated Test Results

### Unit Tests (`npm test`)

```text
 RUN  v3.2.7 C:/Users/HP/OneDrive/Desktop/Grass

 ✓ tests/unit/prng.test.ts (8 tests) 31ms
 ✓ tests/unit/moods.test.ts (7 tests) 12ms
 ✓ tests/unit/gesture-classifier.test.ts (11 tests) 17ms
 ✓ tests/unit/noise.test.ts (3 tests) 25ms
 ✓ tests/unit/pointer.test.ts (7 tests) 14ms
 ✓ tests/unit/math.test.ts (12 tests) 11ms
 ✓ tests/unit/app.test.ts (5 tests) 14ms
 ✓ tests/unit/mood-controller.test.ts (4 tests) 13ms
 ✓ tests/unit/camera.test.ts (10 tests) 21ms
 ✓ tests/unit/ground-raycaster.test.ts (5 tests) 13ms
 ✓ tests/unit/seeds.test.ts (7 tests) 32ms
 ✓ tests/unit/fireflies.test.ts (5 tests) 29ms
 ✓ tests/unit/world-render.test.ts (4 tests) 151ms
 ✓ tests/unit/grass-generator.test.ts (4 tests) 523ms
 ✓ tests/unit/hand-cursor.test.ts (7 tests) 11ms
 ✓ tests/unit/vignette.test.ts (4 tests) 10ms
 ✓ tests/unit/grass-system.test.ts (3 tests) 555ms
 ✓ tests/unit/brush-trail.test.ts (13 tests) 11ms
 ✓ tests/unit/grass-geometry.test.ts (3 tests) 10ms
 ✓ tests/unit/loop.test.ts (5 tests) 7ms
 ✓ tests/unit/terrain.test.ts (6 tests) 10ms

 Test Files  21 passed (21)
      Tests  133 passed (133)
   Duration  1.85s
```

### E2E Playwright Suite (`npx playwright test tests/e2e/seeds-fireflies.spec.ts`)

```text
Running 4 tests using 1 worker

  ok 1 [chromium] › tests\e2e\seeds-fireflies.spec.ts:7:3 › Milestone M7: Seeds and Fireflies (Gate G6) › tap scatters seeds (> 0) which drift, sink, and decay to 0 within 6s (833ms)
  ok 2 [chromium] › tests\e2e\seeds-fireflies.spec.ts:61:3 › Milestone M7: Seeds and Fireflies (Gate G6) › tier switching configures firefly count (90/60/30) and seed spawn count (18/14/10) (44.6s)
  ok 3 [chromium] › tests\e2e\seeds-fireflies.spec.ts:84:3 › Milestone M7: Seeds and Fireflies (Gate G6) › golden mood has 0 fireflies drawn while night mood activates fireflies within draw call budget (5.3s)
  ok 4 [chromium] › tests\e2e\seeds-fireflies.spec.ts:119:3 › Milestone M7: Seeds and Fireflies (Gate G6) › captures visual evidence screenshots for seeds scatter and nighttime fireflies (59.1s)

  4 passed (2.1m)
```

### Full Check Suite (`npm run check`)

- ESLint: 0 warnings, 0 errors
- TypeScript (`tsc --noEmit`): 0 errors
- Vitest: 133 passed (21 files)
- Bundle Gzip Size: 153.26 KB (Budget: 300 KB) — **PASSED**

---

## 3. Visual Review of Screenshot Evidence

| File                  | Perspective & Visual Quality                                                                                                                                                                         |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `seeds-scatter.png`   | Golden mood meadow scene with dandelion seeds floating in the air $0.4\text{ s}$ after tap, tinted with warm golden sunlight, accompanied by parting grass blades beneath them from the tap impulse. |
| `fireflies-night.png` | Night vista with glowing additive `#d9ff7a` fireflies floating and blinking above the meadow grass and around the lone tree silhouette under the starry night sky. Draw calls: 8 ($\le 12$).         |

- Draw calls: 7–8 calls across moods.
- Triangles: 260.2k (medium tier).
- Blades: 45k (medium tier).
- Clean console: 0 errors or warnings.
