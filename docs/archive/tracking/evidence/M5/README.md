# Milestone M5: Brush Interaction & Hand Cursor Evidence

## 1. Overview & Verification Summary

Milestone M5 delivers the tactile meadow brush interaction, organic spring-back physics, and stylized hand cursor:

- **Analytic Ground Raycaster (`GroundRaycaster`)**: 0.5m ray marching from camera up to 120m with 6 binary refinement iterations for millimeter precision against `terrainHeight(x, z)`. Frame-level caching prevents redundant per-frame raycasts.
- **Brush Trail (`BrushTrail`)**: Ring buffer of trail points with tier capacity (16 high, 12 medium, 8 low). Points are pushed when moving $\ge 0.25\text{ m}$ or $\ge 40\text{ ms}$ with speed $> 0.4\text{ m/s}$. Radius scales with distance from camera ($\text{clamp}(1.4 + 0.05 \cdot \text{dist}, 1.4, 3.0)\text{ m}$), strength scales with speed ($\text{clamp}(\text{speed} / 6.0, 0.15, 1.0)$).
- **Spring Response Curve**: Evaluates $r(\text{age}) = \exp(-2.4 \cdot \text{age}) \cdot \cos(6.0 \cdot \text{age})$ with first overshoot ($\text{age} < 1.0\text{ s}$) clamped to $\ge -0.12$ (maximum $-12\%$ overshoot) and subsequent oscillations clamped to $\ge 0.0$ to ensure smooth decay to equilibrium. Points expire and are pruned at $\text{age} > 2.4\text{ s}$.
- **Unified Pointer & Virtual Keyboard Brush (`Pointer`, `KeyboardBrush`)**: Unified mouse/touch/pen handling with 3-frame rolling velocity smoothing. Arrow keys drive a virtual brush at 9 m/s ground-space, projecting to screen space for the hand cursor.
- **Hand Cursor (`HandCursor`)**: Clean, minimalist vector SVGs representing 3 states: `open` (resting palm), `moving` (trailing fingers with dynamic tilt $\text{clamp}(v_x \cdot 0.15, \pm 12^\circ)$), and `pressed` (closed fist). Position softly tracks pointer at $0.35/\text{frame}$. Hides for touch/pen and when leaving the canvas. Stays open with 0 rotation when pointing at the sky.
- **Zero-Allocation Hot Path**: Pre-allocated pools and scratch vectors guarantee zero runtime garbage collection pressure.

---

## 2. Automated Test Results

### Unit Tests (`npm test`)

```text
 ✓ tests/unit/moods.test.ts (7 tests)
 ✓ tests/unit/prng.test.ts (8 tests)
 ✓ tests/unit/noise.test.ts (3 tests)
 ✓ tests/unit/hand-cursor.test.ts (6 tests)
 ✓ tests/unit/math.test.ts (12 tests)
 ✓ tests/unit/pointer.test.ts (7 tests)
 ✓ tests/unit/grass-geometry.test.ts (3 tests)
 ✓ tests/unit/ground-raycaster.test.ts (5 tests)
 ✓ tests/unit/app.test.ts (5 tests)
 ✓ tests/unit/mood-controller.test.ts (4 tests)
 ✓ tests/unit/terrain.test.ts (6 tests)
 ✓ tests/unit/camera.test.ts (5 tests)
 ✓ tests/unit/world-render.test.ts (4 tests)
 ✓ tests/unit/grass-generator.test.ts (4 tests)
 ✓ tests/unit/brush-trail.test.ts (12 tests)
 ✓ tests/unit/loop.test.ts (5 tests)
 ✓ tests/unit/grass-system.test.ts (3 tests)

 Test Files  17 passed (17)
      Tests  99 passed (99)
```

### E2E Playwright Suite (`npx playwright test`)

