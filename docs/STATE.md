# Grass Project State (`docs/STATE.md`)

> **Single Source of Truth** for current system state, milestones, architecture, and verification metrics.  
> Read after every context reset alongside `AGENTS.md` and `C:\Users\HP\.gemini\config\global-pitfalls.md`.

---

## 1. System Overview & Philosophy

- **Project:** Grass — A calm, stylized, interactive 3D meadow that runs in the browser, built for developers needing a quick break.
- **Architecture Philosophy:** Zero-backend static client SPA. Decoupled subsystems coordinated via lightweight facade (`App.ts`).
- **Core Technology Stack:** Vite 6 + TypeScript 5.7 (strict mode) + vanilla Three.js r186 + custom WebGL2 GLSL shaders + Web Audio API synthesis. Hosted on Vercel.
- **Current Milestone / Phase:** **Phase A Cleanup & Render-Pipeline Fix Complete**. Codebase is decoupled, verified, and primed for Phase B visual redesign (asset-readiness & texture atlas).

---

## 2. Milestone & Delivery Progress

| Milestone / Phase | Scope                                                          |   Status    | Evidence / Reference                  |
| :---------------- | :------------------------------------------------------------- | :---------: | :------------------------------------ |
| **M0**            | Capability discovery, repo setup, tooling research             | ✅ Complete | `tracking/evidence/M0/`               |
| **M1**            | Tooling scaffold, CI, husky hooks, smoke test                  | ✅ Complete | `tracking/evidence/M1/`               |
| **M2 (G1)**       | WebGL2 render core, terrain heightfield, sky dome, tree        | ✅ Complete | `tracking/evidence/M2/`               |
| **M3 (G2)**       | Instanced grass (90k blades), dual-octave wind simulation      | ✅ Complete | `tracking/evidence/M3/`               |
| **M4 (G3)**       | Dynamic mood system (`dawn`, `golden`, `night`) & crossfade    | ✅ Complete | `tracking/evidence/M4/`               |
| **M5 (G4)**       | Interactive brush displacement trail & pointer raycasting      | ✅ Complete | `tracking/evidence/M5/`               |
| **M6 (G5)**       | Lie-down camera dip pose, parallax & vignette overlay          | ✅ Complete | `tracking/evidence/M6/`               |
| **M7 (G6)**       | Dandelion seeds & night firefly particle simulations           | ✅ Complete | `tracking/evidence/M7/`               |
| **M8 (G7)**       | Responsive UI shell, minimal HUD & native `<dialog>` help      | ✅ Complete | `tracking/evidence/M8/`               |
| **M9 (G8)**       | Procedural audio soundscape (wind, birds, crickets, rustle)    | ✅ Complete | `tracking/evidence/M9/`               |
| **M10 (G9)**      | Mobile touch controls, WCAG AA contrast & WebGL recovery       | ✅ Complete | `tracking/evidence/M10/`              |
| **M11 (G10)**     | Performance profiling, adaptive quality tiers & budgets        | ✅ Complete | `tracking/evidence/M11/`              |
| **Phase A**       | Over-engineering audit, dead code pruning, render pipeline fix | ✅ Complete | `docs/CLEANUP_REPORT.md`              |
| **Phase B**       | Reference-driven visual redesign, texture atlas & flower quads |   ⏳ Next   | `docs/OVERENGINEERING_AUDIT.md` §10.3 |

---

## 3. Subsystem Architecture (Post-Phase A)

The application coordinates its decoupled subsystems through `App.ts`:

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
│   └── BrushTrail.ts         # Interactive displacement canvas texture
├── input/
│   ├── InputCoordinator.ts   # Integrates pointer, keyboard brush, raycasting, and trail
│   ├── Pointer.ts            # Native pointer tracking + tap / hold gesture detection
│   ├── GroundRaycaster.ts    # Ray-terrain intersection for mouse-grass interaction
│   └── KeyboardBrush.ts      # WASD/arrow key virtual brush driver
├── audio/
│   ├── AudioCoordinator.ts   # Web Audio soundscape manager
│   ├── AudioEngine.ts        # Master audio context, limiter, mute fades
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

## 4. Current Quality & Health Metrics

- **Unit Tests:** 201/201 passing across 37 test files (`npm run test`).
- **TypeScript:** 0 errors in strict mode (`npm run typecheck`).
- **ESLint:** 0 warnings / 0 errors (`npm run lint`).
- **Bundle Size (Gzip):** Total ~165.89 KB (Budget: 500 KB); largest JS chunk ~164.10 KB (Budget: 300 KB).
- **Color Contrast:** 10/10 checks passing WCAG 2.1 AA luminance ratio ($\ge 4.5:1$).
- **Draw Calls:** 7 total scene draw calls (1 draw call for 90,000 grass blades).
- **Tone Mapping:** `THREE.ACESFilmicToneMapping` with exposure 1.0; tone mapping and colorspace GLSL chunks included across all fragment shaders.

---

## 5. Visual Test & Deterministic Harness

The application supports URL parameters for reproducible visual regression testing:

```
http://localhost:5173/?compare=1&mood=golden&camera=vista&freeze=1&seed=42&ui=0
```

- `compare=1`: Locks viewport to 1920x1080 at DPR 1.0 and sets fixed PRNG seed.
- `mood=dawn|golden|night`: Selects mood.
- `camera=vista|lying`: Sets standing vista pose or dipped lie-down pose.
- `freeze=1`: Stops procedural wind animation timer at a deterministic offset.
- `ui=0`: Hides HUD overlays for pure render verification.

### Capture Scripts:

- `node scripts/capture-standard-screens.mjs <out-dir>`: Captures full matrix of 3 moods x 2 camera angles.
- `node scripts/compare-reference.mjs <reference-png>`: Renders matching frame and produces side-by-side diff in `docs/visual-diffs/`.

---

## 6. Directory Map

- `src/`: Core application source code.
- `tests/unit/`: Vitest unit test suite (37 specs).
- `tests/e2e/`: Playwright end-to-end tests (including visual comparison snapshots).
- `tracking/`: Active project tracking, gate logs (`PROGRESS.md`, `USER-APPROVALS.md`), and test evidence (`tracking/evidence/`).
- `docs/`: Active documentation (`STATE.md`, `CLEANUP_REPORT.md`, `OVERENGINEERING_AUDIT.md`, `AGENT-README.md`).
- `docs/archive/`: Preserved historical design and technical specifications (00–07).
- `public/`: Static web assets (favicon, Open Graph image `og.png`).
- `scripts/`: Build and verification automation scripts.
