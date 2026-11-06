# Phase A Cleanup & Render-Pipeline Fix Report

**Branch:** `cleanup/phase-a`  
**Starting Commit:** `pre-cleanup` (`486cced`)  
**Completed Commit:** `0551217`  
**Status:** Completed & Verified

---

## 1. Executive Summary

Phase A resolved the architectural bloat, latent audio/interaction bugs, dead code, and visual pipeline blockers identified in `docs/OVERENGINEERING_AUDIT.md`. The codebase is now decoupled, fully covered by deterministic visual tests, and primed for the reference-driven visual redesign (Phase B).

---

## 2. Changes Implemented Per Step

### Step 0: Baseline Recording (`f0c3afa`)

- Captured un-retouched baseline screenshots for 3 moods (`dawn`, `golden`, `night`) across 2 camera views (`vista`, `lying`) at 1920x1080 (DPR 1).
- Measured draw calls, triangle counts, and frame rates across all 3 quality tiers (`high`, `medium`, `low`).
- Stored all reference baseline artifacts in `docs/baseline/`.

### Step 1: Bug Fixes (`3da0f03`)

- **Audio AM Modulator Fix:** Connected the amplitude modulation graph in `Crickets.ts` (`amOsc -> amGain -> amVca.gain`, with carrier passing through `amVca` to output) so nighttime cricket chirp cadence actually modulates. Added node-level graph validation tests in `audio-layers.spec.ts`.
- **Duplicate Pointer Listener:** Removed redundant `pointerleave` listener on the canvas, centralizing interaction state within `Pointer.onLeave`.
- **Quality Tier Double-Dispatch:** Eliminated redundant dual-invocation on tier change where an imperative update and a reactive store subscriber were both firing.
- **Circular Dependency Break:** Untangled circular imports between `src/world/terrain.ts` and `src/world/TerrainMesh.ts`.

### Step 2: Dead Code Removal (`90b1683`)

- Deleted unused shader file `src/world/shaders/fog.glsl`.
- Removed unused `uFogColor` uniform from `Sky.ts` and `sky.frag.glsl`.
- Converted `rand` instance buffer attribute from `vec2` to `float`, eliminating an unused attribute channel and saving ~360 KB of GPU buffer allocation.
- Removed unused math functions (`smootherstep`, `invLerp`) and dead loop field `fixedDt`.
- Removed unused `SafeStorage` methods (`removeItem`, `clear`) and dead store fields.
- Added support for `?tier=` as an alias for `?quality=` in `flags.ts`.

### Step 3: Render Pipeline Fixes (Visual Quality Blockers)

Carried out in 4 separate, individually revertible commits:

- **Step 3a (`b69d50d`) — ACES Filmic Tone Mapping:**
  - Enabled `THREE.ACESFilmicToneMapping` with exposure `1.0` in `Renderer.ts`.
  - Added `#include <tonemapping_fragment>` and `#include <colorspace_fragment>` across all 5 fragment shaders (`grass`, `terrain`, `tree`, `ridge`, `sky`).
  - _Visual Result:_ Eliminated blown-out highlight clipping and harsh neon saturation; smoothed highlights across the meadow.
- **Step 3b (`bd98a18`) — Atmospheric Fog Calibration:**
  - Lowered exponential fog density (`0.0045` dawn, `0.0038` golden, `0.0045` night) in `moods.ts` and calibrated ridge opacity in `Ridges.ts`.
  - _Visual Result:_ All three mountain ridge layers are now clearly visible, creating cinematic depth perspective instead of obscuring the horizon in dense haze.
- **Step 3c (`8c437f4`) — Dynamic Grass Normal Leaning:**
  - Tilted grass blade normals dynamically in `grass.vert.glsl` based on wind displacement vector, blade curve, and instance yaw using an orthonormal tangent-bitangent basis.
  - _Visual Result:_ Blades now reflect specular highlights and catch light directional shifts as they bend under wind waves, eliminating the static "plastic card" look.
- **Step 3d (`af94367`) — Lighting Contrast & Ground Anchoring:**
  - Replaced wrap-diffuse with directional Lambertian diffuse lighting (`max(0.0, dot(normal, sunDir))`), reduced ambient fill to 0.4x, and lowered root AO base from `0.55` to `0.15`.
  - _Visual Result:_ Grass blades now have a distinct sunlit face and shadow side; dark roots anchor blades convincingly into the ground.

### Step 4: Structural Simplification (`fe0983f`)

- Extracted subsystem coordinators out of `src/app/App.ts`:
  - `src/world/WorldScene.ts`: Manages Three.js scene graph, instanced meshes, and mood transitions.
  - `src/input/InputCoordinator.ts`: Manages pointer, raycasting, keyboard brush, and brush trail.
  - `src/audio/AudioCoordinator.ts`: Manages Web Audio synthesizers and audio lifecycle.
- Folded standalone UI classes `SoundToggle.ts` and `MoodSwitch.ts` into `src/ui/Hud.ts`.
- Replaced manual 260-line DOM focus trap in `HowItWorks.ts` with native HTML5 `<dialog>`.
- Simplified `AdaptiveQuality.ts`: Rate-limited evaluations to 1 Hz on moving average, removed per-frame `.sort()` allocations, and eliminated speculative auto-upgrading.
- Folded gesture detection directly into `Pointer.ts`.

### Step 5: Owner Decisions Applied (`6121490`)

