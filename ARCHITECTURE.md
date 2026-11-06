# Grass Architecture & Render Pipeline

This document outlines the architecture, data flow, and rendering pipeline of the Grass application following the Phase A over-engineering cleanup.

---

## 1. System Overview

The application is structured into decoupled modules coordinated by `App.ts`:

```
src/
├── main.ts                   # Bootstraps canvas, mounts App, exposes window.__grass bridge
├── app/
│   ├── App.ts                # Main coordinator: binds WorldScene, Input, Audio, UI, Loop
│   ├── store.ts              # Minimal reactive UI/session state store
│   └── flags.ts              # Query parameter parsing & deterministic flags
├── core/
│   ├── Renderer.ts           # WebGL2 renderer (ACES Filmic tonemapping, sRGB, context recovery)
│   ├── Loop.ts               # RAF tick orchestrator with delta time clamping
│   ├── AdaptiveQuality.ts    # 1 Hz rate-limited quality tier manager (ultra, high, med, low)
│   └── storage.ts            # Safe LocalStorage wrapper for user preferences
├── world/
│   ├── WorldScene.ts         # Scene graph manager (Three.js Scene + camera + meshes)
│   ├── Grass.ts              # Instanced grass mesh & uniform animations
│   ├── grassGenerator.ts     # Stratified jittered Poisson-like placement
│   ├── grassGeometry.ts      # Segmented blade geometry with LOD support
│   ├── TerrainMesh.ts        # Analytical procedural rolling terrain
│   ├── Tree.ts               # Lone stylized meadow tree
│   ├── Ridges.ts             # 3 atmospheric mountain ridge silhouette layers
│   ├── Sky.ts                # Procedural analytic atmospheric dome
│   ├── Fireflies.ts          # Night mood point-sprite fireflies
│   ├── Seeds.ts              # Interactive floating dandelion seed particles
│   ├── MoodController.ts     # Smooth transitions between dawn, golden, and night
│   └── BrushTrail.ts         # Ping-pong interactive displacement canvas texture
├── input/
│   ├── InputCoordinator.ts   # Integrates pointer, keyboard brush, raycasting, and trail
│   ├── Pointer.ts            # Native pointer tracking + tap / hold gesture detection
│   ├── GroundRaycaster.ts    # Ray-terrain intersection for mouse-grass interaction
│   └── KeyboardBrush.ts      # WASD/arrow key virtual brush driver
├── audio/
│   ├── AudioCoordinator.ts   # Web Audio soundscape manager
│   ├── AudioEngine.ts        # Master audio context, master gain, compressor, mute fades
│   ├── Wind.ts               # Filtered noise wind synthesis modulated by mood
│   ├── Birds.ts              # Procedural bird chirping for dawn mood
│   ├── Crickets.ts           # Bandpassed FM/AM cricket synthesis for night mood
│   ├── Rustle.ts             # Interactive grass brushing rustle sound
│   └── Sfx.ts                # Chimes, seed scatter, and lie-down chords
└── ui/
    ├── Hud.ts                # Minimal HUD (MoodSwitch pills, SoundToggle, help button)
    ├── HintLine.ts           # Single subtle text cue ("brush the grass")
    ├── HowItWorks.ts         # Native HTML5 <dialog> modal with focus trap
    ├── Entry.ts              # Initial "step outside" splash curtain
    ├── Vignette.ts           # Post-process mood vignette overlay
    └── FallbackScreen.ts     # WebGL context lost recovery toast and guidance
```

---

## 2. Rendering Pipeline & Shaders

### 2.1 Lighting & Tonemapping

- **Tone Mapping:** `THREE.ACESFilmicToneMapping` with exposure `1.0` enabled in `Renderer.ts`. Every custom GLSL fragment shader includes Three.js `#include <tonemapping_fragment>` and `#include <colorspace_fragment>`.
- **Directional Diffuse:** Shaders compute Lambertian directional lighting `max(0.0, dot(normal, sunDir))` paired with a soft ambient fill (0.4x) to ensure natural shadow falloff.
- **Root Ambient Occlusion:** Grass blade bases anchor firmly into the ground with low root AO base (0.15) transitioning to full tip brightness.

### 2.2 Grass Deformation & Dynamic Normals

- **Wind Vector:** Shaders evaluate layered sinusoidal wind waves across blade height.
- **Normal Leaning:** In `grass.vert.glsl`, vertex normals are tilted dynamically in response to wind displacement, blade curve, and instance orientation using an orthonormal tangent-bitangent basis.

### 2.3 Atmospheric Fog & Ridges

- **Exp2 Fog:** Tuned exponential fog densities (`0.0045` dawn, `0.0038` golden, `0.0045` night) preserve the silhouette of all three distant ridge layers while maintaining depth perspective.

---

## 3. Capturing Deterministic Screenshots

Run the standardized Playwright capture script:

```bash
# Capture full suite (dawn, golden, night in vista and lie-down views)
node scripts/capture-standard-screens.mjs <output-dir>
```

This spins up an in-process Vite preview server, loads the application with `?compare=1&freeze=1&seed=42`, snapshots all moods and camera angles at 1920x1080 (DPR 1), and measures performance across quality tiers.

---

## 4. Related Documentation

- [README.md](./README.md) — Project overview, controls, and developer setup.
- [docs/STATE.md](./docs/STATE.md) — Active system health, verified benchmarks, and roadmap.
- [docs/CLEANUP_REPORT.md](./docs/CLEANUP_REPORT.md) — Comprehensive Phase A refactoring and render fix report.
