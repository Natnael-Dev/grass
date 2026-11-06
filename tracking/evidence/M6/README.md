# Milestone M6: Lie-Down, Parallax, and Idle Evidence

## 1. Overview & Verification Summary

Milestone M6 introduces the serene lie-down posture, enhanced camera parallax, and ambient idle mode:

- **Gesture Classifier (`GestureClassifier`)**: Precise pointer/keyboard interaction state machine (`idle`, `pressing`, `dragging`, `holding`).
  - 250 ms hold timer distinguishes intentional holds from quick brush sweeps.
  - 8 px movement threshold switches from press to drag/brush mode without false triggers.
  - Space key hold support with event repeat filtering.
  - 10-second continuous hold triggers Easter Egg 2 (`EE-2: meadow slumber`).
- **Lie-Down Camera Pose (`CameraRig`)**:
  - Smooth 1.1s cubic-bezier ease-out dip entry (`(0.22, 0.8, 0.2, 1)`), 0.9s ease-in-out recovery.
  - Standing pose: $(0, \text{terrainHeight} + 1.25\text{ m}, 10)$, FOV $50^\circ$, pitch $-4.5^\circ$.
  - Lying pose: $(0, \text{terrainHeight} + 0.38\text{ m}, 10)$ ($< 0.6\text{ m}$ above ground), FOV $62^\circ$, pitch $+9.0^\circ$ (gazing up through grass blades at the sky).
  - Ground clearance clamp: strictly clamps camera $y \ge \text{terrainHeight}(x, z) + 0.25\text{ m}$, preventing any terrain clipping across all coordinates.
  - Reduced motion mode (`prefers-reduced-motion` or flag): snappy 300 ms linear transition with fixed $50^\circ$ FOV.
- **Enhanced Parallax**:
  - Standing parallax: $\pm 6^\circ$ yaw, $\pm 3^\circ$ pitch based on pointer NDC.
  - Lying parallax: doubled sensitivity to $\pm 12^\circ$ yaw, $\pm 6^\circ$ pitch, giving an intimate, sensory perspective among the grass stems.
- **Ambient Idle Mode**:
  - Inactivity timer: transitions to idle after 25s without user pointer/keyboard input.
  - Sinusoidal camera drift: 0.04 Hz slow breathing drift ($\pm 1.5^\circ$ yaw and pitch).
  - Wind gusting: smooth 5.0s gust envelope reaching $1.6\times$ wind strength factor.
  - Exit damping: 0.4s smooth damping transition on user input return.
- **UI Enhancements (`Vignette`, `HandCursor`)**:
  - Radial gradient vignette overlay deepening by $+0.25$ opacity during lie-down.
  - HUD elements smoothly dim to $0.35$ opacity while lying.
  - Hand cursor switches to closed/resting fist on hold and automatically fades out after 1.0s.

---

## 2. Automated Test Results

### Unit Tests (`npm test`)

```text
 RUN  v3.2.7 C:/Users/HP/OneDrive/Desktop/Grass

 ✓ tests/unit/prng.test.ts (8 tests) 26ms
 ✓ tests/unit/gesture-classifier.test.ts (11 tests) 17ms
 ✓ tests/unit/hand-cursor.test.ts (7 tests) 12ms
 ✓ tests/unit/moods.test.ts (7 tests) 12ms
 ✓ tests/unit/pointer.test.ts (7 tests) 13ms
 ✓ tests/unit/vignette.test.ts (4 tests) 10ms
 ✓ tests/unit/brush-trail.test.ts (12 tests) 11ms
 ✓ tests/unit/noise.test.ts (3 tests) 32ms
 ✓ tests/unit/mood-controller.test.ts (4 tests) 13ms
 ✓ tests/unit/app.test.ts (5 tests) 13ms
 ✓ tests/unit/ground-raycaster.test.ts (5 tests) 13ms
 ✓ tests/unit/camera.test.ts (10 tests) 22ms
 ✓ tests/unit/world-render.test.ts (4 tests) 124ms
 ✓ tests/unit/math.test.ts (12 tests) 10ms
 ✓ tests/unit/grass-generator.test.ts (4 tests) 452ms
 ✓ tests/unit/loop.test.ts (5 tests) 6ms
 ✓ tests/unit/terrain.test.ts (6 tests) 7ms
 ✓ tests/unit/grass-geometry.test.ts (3 tests) 8ms
 ✓ tests/unit/grass-system.test.ts (3 tests) 486ms

 Test Files  19 passed (19)
      Tests  120 passed (120)
   Duration  1.63s
```

### E2E Playwright Suite (`npx playwright test`)