```text
Running 13 tests using 1 worker

  ok  1 [chromium] › tests\e2e\brush.spec.ts:7:3 › M5 Brush Interaction & Hand Cursor › verifies hand cursor DOM states (open, moving, pressed, and sky behaviour) (923ms)
  ok  2 [chromium] › tests\e2e\brush.spec.ts:61:3 › M5 Brush Interaction & Hand Cursor › verifies keyboard virtual brush moving meadow blades via arrow keys (13.1s)
  ok  3 [chromium] › tests\e2e\brush.spec.ts:92:3 › M5 Brush Interaction & Hand Cursor › captures sweep and spring-back recovery screenshot sequence (t=0, 0.4, 1.0, 2.0, 3.0s) (1.4m)
  ok  4 [chromium] › tests\e2e\grass.spec.ts:7:3 › M3 Grass Instancing & Wind Motion › renders grass with single draw call within total budget and default 90k blades (26.5s)
  ok  5 [chromium] › tests\e2e\grass.spec.ts:45:3 › M3 Grass Instancing & Wind Motion › configures blade counts via URL flag and supports runtime tier switching (6.2s)
  ok  6 [chromium] › tests\e2e\grass.spec.ts:83:3 › M3 Grass Instancing & Wind Motion › verifies wind displacement animation produces visible motion between frames (29.5s)
  ok  7 [chromium] › tests\e2e\grass.spec.ts:132:3 › M3 Grass Instancing & Wind Motion › captures golden grass meadow vista for visual review (37.0s)
  ok  8 [chromium] › tests\e2e\moods.spec.ts:7:3 › M4 Mood System & Crossfade › boots with URL mood flag and switches moods via dev keys 1, 2, 3 (21.5s)
  ok  9 [chromium] › tests\e2e\moods.spec.ts:58:3 › M4 Mood System & Crossfade › captures visual evidence for dawn mood (19.4s)
  ok 10 [chromium] › tests\e2e\moods.spec.ts:83:3 › M4 Mood System & Crossfade › captures visual evidence for golden mood (24.8s)
  ok 11 [chromium] › tests\e2e\moods.spec.ts:108:3 › M4 Mood System & Crossfade › captures visual evidence for night mood (25.1s)
  ok 12 [chromium] › tests\e2e\rendercore.spec.ts:5:3 › M2 Render Core & Golden Vista › boots 3D render core, satisfies draw call budget, handles visibility pause, and captures golden vista (36.7s)
  ok 13 [chromium] › tests\e2e\smoke.spec.ts:4:3 › Grass smoke test › boots without console errors and presents static entry overlay (21.9s)

  13 passed (6.0m)
```

### Full Check Suite (`npm run check`)

- ESLint: 0 warnings, 0 errors
- TypeScript (`tsc --noEmit`): 0 errors
- Vitest: 99 passed (17 files)
- Bundle Gzip Size: 148.06 KB (Budget: 300 KB) — **PASSED**

---

## 3. Visual Review of Screenshot Evidence

| File                    | Timestamp          | Description & Physical State                                                                                                      |
| ----------------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `brush-sweep-t0.0s.png` | $t = 0.0\text{ s}$ | Active push displacement parting the grass outwards along the sweep vector. Hand cursor is dynamically rotated in `moving` state. |
| `brush-sweep-t0.4s.png` | $t = 0.4\text{ s}$ | Spring-back response reaches peak negative overshoot, gently pulling blades backward. Hand cursor has relaxed to `open` state.    |
| `brush-sweep-t1.0s.png` | $t = 1.0\text{ s}$ | Blades settling softly towards equilibrium.                                                                                       |
| `brush-sweep-t2.0s.png` | $t = 2.0\text{ s}$ | Subtle remaining displacement decaying to rest.                                                                                   |
| `brush-sweep-t3.0s.png` | $t = 3.5\text{ s}$ | Complete recovery to serene resting meadow posture. Active trail count has decayed to 0.                                          |

- Draw calls: 7 (well under $\le 12$ budget).
- Triangle count: 260.2k in medium tier.
- Blades: 45k in medium tier.
