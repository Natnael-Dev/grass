# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned (Phase B)

- Reference-image driven visual redesign.
- Static foliage texture atlas for multi-species wildflower instancing (poppies, daisies, clover).
- Low-poly silhouette tree model replacement and organic terrain texturing.

---

## [0.2.0] - 2026-10-23

### Changed

- **Architectural Refactoring:** Extracted monolithic logic from `App.ts` into specialized subsystem coordinators: `WorldScene.ts` (3D scene graph), `InputCoordinator.ts` (interaction & raycasting), and `AudioCoordinator.ts` (Web Audio lifecycle).
- **ACES Filmic Tone Mapping:** Enabled `THREE.ACESFilmicToneMapping` with exposure 1.0 in `Renderer.ts`, adding Three.js `<tonemapping_fragment>` and `<colorspace_fragment>` chunks across all fragment shaders.
- **Dynamic Grass Normals:** Tilted grass blade vertex normals dynamically under wind wave displacement and curvature lean, eliminating the static flat-card look and introducing specular wind response.
- **Atmospheric Fog Calibration:** Tuned exponential fog densities (`0.0045` dawn, `0.0038` golden, `0.0045` night) to restore mountain ridge silhouette visibility and scenic horizon depth.
- **Directional Lighting & Ground Anchoring:** Replaced flat wrap-diffuse with directional Lambertian diffuse lighting, reducing ambient fill to 0.4x and dropping root ambient occlusion base to 0.15 for grounding blades into terrain.
- **Adaptive Quality Simplification:** Replaced per-frame QuickSorts with a 1 Hz rate-limited evaluation on rolling moving average in `AdaptiveQuality.ts`.
- **UI Simplification:** Replaced bespoke 260-line focus trap with native HTML5 `<dialog>` in `HowItWorks.ts`. Folded standalone sound and mood switches directly into `Hud.ts`.

### Fixed

- **Audio Modulation Defect:** Connected AM modulation oscillator in `Crickets.ts` (`amOsc -> amGain -> amVca.gain`), replacing continuous tinnitus whine with genuine rhythmic chirps.
- **Duplicate Pointer Listener:** Removed duplicate canvas `pointerleave` listener.
- **Quality Tier Double-Dispatch:** Fixed redundant dual-invocation on tier change where an imperative update and a reactive store subscriber were both firing.
- **Circular Dependency:** Untangled circular imports between `src/world/terrain.ts` and `src/world/TerrainMesh.ts`.

### Removed

- Removed digital uptime clock (`Uptime.ts`) from the HUD to preserve the calm, distraction-free aesthetic.
- Removed simulated terminal exit console screen (`ExitScreen.ts`).
- Removed custom SVG spring hand cursor (`HandCursor.ts`) in favor of native CSS pointer cursors.
- Deleted dead shader code (`fog.glsl`) and unused uniform `uFogColor`.
- Reduced instance buffer memory allocation by removing unused `rand.y` attribute channel.

### Added

- **Deterministic Visual Test Harness:** Added URL query parameters (`?compare=1`, `?mood=`, `?camera=`, `?freeze=1`, `?seed=`, `?ui=0`) for reproducible visual regression audits.
- Added Playwright snapshot regression test suite (`tests/e2e/visual-comparison.spec.ts`) covering all 6 combinations of moods and camera poses.
- Added `scripts/compare-reference.mjs` utility for automated pixel diffs and side-by-side visual comparisons against concept art.

---

## [0.1.0] - 2026-10-20

### Added

- **M0 (Bootstrap):** Project scaffold with Vite, TypeScript (strict), and Three.js.
- **M1 (Tooling & CI):** ESLint flat config, Prettier, Vitest, Playwright, bundle size checker, and GitHub Actions CI workflow.
- **M2 (Render Core):** Procedural terrain heightfield and normal generators, Mulberry32 PRNG, camera rig with vista pose, and procedural gradient sky dome.
- **M3 (Grass Instancing):** Up to 90,000 instanced grass blades with LOD segmentation, stratified jittered Poisson placement, and dual-octave wind noise simulation.
- **M4 (Mood System):** Dynamic presets (`dawn`, `golden`, `night`) with retargetable crossfading for lighting, sky colors, and fog.
- **M5 (Interactive Brush):** Ground raycaster with binary search refinement, dynamic displacement trail canvas texture, and keyboard brush navigation.
- **M6 (Lie-Down Experience):** Camera dip transition, doubled parallax, dynamic vignette overlay, and reduced-motion compensation.
- **M7 (Particles):** Procedural dandelion seed particles drifting on wind waves and glowing nighttime firefly point sprites.
- **M8 (UI Shell):** Minimalist glassmorphism HUD, fade hint cue ("brush the grass"), How It Works guidance modal, and custom 404 page.
- **M9 (Procedural Soundscape):** Filtered noise wind, procedural dawn birds, bandpassed nighttime crickets, and grass rustle synthesis.
- **M10 (Mobile & Accessibility):** Responsive touch controls, safe-area insets, WCAG 2.1 AA color contrast compliance, and WebGL context loss auto-recovery.
- **M11 (Adaptive Performance):** Rolling frame monitor and multi-tier quality scaling (Ultra, High, Medium, Low) enforcing a 500 KB gzip bundle budget.