- **Uptime Counter:** DELETED entirely (`src/ui/Uptime.ts` deleted, store field and DOM elements removed).
- **Exit Terminal Screen:** DELETED screen overlay (`src/ui/ExitScreen.ts` deleted), while preserving devtools console greeting.
- **Hand Cursor:** DELETED custom SVG hand cursor with spring physics (`src/ui/HandCursor.ts` deleted); reverted `#scene` to native CSS pointer cursor.
- **Hint Sequencer:** Replaced multi-step tutorial sequencer with single subtle fade hint ("brush the grass"), automatically dismissed on first interaction and persisted via `hintsSeen`.
- **Docs & Tracking Archival:** Consolidated master guidance into root `README.md` and `ARCHITECTURE.md`. Moved legacy specs, plans, and tracking logs into `docs/archive/`.

### Step 6: Screenshot Comparison Harness (`0551217`)

- Added deterministic URL flags: `?compare=1&mood=...&camera=...&freeze=1&seed=...&ui=0`. When `compare=1`, DPR is locked to 1.0, animations freeze deterministically, and `ui=0` hides HUD elements.
- Added Playwright regression test suite `tests/e2e/visual-comparison.spec.ts` with `toHaveScreenshot` baselines covering all 6 combinations (3 moods x 2 camera views).
- Removed legacy byte-count size assertion tests in `grass.spec.ts`, `rendercore.spec.ts`, and `moods.spec.ts`.
- Created reference comparison utility `scripts/compare-reference.mjs` that outputs `reference.png`, `actual.png`, `diff.png`, and a combined 3-panel `side_by_side.png` into `docs/visual-diffs/`.

---

## 3. Quantitative Comparison: Before vs. After

| Metric                          | Before (Step 0) | After (Step 6)         | Delta                     |
| ------------------------------- | --------------- | ---------------------- | ------------------------- |
| **Source LOC (`src/`)**         | ~10,500 LOC     | 8,860 LOC              | **-1,640 LOC (-15.6%)**   |
| **Source Files (`src/`)**       | 76 files        | 69 files               | **-7 files**              |
| **Production JS Bundle (raw)**  | 672.60 KB       | 658.03 KB              | **-14.57 KB**             |
| **Production JS Bundle (gzip)** | 170.82 KB       | 168.04 KB              | **-2.78 KB**              |
| **Production CSS Bundle (raw)** | 5.96 KB         | 5.78 KB                | **-0.18 KB**              |
| **Unit Tests Passing**          | 201 tests       | 201 tests              | **100% Green (37 files)** |
| **Visual Baselines**            | 0 (byte counts) | 6 Playwright snapshots | **3 moods x 2 views**     |
| **Draw Calls (Scene Total)**    | 7               | 7                      | Maintained (1 for Grass)  |
| **High Tier Triangles**         | 665,224         | 665,224                | 90,000 blades             |
| **Medium Tier Triangles**       | 260,224         | 260,224                | 45,000 blades             |
| **Low Tier Triangles**          | 89,224          | 89,224                 | 18,000 blades             |
| **Frame Rate**                  | 60 FPS          | 60 FPS                 | Solid                     |

---

## 4. Screenshot Evidence Paths

- **Baseline Captures:**
  - `docs/baseline/vista_dawn.png`
  - `docs/baseline/vista_golden.png`
  - `docs/baseline/vista_night.png`
  - `docs/baseline/liedown_dawn.png`
  - `docs/baseline/liedown_golden.png`
  - `docs/baseline/liedown_night.png`
- **Render Pipeline Progression:**
  - Tone Mapping: `docs/pipeline_fixes/3a_tonemapping/`
  - Atmospheric Fog: `docs/pipeline_fixes/3b_fog/`
  - Dynamic Normals: `docs/pipeline_fixes/3c_normals/`
  - Directional Diffuse & Root AO: `docs/pipeline_fixes/3d_lighting/`
- **Step 4 Architecture Simplification:** `docs/pipeline_fixes/step4/`
- **Step 5 Minimal HUD & Native Cursor:** `docs/pipeline_fixes/step5/`
- **Step 6 Final Comparison Harness:** `docs/pipeline_fixes/step6/`
- **Reference Comparison Output:**
  - `docs/visual-diffs/reference.png`
  - `docs/visual-diffs/actual.png`
  - `docs/visual-diffs/diff.png`
  - `docs/visual-diffs/side_by_side.png`

---

## 5. Reverts & Workarounds

- No step required full reversal.
- **Playwright Screenshot Timing in SwiftShader:** `toHaveScreenshot` timed out in headless software rasterization due to continuous requestAnimationFrame updates. Resolved by stopping the frame loop during static visual baseline evaluations (`app.loop.stop()`).

---

## 6. Recommendations for Phase B (Visual Redesign)

1. **Reference Art Alignment:** Ingest the owner's reference concept images and tune color gradients (sun elevation, sky shader ramps, ridge color tokens) using `scripts/compare-reference.mjs`.
2. **Wildflower Texture Atlas:** Introduce an instanced wildflower layer (poppies, daisies, dandelions) interspersed using Poisson jitter points without increasing draw call count.
3. **Butterfly Sprite Particles:** Add 4–8 animated butterfly billboards fluttering lazily across the meadow in daylight moods.
4. **Subtle Ground Texture Blend:** Replace the flat procedural vertex color terrain with a stylized dirt/moss normal and detail blend.