```text
Running 17 tests using 1 worker

  ok  1 [chromium] › tests\e2e\brush.spec.ts:7:3 › M5 Brush Interaction & Hand Cursor › verifies hand cursor DOM states (open, moving, pressed, and sky behaviour) (849ms)
  ok  2 [chromium] › tests\e2e\brush.spec.ts:61:3 › M5 Brush Interaction & Hand Cursor › verifies keyboard virtual brush moving meadow blades via arrow keys (14.2s)
  ok  3 [chromium] › tests\e2e\brush.spec.ts:92:3 › M5 Brush Interaction & Hand Cursor › captures sweep and spring-back recovery screenshot sequence (t=0, 0.4, 1.0, 2.0, 3.0s) (1.4m)
  ok  4 [chromium] › tests\e2e\grass.spec.ts:7:3 › M3 Grass Instancing & Wind Motion › renders grass with single draw call within total budget and default 90k blades (27.4s)
  ok  5 [chromium] › tests\e2e\grass.spec.ts:45:3 › M3 Grass Instancing & Wind Motion › configures blade counts via URL flag and supports runtime tier switching (6.3s)
  ok  6 [chromium] › tests\e2e\grass.spec.ts:83:3 › M3 Grass Instancing & Wind Motion › verifies wind displacement animation produces visible motion between frames (31.1s)
  ok  7 [chromium] › tests\e2e\grass.spec.ts:132:3 › M3 Grass Instancing & Wind Motion › captures golden grass meadow vista for visual review (37.2s)
  ok  8 [chromium] › tests\e2e\liedown.spec.ts:4:3 › Milestone M6: Lie-Down, Parallax, and Idle (Gate G5) › hold lowers camera (< 0.6 m above ground) and release restores to standing pose (40.3s)
  ok  9 [chromium] › tests\e2e\liedown.spec.ts:51:3 › Milestone M6: Lie-Down, Parallax, and Idle (Gate G5) › verifies no terrain clipping in lying pose across sample coordinates (42.5s)
  ok 10 [chromium] › tests\e2e\liedown.spec.ts:74:3 › Milestone M6: Lie-Down, Parallax, and Idle (Gate G5) › idle mode triggers after 25s inactivity and applies wind gusting (31.8s)
  ok 11 [chromium] › tests\e2e\liedown.spec.ts:107:3 › Milestone M6: Lie-Down, Parallax, and Idle (Gate G5) › Space key hold triggers lie-down pose (30.9s)
  ok 12 [chromium] › tests\e2e\moods.spec.ts:7:3 › M4 Mood System & Crossfade › boots with URL mood flag and switches moods via dev keys 1, 2, 3 (22.1s)
  ok 13 [chromium] › tests\e2e\moods.spec.ts:58:3 › M4 Mood System & Crossfade › captures visual evidence for dawn mood (19.8s)
  ok 14 [chromium] › tests\e2e\moods.spec.ts:83:3 › M4 Mood System & Crossfade › captures visual evidence for golden mood (25.3s)
  ok 15 [chromium] › tests\e2e\moods.spec.ts:108:3 › M4 Mood System & Crossfade › captures visual evidence for night mood (25.7s)
  ok 16 [chromium] › tests\e2e\rendercore.spec.ts:5:3 › M2 Render Core & Golden Vista › boots 3D render core, satisfies draw call budget, handles visibility pause, and captures golden vista (38.1s)
  ok 17 [chromium] › tests\e2e\smoke.spec.ts:4:3 › Grass smoke test › boots without console errors and presents static entry overlay (22.4s)

  17 passed (7.4m)
```

### Full Check Suite (`npm run check`)

- ESLint: 0 warnings, 0 errors
- TypeScript (`tsc --noEmit`): 0 errors
- Vitest: 120 passed (19 files)
- Bundle Gzip Size: 150.21 KB (Budget: 300 KB) — **PASSED**

---

## 3. Visual Review of Screenshot Evidence

| File                | Perspective & State                                                                                                                                                                                                                                |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `standing-pose.png` | Standing vista pose at $(0, \text{terrainHeight} + 1.25, 10)$, FOV $50^\circ$. Broad meadow vista with foreground grass, rolling midground hills, distant mountain ridges, solitary tree, and starry sky.                                          |
| `lying-pose.png`    | Lying pose at $(0, \text{terrainHeight} + 0.38, 10)$ ($< 0.6\text{ m}$ above ground), FOV $62^\circ$, pitch $+9.0^\circ$. View looks upward through grass stems toward the tree and moon with dithered near-plane stippling and deepened vignette. |

- Draw calls: 7 (well within $\le 12$ budget).
- Triangles: 260.2k (medium tier).
- Blades: 45k (medium tier).
- Terrain clipping: 0 instances across all evaluated coordinates.
