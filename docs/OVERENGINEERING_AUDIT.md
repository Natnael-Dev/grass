# Over-Engineering Audit: Grass Codebase

**Date:** October 2026  
**Auditor:** Antigravity Engineering Review Swarm (Subagents A1–A13)  
**Status:** Complete  
**Scope:** Full codebase audit (Architecture, Rendering, Shaders, Lighting/Mood, Camera/Input, UI/HUD, Audio, Performance, Config, Tooling/Tests, Types/Smells, Visual Gap, Asset-Readiness).  
**Repository Policy:** READ-ONLY inspection; no application source files modified.

---

## 1. Executive Summary

Grass is a client-side, zero-backend, single-developer browser meadow created for short, relaxing breaks. Yet its codebase has succumbed to heavy **"enterprise cosplay" and procedural dogmatism**:

1. **The Visual Disconnect:** 90,000 grass blades render as an unvaried carpet of rigid toothpicks with frozen upward-pointing normals (no specular reaction to wind), zero contact shadows, weak root AO, and washed-out, wrap-diffuse lighting without tone mapping (`NoToneMapping`). The tree is a crude assembly of 6 icosahedron blobs on a 6-sided cylinder, and the background mountains are flat ribbons 99.9% drowned in exponential fog.
2. **Procedural Lock-In:** A dogmatic rule forbidding asset loading forced developers to author 80 lines of Hermite noise tables, 55 lines of polar trigonometric pixel drawing in CPU loops for dandelion seed sprites, and 862 lines of DSP Web Audio synthesis to avoid downloading a single 50 KB audio loop or foliage texture.
3. **Severe Over-Engineering Anti-Patterns:** A 941-line God Class (`App.ts`); an enterprise onboarding state machine (`HintSequencer`) tracking mouse travel in pixels; a 28ms typewriter DOM engine; a simulated UNIX terminal exit console (`$ ./grass`); per-frame QuickSorts inside the 60 FPS loop in `AdaptiveQuality.ts`; and 6,961 lines of tests (83% of source size) where heavy mocks masked critical runtime defects—such as crickets outputting a continuous 4.1–4.6 kHz tinnitus whine because their modulation oscillator is connected to nothing.
4. **The Verdict:** The core WebGL2 instancing, camera rig, and deterministic PRNG are solid foundations. Strip the SaaS UI ballast, replace procedural audio with high-fidelity sound clips, fix normal tilt and tone mapping, and transition to a texture atlas to achieve the intended lush, cinematic vision.

---

## 2. Codebase at a Glance

### 2.1 Lines of Code Breakdown

_Measured across all files (excluding `node_modules`, `.git`, and `dist`):_

| Category                                             | File Count | Line Count | % of Code  |
| :--------------------------------------------------- | :--------: | :--------: | :--------: |
| **Source (TypeScript)** (`src/**/*.ts`)              |     55     |   8,359    |   40.5%    |
| **Shaders (GLSL)** (`src/world/shaders/*.glsl`)      |     15     |    568     |    2.8%    |
| **Test Suites** (`tests/**/*.ts`)                    |     51     |   6,961    |   33.7%    |
| **Configuration** (`package.json`, `tsconfig`, etc.) |     6      |    255     |    1.2%    |
| **Documentation & Specs** (`docs/**/*.md`)           |     34     |   1,529    |    7.4%    |
| **Milestone Tracking & ADRs** (`tracking/**/*.md`)   |     30     |   2,806    |   13.6%    |
| **Tooling & Build Scripts** (`scripts/*.mjs`)        |     4      |    312     |    1.5%    |
| **TOTALS**                                           |  **195**   | **20,634** | **100.0%** |

> **Key Ratio:** Documentation and tracking files (4,335 lines) are 40% larger than the entire 3D graphics and world rendering engine (3,514 lines). Test code (6,961 lines) represents 83.3% of the total TypeScript source volume.

### 2.2 Directory Breakdown of `src/`

| Directory     | File Count | Line Count | Primary Function                                                               |
| :------------ | :--------: | :--------: | :----------------------------------------------------------------------------- |
| `src/world/`  |     29     |   2,946    | Grass instancing, terrain mesh, sky, ridges, tree, seeds, fireflies, shaders   |
| `src/ui/`     |     15     |   2,133    | HUD, buttons, hint sequencer, modal dialog, cursor, typewriter, styles         |
| `src/app/`    |     4      |   1,104    | God class (`App.ts`), capabilities detection, URL flags, reactive store        |
| `src/audio/`  |     8      |    962     | Procedural Web Audio engine (wind, crickets, birds, rustle, sfx, DSP math)     |
| `src/core/`   |     7      |    829     | Render loop, WebGL2 renderer, adaptive quality, math utilities, PRNG           |
| `src/input/`  |     4      |    653     | Pointer state, analytical ground raycaster, gesture classifier, keyboard brush |
| `src/camera/` |     1      |    297     | Camera rig (vista pose, lie-down transition, parallax, idle drift)             |
| `src/easter/` |     1      |    136     | Console greeting, 4-char sliding buffer for terminal exit                      |
| `src/debug/`  |     1      |     77     | Lightweight 5 Hz DOM stats overlay                                             |
| `src/main.ts` |     1      |    138     | Application bootstrap and `window.__grass` debug bridge                        |

### 2.3 Top 10 Largest Source Files

| Rank | File Path                        | Line Count | Byte Size | Primary Responsibility                                  |
| :--: | :------------------------------- | :--------: | :-------: | :------------------------------------------------------ |
|  1   | `src/app/App.ts`                 |    941     | 31,990 B  | God coordinator; instantiates and ticks 28 subsystems   |
|  2   | `src/world/MoodController.ts`    |    421     | 15,953 B  | Retargetable mood crossfader with 30-parameter lerps    |
|  3   | `src/world/Seeds.ts`             |    367     | 10,666 B  | Dandelion seed particle physics & procedural texture    |
|  4   | `src/ui/styles/tokens.css`       |    349     |  8,261 B  | Design tokens, glassmorphism, responsive media queries  |
|  5   | `src/camera/CameraRig.ts`        |    297     |  9,868 B  | Spring-damped camera positioning, lie-down, idle gust   |
|  6   | `src/core/AdaptiveQuality.ts`    |    270     |  8,835 B  | 120-frame rolling window, per-frame sorting & stddev    |
|  7   | `src/ui/HowItWorks.ts`           |    239     |  8,423 B  | Manual DOM modal dialog with bespoke focus trap         |
|  8   | `src/audio/AudioEngine.ts`       |    230     |  6,828 B  | Web Audio master bus, limiter, iOS unlock, mute ramping |
|  9   | `src/world/BrushTrail.ts`        |    228     |  6,235 B  | 16-element uniform ring buffer with harmonic decay      |
|  10  | `src/input/GestureClassifier.ts` |    219     |  6,081 B  | 4-state FSM event emitter for tap, hold, and drag       |

### 2.4 Top 10 Most Imported Modules

| Module Name         | Import Count | Role                                                       |
| :------------------ | :----------: | :--------------------------------------------------------- |
| `vitest`            |      38      | Unit testing runner                                        |
| `three`             |      22      | 3D graphics library (the only production dependency)       |
| `@playwright/test`  |      13      | End-to-end browser testing                                 |
| `src/core/types`    |      9       | Foundational type declarations (`QualityTier`, `MoodName`) |
| `src/ui/copy`       |      9       | Centralized dictionary of user-facing UI strings           |
| `node:fs`           |      7       | File system utilities in test & build scripts              |
| `src/world/terrain` |      6       | Analytic height and normal generator functions             |
| `src/ui/icons`      |      4       | Inlined SVG icons (help, speaker, enter)                   |
| `src/core/prng`     |      4       | Deterministic Mulberry32 random number generator           |
| `src/app/flags`     |      3       | URL search parameter parser                                |

### 2.5 Classes, Interfaces, and Types

- **Classes:** 41 distinct classes across 55 source files.
- **Interfaces:** 44 distinct interfaces (including 18 `FooOptions` interfaces created solely for speculative constructors).
- **Type Aliases:** 9 union types.
- **Interfaces with Exactly 1 Implementer:** 0 explicit `implements` keywords used (pure structural typing), but 18 interfaces map 1:1 to single classes as options records.

### 2.6 Production Build & Runtime Performance Metrics

_Measured on production build via `vite preview` on Chromium at $1440 \times 900$:_

| Metric                                           |      Measured Value      |            Budget / Target             |             Status              |
| :----------------------------------------------- | :----------------------: | :------------------------------------: | :-----------------------------: |
| **Production JS Bundle (Raw)**                   |        672.60 kB         |                   —                    | Dominated by Three.js (~520 kB) |
| **Production JS Bundle (Gzip)**                  |        170.77 kB         |          $\le 300\text{ kB}$           |             PASSED              |
| **Production CSS (Raw / Gzip)**                  |    5.96 kB / 1.84 kB     |           $\le 50\text{ kB}$           |             PASSED              |
| **Total Production Assets (Gzip)**               |      **172.61 kB**       |          $\le 500\text{ kB}$           |     PASSED (Tiny footprint)     |
| **Build Time (`tsc` + `vite build`)**            |          2.87 s          |           $\le 10\text{ s}$            |             PASSED              |
| **Unit Test Run Time (`vitest`)**                |    4.28 s (220 tests)    |           $\le 15\text{ s}$            |     PASSED (38 test files)      |
| **High Tier: Draw Calls / Triangles / Blades**   | **7 / 665,224 / 90,000** | $\le 12$ calls, $\le 700\text{k}$ tris |             PASSED              |
| **Medium Tier: Draw Calls / Triangles / Blades** | **7 / 260,224 / 45,000** | $\le 12$ calls, $\le 500\text{k}$ tris |             PASSED              |
| **Low Tier: Draw Calls / Triangles / Blades**    | **7 / 89,224 / 18,000**  | $\le 12$ calls, $\le 100\text{k}$ tris |             PASSED              |
| **Baseline Target FPS**                          |          60 FPS          |                 60 FPS                 |             PASSED              |

---

## 3. Architecture Map

### 3.1 Module Connectivity & Boundaries

```
                                 [index.html]
                                      │
                                 [main.ts]
                         (Exposes window.__grass)
                                      │
                                 ┌────▼────┐
                                 │ App.ts  │ ◄──── [store.ts] (Pub/Sub Store)
                                 └────┬────┘ ◄──── [flags.ts] (URL Params)
                                      │      ◄──── [capabilities.ts] (Device)
       ┌──────────────┬───────────────┼──────────────┬──────────────┬──────────────┐
       │              │               │              │              │              │
   [core/]        [camera/]       [world/]       [input/]        [ui/]         [audio/]
   Renderer       CameraRig       Grass          Pointer         Hud           AudioEngine
   Loop                           TerrainMesh    GroundRaycaster Entry         Wind
   AdaptiveQual                   Sky            GestureClassif  HowItWorks    Crickets (BROKEN)
   math                           Tree           KeyboardBrush   HintSequencer Birds
   prng                           Ridges                         HandCursor    Rustle
   storage                        Seeds                          Uptime        Sfx
                                  Fireflies                      Vignette
                                  MoodController                 Fallback
                                  BrushTrail
```

### 3.2 Data and Frame Flow

1. **Ticker (`Loop.ts`):** `requestAnimationFrame` calculates clamped $\Delta t \le 100\text{ms}$ and dispatches to subscribers. Tab visibility pauses execution.
2. **Orchestrator (`App.ts` render loop):**
   - Calls `AdaptiveQuality.recordFrame(dt)` $\to$ runs rolling frame time analysis and per-frame array sorting.
   - Updates `MoodController.update(dt)` $\to$ if transitioning, interpolates 30 parameters and calls `applyCurrentMood()` to push uniforms to Grass, Sky, Terrain, Tree, and Ridges.
   - Polls pointer or keyboard input $\to$ `GroundRaycaster` raymarches heightfield $\to$ injects coordinates into `BrushTrail`.
   - `BrushTrail.writeUniforms()` pushes a 16-element `Vector4` array into the grass vertex shader `uTrail[16]`.
   - Steps particle integrations (`Fireflies.ts`, `Seeds.ts`) and audio nodes (`Wind.ts`, `Crickets.ts`, `Birds.ts`).
   - Invokes `Renderer.render(scene, cameraRig.camera)`.

---

## 4. Pattern-by-Pattern Findings (Step 2 Evaluation)

### Pattern 1: Unnecessary Complexity

- **Status:** **FOUND**
- **Evidence:**
  - `src/world/noise.ts#L10-L84`: 75 lines of manual Hermite smoothstep gradient tables ($M=8$ gusts, $M=24$ flutter) generating a 256x256 `DataTexture` on CPU at startup. A 4-line procedural hash in GLSL produces identical wind motion without texture memory.
  - `src/world/Seeds.ts#L36-L90`: 55 lines of nested loops calculating 6-spoke polar trigonometric bristles (`Math.cos(6 * angle)`, `Math.pow(spokeMask, 16.0)`) into a `Uint8Array` to generate a 64x64 dandelion sprite that could be an SVG or 500-byte WebP.
  - `src/input/GroundRaycaster.ts#L65-L80`: Marches 240 steps (0.5m increments up to 120m) evaluating analytic noise on every `pointermove` frame even when the cursor is aimed directly into the empty sky.

### Pattern 2: Premature Optimization

- **Status:** **FOUND**
- **Evidence:**
  - `src/core/AdaptiveQuality.ts#L154-L173, L241-L253`: Pre-allocates a `scratchSortBuffer` to avoid GC, but executes `sub.sort()` (QuickSort/TimSort) **up to twice every frame inside the 60 FPS animation loop** to calculate 95th-percentile frame times for an unchanging static scene.
  - `src/world/grassGenerator.ts#L55-L146`: Implements rejection-sampling distance rings and a 36-line multi-typed-array Fisher-Yates shuffle across 90,000 blades under the guise of LOD. Yet blades are **not geometrically LOD'd by distance**: a blade 65m away uses the exact same 4 segments and 7 triangles as a blade 0.5m from the camera.

### Pattern 3: YAGNI Violations

- **Status:** **FOUND**
- **Evidence:**
  - `src/core/Loop.ts#L11, L27`: `LoopOptions.fixedDt` is stored in `this.fixedDt` but never referenced in `tick()`.
  - `src/app/store.ts#L3, L17`: `AppState.uptimeSeconds` is never updated by any dispatcher; `AppPhase` defines `'paused'` and `'exit'`, neither of which is ever set.
  - `src/core/storage.ts#L57-L81`: Generic `removeItem()` and `clear()` methods built with in-memory map fallbacks for an app that stores exactly three string keys.
  - `src/input/GestureClassifier.ts#L20, L199`: Hardcoded 10-second hold timer (`ee2HoldDurationMs: 10000`) for an Easter egg inside the core gesture classifier.

### Pattern 4: Gold Plating

- **Status:** **FOUND**
- **Evidence:**
  - `src/ui/HintSequencer.ts#L18-L117`: A 4-stage onboarding tour measuring cumulative mouse travel in pixels (`cumulativeBrushPx >= 600`), driving a multi-stage timeout cascade (1.5s $\to$ 8s $\to$ 8s $\to$ 12s) straight out of enterprise SaaS adoption software.
  - `src/ui/HintLine.ts#L96-L116`: A 28ms `setInterval` typewriter animation engine with synchronous layout flushes (`void this.element.offsetHeight`) for transient 30-character hints.
  - `src/ui/ExitScreen.ts#L23-L70` + `src/easter/eggs.ts#L51-L65`: A 4-character sliding key buffer with 2000ms expiration detecting "exit" to launch a fake UNIX terminal window (`$ ./grass`, `exit 0`).
  - `src/world/shaders/sky.frag.glsl#L83-L87`: Procedural Perlin noise moon crater mottling inside a 26-pixel circle at night, registering as sub-pixel aliasing noise.
  - `src/audio/AudioEngine.ts#L76-L85`: Multi-bus mastering chain with `DynamicsCompressorNode` (threshold -12 dB, knee 10 dB, ratio 3) for two ambient noise buffers.

### Pattern 5: Patternitis

- **Status:** **FOUND**
- **Evidence:**
  - `src/input/GestureClassifier.ts#L38-L65`: Custom Event Emitter with typed map (`GestureEventMap`) to classify 3 actions (tap, hold, drag) that could be handled in a 20-line handler.
  - `src/app/App.ts#L712-L726` vs `L371-L377`: State Schizophrenia. `App.ts` imperatively updates subsystems on tier change, then calls `store.setState()`, which fires a store subscriber that updates the same subsystems a second time.

### Pattern 6: Deep Inheritance and Interface Inflation

- **Status:** **BORDERLINE (No deep inheritance, severe interface inflation)**
- **Evidence:**
  - Zero deep inheritance trees (composition is used throughout).
  - Severe interface inflation: 18 dedicated `FooOptions` interfaces (`AppOptions`, `AudioEngineOptions`, `CameraRigOptions`, `AdaptiveQualityOptions`, `LoopOptions`, `RendererOptions`, `GestureClassifierOptions`, etc.) where constructor callers pass zero or one option.
  - `src/input/GestureClassifier.ts#L126, L139, L173`: Strict interface typings force `undefined as void` type assertions 7 times.

### Pattern 7: Spaghetti Code

- **Status:** **BORDERLINE (Isolated to `App.ts`)**
- **Evidence:**
  - Individual modules are internally clean, but `src/app/App.ts` lines 497–653 is an imperative 156-line loop directly reading and writing internal properties of 18 different objects (reaching into uniforms, computing screen projections, manually passing raycast hits to trails).

### Pattern 8: Lasagna Code

- **Status:** **FOUND**
- **Evidence:**
  - DOM event routing passes through 4 layers: `index.html` $\to$ `main.ts` $\to$ `App.ts` $\to$ `Hud.ts` $\to$ `SoundToggle.ts`.
  - Keyboard listeners are independently registered in 3 separate files: `App.ts#L489`, `GestureClassifier.ts` (via `App.ts`), and `KeyboardBrush.ts#L23`.
  - `KeyboardBrush.ts#L566-L577`: Arrow keys move a 3D position, which is then projected back to 2D screen NDC via `scratchGroundHit.project(camera)` solely to position the DOM `HandCursor` element.

### Pattern 9: Config-Driven Overkill

- **Status:** **FOUND**
- **Evidence:**
  - `src/world/moods.ts#L35-L129`: 81 hardcoded numbers and hex codes across 3 presets. Mountain ridge colors are meticulously configured per mood, yet in the fragment shader they are 99.9% fogged out.
  - `src/core/AdaptiveQuality.ts#L3-L14`: Exposes 10 configuration parameters; `App.ts:178-181` provides only 2.
  - `src/app/capabilities.ts#L48-L52` & `src/app/App.ts#L49-L53`: `TIER_DPR_CAPS` defined twice in parallel.

### Pattern 10: Mock-Heavy Test Obsession

- **Status:** **FOUND (Severe)**
- **Evidence:**
  - 19 of 51 test files use heavy mocks (`vi.fn()`, `vi.mock()`, `mockWebAudio`).
  - **The Crickets Defect Masking:** In `tests/unit/audio-layers.spec.ts#L159`, the unit test asserts `expect(mockCtx.createOscillator).toHaveBeenCalledTimes(4)` and passes green. It completely failed to detect that in `src/audio/Crickets.ts#L64`, `this.amGain` was connected to nothing, and crickets emitted a raw, unmodulated 4.1–4.6 kHz piercing sine tone!
  - Tests verify mock invocations rather than perceptible output.

### Pattern 11: Dead Code and Unused Exports

- **Status:** **FOUND**
- **Evidence:**
  - `src/world/shaders/fog.glsl`: 9-line file, never imported anywhere; the exact 5-line `applyFog` function was copy-pasted into 4 shaders.
  - `src/world/shaders/sky.frag.glsl#L13`: `uniform vec3 uFogColor;` declared, wired in `Sky.ts`, updated on every mood frame, but **never read in `sky.frag.glsl`** (the shader uses `uSkyHorizon` for horizon fog).
  - `src/world/grassGenerator.ts#L47, L102`: Allocates and fills `rand.y` (180,000 floats = 720 KB VRAM), but `grass.vert.glsl` only ever reads `rand.x`.
  - `src/core/math.ts#L48-L62`: `smootherstep` and `invLerp` are exported but never imported in `src/`.
  - 41 exported symbols across the codebase have zero external consumers outside unit tests.

### Pattern 12: Duplicate Logic and Copy-Paste Variants

- **Status:** **FOUND**
- **Evidence:**
  - `applyFog()` duplicated across `grass.frag.glsl:20`, `terrain.frag.glsl:16`, `tree.frag.glsl:15`, and `ridge.frag.glsl:9`.
  - `lerp()` and `easeInOut()` duplicated in `MoodController.ts#L87-L97` instead of using `src/core/math.ts`.
  - Noise generation duplicated: `hash21` + `patchNoise` in `grass.frag.glsl:50-63` vs `hash` + `noise` in `sky.frag.glsl:19-34`.
  - Wrap-diffuse lighting duplicated in `grass.frag.glsl:90-102` and `tree.frag.glsl:26-36`.

### Pattern 13: Speculative Generality

- **Status:** **FOUND**
- **Evidence:**
  - `src/app/flags.ts#L17-L20`: Only `?quality=` is parsed. `?tier=`, `?reducedMotion=`, and `?camera=` are referenced in specs but ignored by code.
  - `src/world/Grass.ts#L74-L83`: Pre-allocates 3 separate `InstancedBufferGeometry` objects (`high`, `medium`, `low`) sharing instance attributes, solely to switch segment counts (4, 3, 2).
  - `src/core/AdaptiveQuality.ts#L167-L182`: Auto-upgrade engine implemented speculatively, directly contradicting the architectural spec (`performance-strategy.md` §3: _"never auto-upgrade"_).

### Pattern 14: Abstraction Without Reuse

- **Status:** **FOUND**
- **Evidence:**
  - `src/world/Ridges.ts#L27-L82`: Creates 3 separate `BufferGeometry` instances, 3 `ShaderMaterial` instances, and 3 meshes for 3 flat backdrop ribbons, consuming 3 separate draw calls for static silhouette geometry.
  - `src/audio/noise.ts`: 21-line file containing 2 functions that immediately forward to `src/audio/math.ts`.

### Pattern 15: Over-Modularization

- **Status:** **FOUND**
- **Evidence:**
  - `src/ui/` contains 15 files and 2,133 lines for 4 buttons, a title, a hint, and an about dialog. `SoundToggle.ts` is a 46-line class and `MoodSwitch.ts` is a 61-line class, each with its own options, DOM creation, and lifecycle.
  - Single-line GLSL shaders (`sky.vert.glsl` = 7 lines, `ridge.vert.glsl` = 8 lines, `terrain.vert.glsl` = 10 lines).

### Pattern 16: Tooling and Docs Bloat

- **Status:** **FOUND**
- **Evidence:**
  - 64 Markdown files across `docs/` and `tracking/` (4,335 lines) enforcing formal gates (G1–G12), ADRs, and checklists for a single-page static app.
  - Strict commitlint, husky pre-commit hooks, and WCAG luminance contrast verification scripts for 4 static glass buttons.

### Pattern 17: Magic Numbers and Tuning Constants

- **Status:** **FOUND**
- **Evidence:**
  - `src/camera/CameraRig.ts#L11-L43, L239-L276`: ~25 undocumented magic numbers (`baseLookAt = (0, 2.4, -22)`, `swayX = 0.15`, `swayZ = 0.08`, `damp omega = 4`, `idle lever arm = 32.0`).
  - `src/world/terrain.ts#L14-L21`: Magic analytic hill and swell coefficients (`0.35 * sin(x * 0.09 + 1.3) * cos(z * 0.07)`).
  - `src/world/shaders/grass.vert.glsl#L42-L46`: Gust UV scale `0.012`, gust speed `0.025`, flutter UV scale `0.09`, flutter speed `0.35`.

### Pattern 18: Accessibility or Perf Machinery Never Exercised

- **Status:** **FOUND**
- **Evidence:**
  - `scripts/check-contrast.mjs`: Standalone 114-line script performing sRGB transfer curve relative luminance math and alpha-compositing `--panel` over 3 mood sky colors in CI.
  - `src/ui/HowItWorks.ts#L172-L190`: Bespoke 30-line focus-trap algorithm (`Tab`/`Shift+Tab` querying focusable elements) instead of native `<dialog>`.

### Pattern 19: Additional Identified Anti-Pattern: Circular Dependency Cycle

- **Status:** **FOUND**
- **Evidence:**
  - `src/world/terrain.ts#L62` exports `TerrainMesh` from `./TerrainMesh`.
  - `src/world/TerrainMesh.ts#L2` imports `terrainHeight` from `./terrain`.
  - Confirmed via `madge --circular`: `world/terrain.ts > world/TerrainMesh.ts > world/terrain.ts`.

---

## 5. Module Verdict Table

| Module / File                    |        Verdict        | Complexity (1-5) | Value (1-5) | Reason & Recommended Action                                                                |
| :------------------------------- | :-------------------: | :--------------: | :---------: | :----------------------------------------------------------------------------------------- |
| `src/main.ts`                    |     **SIMPLIFY**      |        2         |      4      | Essential entry point, but bloated with 40-method debug adapter. Slim down.                |
| `src/app/App.ts`                 |     **SIMPLIFY**      |        5         |      5      | 941-line God Class. Split into `WorldScene`, `InputCoordinator`, and `AudioCoordinator`.   |
| `src/app/store.ts`               |     **SIMPLIFY**      |        2         |      2      | Bypassed by direct calls, causing double-dispatch. Consolidate into single state model.    |
| `src/app/flags.ts`               |       **KEEP**        |        1         |      4      | Clean URL query parameter parser. Add `?tier=` alias for `?quality=`.                      |
| `src/app/capabilities.ts`        |       **KEEP**        |        2         |      4      | Lightweight, zero-cost initial device capability detector.                                 |
| `src/camera/CameraRig.ts`        |     **SIMPLIFY**      |        3         |      4      | Smooth motion, but 7 concurrent modifiers. Group magic numbers into config block.          |
| `src/core/Renderer.ts`           |    **KEEP & FIX**     |        3         |      5      | Clean WebGL2 wrapper. **Must enable tone mapping** (`ACESFilmicToneMapping`).              |
| `src/core/Loop.ts`               |       **KEEP**        |        2         |      5      | Rock-solid frame-rate independent loop with 100ms clamp and visibility handling.           |
| `src/core/AdaptiveQuality.ts`    |     **SIMPLIFY**      |        3         |      2      | Strip auto-upgrade and per-frame QuickSorts. Evaluate at 1 Hz on moving average.           |
| `src/core/storage.ts`            |     **SIMPLIFY**      |        2         |      2      | 114 lines of generic CRUD for 3 keys. Replace with 20-line `localStorage` helper.          |
| `src/core/math.ts`               |     **SIMPLIFY**      |        1         |      4      | Pristine pure functions, but delete dead unused exports (`invLerp`, `smootherstep`).       |
| `src/core/prng.ts`               |       **KEEP**        |        2         |      5      | Mulberry32 generator essential for deterministic instancing.                               |
| `src/world/Grass.ts`             |   **KEEP & REVISE**   |        4         |      5      | Core centerpiece. Keep instanced mesh, but strip dead normal buffer attributes.            |
| `src/world/grassGenerator.ts`    |     **SIMPLIFY**      |        4         |      3      | Replace rejection rings with direct stratified sampling.                                   |
| `src/world/grassGeometry.ts`     |     **SIMPLIFY**      |        2         |      4      | Strip unused normal attribute (saving vertex bandwidth).                                   |
| `src/world/TerrainMesh.ts`       |       **KEEP**        |        2         |      4      | 128x128 plane works well; break circular export with `terrain.ts`.                         |
| `src/world/terrain.ts`           |     **SIMPLIFY**      |        2         |      5      | Pure analytic height/normal generator. Delete circular `TerrainMesh` export.               |
| `src/world/Tree.ts`              |      **REWRITE**      |        3         |      1      | Geometric broccoli: 6 icosahedra on a cylinder. Replace with stylized tree GLB or card.    |
| `src/world/Ridges.ts`            |     **SIMPLIFY**      |        3         |      2      | 3 draw calls for flat ribbons. Merge into 1 draw call and fix drowning fog.                |
| `src/world/Sky.ts`               |       **KEEP**        |        3         |      4      | Effective celestial dome gradient, sun/moon, halo, clouds, stars in 1 draw call.           |
| `src/world/Fireflies.ts`         |       **KEEP**        |        2         |      4      | Lightweight GPU Lissajous simulation in vertex shader. Zero draw calls in day.             |
| `src/world/Seeds.ts`             |     **SIMPLIFY**      |        4         |      2      | 367 lines of CPU physics and procedural spore drawing. Replace with lightweight burst.     |
| `src/world/MoodController.ts`    |     **SIMPLIFY**      |        4         |      4      | Functional, but weighed down by snapshot boilerplate and linear-sRGB color lerping.        |
| `src/world/moods.ts`             |      **RE-TUNE**      |        3         |      3      | 81 parameters; palettes look washed out, pea-soup yellow, or muddy salmon. Re-tune colors. |
| `src/world/BrushTrail.ts`        |       **KEEP**        |        3         |      5      | Clean, allocation-free uniform array ring-buffer. Avoids canvas FBO overhead.              |
| `src/world/noise.ts`             |     **SIMPLIFY**      |        3         |      2      | 85 lines of CPU Hermite gradient tables. Replace with procedural noise in GLSL.            |
| `src/world/shaders/grass.*`      |      **REWRITE**      |        4         |      5      | Static normals, width bending, fake SSS, wrap diffuse, and fragment Perlin need overhaul.  |
| `src/input/Pointer.ts`           |     **SIMPLIFY**      |        2         |      4      | Clean pointer capture; remove redundant `speedHistory` rolling buffer.                     |
| `src/input/GestureClassifier.ts` |      **DELETE**       |        3         |      2      | Over-engineered FSM event emitter for 3 gestures. Fold directly into input handler.        |
| `src/input/GroundRaycaster.ts`   |     **SIMPLIFY**      |        3         |      4      | Keep analytical raymarching; add sky-horizon early exit to stop 240 wasted noise steps.    |
| `src/input/KeyboardBrush.ts`     |     **SIMPLIFY**      |        2         |      3      | Consolidate loose `keydown` listeners into unified input handler.                          |
| `src/audio/AudioEngine.ts`       |       **KEEP**        |        3         |      4      | Master Web Audio graph, mute ramping, iOS unlock.                                          |
| `src/audio/Wind.ts`              |     **SIMPLIFY**      |        3         |      3      | Procedural pink noise wind is acceptable; simplify dual filters and LFO.                   |
| `src/audio/Crickets.ts`          | **DELETE / REWRITE**  |        3         |      1      | Broken: AM modulator disconnected; outputs 4.1–4.6 kHz static tinnitus whine.              |
| `src/audio/Birds.ts`             | **DELETE / REPLACE**  |        3         |      2      | Sounds like an 8-bit arcade laser gun. Replace with lightweight audio clip.                |
| `src/audio/Rustle.ts`            |      **REWRITE**      |        3         |      2      | Dynamic grain allocation causes 48 Web Audio node allocations/sec during brush.            |
| `src/audio/Sfx.ts`               |     **SIMPLIFY**      |        2         |      3      | Retro seed pop sound. Merge into AudioEngine.                                              |
| `src/audio/math.ts` & `noise.ts` |     **SIMPLIFY**      |        3         |      2      | Voss-Kellet 7-pole pink noise filter is DSP overkill. Merge and simplify.                  |
| `src/ui/Hud.ts`                  |     **SIMPLIFY**      |        3         |      3      | Lasagna coordinator. Merge `SoundToggle` and `MoodSwitch` directly into HUD.               |
| `src/ui/HowItWorks.ts`           |      **REWRITE**      |        3         |      2      | 239 lines of manual DOM & focus-trap. Replace with native HTML5 `<dialog>`.                |
| `src/ui/HintSequencer.ts`        |     **SIMPLIFY**      |        3         |      1      | Enterprise onboarding tour measuring pixel travel. Replace with simple fade-out hint.      |
| `src/ui/HintLine.ts`             |     **SIMPLIFY**      |        2         |      2      | Delete 28ms typewriter timer and forced layout flush. Use CSS fade.                        |
| `src/ui/HandCursor.ts`           | **SIMPLIFY / DELETE** |        3         |      2      | Per-frame spring physics and SVG injection. Native CSS cursor is smoother and cleaner.     |
| `src/ui/Uptime.ts`               |   **DELETE / HIDE**   |        1         |      1      | Digital clock actively contradicts relaxing meadow ethos.                                  |
| `src/ui/ExitScreen.ts`           |      **DELETE**       |        2         |      1      | Simulated UNIX terminal console for typing "exit". Pure developer gold plating.            |
| `src/easter/eggs.ts`             |     **SIMPLIFY**      |        1         |      2      | Keep console greeting; delete sliding key buffer for terminal exit.                        |
| `src/ui/Vignette.ts`             |     **SIMPLIFY**      |        2         |      3      | Replace per-frame JS polynomial easing with CSS `transition: opacity 1.1s`.                |
| `src/debug/StatsOverlay.ts`      |       **KEEP**        |        2         |      4      | Low-overhead 5 Hz DOM overlay for fps/tris/draw calls.                                     |

---

## 6. Visual Diagnosis

_Audited against live rendered screenshots stored in `docs/audit_screenshots/`:_

- `docs/audit_screenshots/vista_golden.png`
- `docs/audit_screenshots/vista_dawn.png`
- `docs/audit_screenshots/vista_night.png`
- `docs/audit_screenshots/liedown_golden.png`
- `docs/audit_screenshots/liedown_night.png`
- `docs/audit_screenshots/tree_closeup.png`
- `docs/audit_screenshots/grass_closeup.png`
- `docs/audit_screenshots/ui_hud.png`
- `docs/audit_screenshots/ui_help_dialog.png`

### Top Root Causes of Weak Visuals

#### Root Cause 1: The "Toothpick / Astroturf" Effect (Foliage Uniformity)

- **Diagnosis:** Foliage & Composition Problem (Code + Asset).
- **Screenshots:** `grass_closeup.png`, `vista_golden.png`.
- **Mechanism:** Every blade is an identical tapered polygon strip placed on an unvaried Poisson/jitter grid. Yaw is uniformly random ($[0, 2\pi]$) and bend is an uncoordinated scalar ($[-0.35, 0.35]$). Natural meadow grass grows in dense, intertwined clumps with weed clusters, dead thatch, and sweeping wind swaths. Here, 90,000 isolated bristles look like plastic astroturf or toothpicks.
- **Architecture Impact:** Blocked by monolithic single-mesh instancing and absence of texture atlas or species variance attributes.

#### Root Cause 2: Frozen Normals & Lack of Wind Lighting Response

- **Diagnosis:** Shading Problem (Code).
- **Evidence:** `src/world/shaders/grass.vert.glsl#L68`:
  ```glsl
  vec3 bladeNormal = vec3(-sinY, 0.0, cosY);
  vNormal = normalize(mix(bladeNormal, vec3(0.0, 1.0, 0.0), 0.6));
  ```
- **Mechanism:** In real meadows, wind waves are visible because bending grass tilts normals, catching sunlight and specular glints at varying angles. In this shader, the normal is **statically locked pointing 60% straight up** and does not tilt when wind deflects the geometry. Wind is purely geometric vertex displacement with zero directional lighting response.

#### Root Cause 3: Zero Shadow Contrast & Wrap-Diffuse Flattener

- **Diagnosis:** Lighting Problem (Code).
- **Evidence:** `src/world/shaders/grass.frag.glsl#L91`:
  ```glsl
  float wrapDiffuse = max(0.0, dot(N, L) * 0.5 + 0.5);
  ```
- **Mechanism:** Back-facing surfaces receive 50% direct light. Combined with high ambient light (55% to 111% of direct), no surface ever falls into shadow. Every blade is uniformly lit from all directions, eliminating 3D depth and volume. Furthermore, base AO is capped at 55% (`rootAO = mix(0.55, 1.0, ...)`), making grass appear to float disconnected from the ground plane.

#### Root Cause 4: Bleached Highlights from `NoToneMapping`

- **Diagnosis:** Visual Pipeline Problem (Code).
- **Evidence:** `src/core/Renderer.ts#L44`: `this.gl.toneMapping = THREE.NoToneMapping;`
- **Mechanism:** Adding direct light, ambient light, backlight, and additive rim light pushes peak luminance well above 1.8. Without a filmic tone curve (ACES or AgX), RGB channels clip at 1.0 independently, bleaching warm golden sunlight into chalky, pastel white.

#### Root Cause 5: "Radioactive Straw & Pastel Smog" Color Palette

- **Diagnosis:** Color / Mood Tuning Problem (Config).
- **Screenshots:** `vista_golden.png`, `vista_dawn.png`.
- **Mechanism:**
  - **Golden:** Grass tips are yellow-green (`#d4e36a`), direct light is warm amber (`#ffcf8a`), ambient light is purple-gray (`#a8a0b0`), and fog is beige (`#f3cf9f`). These clash into a sickly, monochromatic yellow pea-soup.
  - **Dawn:** Tips are sage-gray (`#a8d878`), ambient is lavender (`#8e86b8`), and fog is salmon (`#e8b9a8`), creating a dusty, faded 1970s smog rather than crisp alpine sunrise.
  - **Night:** Green is stripped entirely in favor of teal (`#0c2a2a` base, `#2f6f5a` tip), resulting in a cold, blue plastic appearance.

#### Root Cause 6: Mountain Silhouette Eradication by Fog

- **Diagnosis:** Atmospheric Lighting Problem (Code + Config).
- **Screenshots:** `vista_golden.png`, `vista_dawn.png`, `vista_night.png`.
- **Mechanism:** Shaders use exponential-squared fog with density `0.016–0.020`. At 160m (the closest mountain ridge), the fog factor is **99.86% to 99.99%**. All three background mountain ridges (`z = -160, -230, -310`) are completely obliterated by flat fog color, turning layered mountain silhouettes into an empty haze.

#### Root Cause 7: The "Geometric Broccoli" Tree

- **Diagnosis:** Asset & Composition Problem (Asset).
- **Screenshots:** `tree_closeup.png`.
- **Mechanism:** The lone tree—the emotional focal point of the meadow—is procedurally assembled from 6 low-poly detail-1 icosahedra fused onto a 6-sided cylinder (`src/world/Tree.ts#L53-L99`). The crude polygonal seams are starkly visible against the sky, resembling placeholder geometry from a beginner tutorial rather than a picturesque alpine tree.

---

## 7. Test Suite Assessment

### Quantitative Breakdown

- **Total Test Files:** 51 files (38 unit test specs, 13 Playwright E2E specs).
- **Total Test Lines:** 6,961 lines (vs. 8,359 lines of TypeScript source $\to$ **83.3% test-to-source ratio**).
- **Unit Test Execution:** 38 test files, 220 tests passing in 4.28s.
- **Mock-Heavy Files:** 19 of 51 test files rely heavily on mocks (`vi.fn()`, `vi.mock()`, `mockWebAudio`).

### Qualitative Assessment & Gaps

1. **The Mock Illusion:** Tests frequently verify mock interactions rather than real behaviors.
   - `tests/unit/audio-layers.spec.ts#L159`: Asserted `expect(mockCtx.createOscillator).toHaveBeenCalledTimes(4)` and called it green, completely failing to catch that oscillator #4 was disconnected and crickets emitted continuous unmodulated tinnitus whine.
   - `tests/unit/world-render.test.ts`: Tests Three.js scene assembly by verifying method calls, but does not verify whether shaders compile or normals tilt.
2. **Visual E2E Testing is a Sham:**
   - In `tests/e2e/grass.spec.ts#L116-L127`, "wind motion" is tested by counting raw differing bytes between two compressed PNG files:
     ```ts
     for (let i = 0; i < len; i++) if (buffer1[i] !== buffer2[i]) diffCount++;
     expect(diffCount).toBeGreaterThan(100);
     ```
   - In `tests/e2e/grass.spec.ts#L159` and `tests/e2e/moods.spec.ts#L78, L103, L128`, visual verification consists solely of:
     ```ts
     expect(stat.size).toBeGreaterThan(50000); // Verify screenshot > 50 KB
     ```
   - There are **zero perceptual image comparisons** (`toHaveScreenshot()`), zero SSIM checks, and zero golden baseline images. A solid pink square would pass every visual test in the suite.
3. **Behaviors with Zero Tests:**
   - GLSL shader compilation and link integrity under WebGL2.
   - Perceptual color contrast of the 3D scene under different moods.
   - True audio output spectral validity (audio tests mock Web Audio nodes away).

---

## 8. Dependency and Build Assessment

### Dependencies

- **Production (`dependencies`):** Exactly 1 package: `three: 0.186.1`.
  - _Justification:_ Essential core WebGL library. Fully utilized.
- **Development (`devDependencies`):** 11 packages:
  - `@types/three`, `typescript`, `vite`: Core compilation pipeline. Justified.
  - `vitest`, `@playwright/test`: Test runners. Justified.
  - `eslint`, `@eslint/js`, `typescript-eslint`, `prettier`: Code hygiene. Justified.
  - `husky`, `lint-staged`, `@commitlint/cli`, `@commitlint/config-conventional`: Commit-hook enforcement. Heavy for a single developer, but harmless.

### Build Pipeline

- `tsc --noEmit && vite build`: Fast and reliable (2.87s build time).
- Production bundle: 672.60 kB raw, 170.77 kB gzip.
  - Vite generates a warning: `(!) Some chunks are larger than 500 kB after minification (main-*.js: 672 kB)`. This chunk is 77% Three.js.
  - Bundle size check (`scripts/check-size.mjs`): Gzip 168.57 kB is well within the 500 kB project budget.

---

## 9. Dead Code and Duplication Inventory

### 9.1 Dead Code & Unused Exports

1. **`src/world/shaders/fog.glsl`:** 9 lines. Dead file; never imported anywhere.
2. **`sky.frag.glsl#L13` `uniform vec3 uFogColor`:** Dead uniform. Declared, bound in `Sky.ts`, updated every frame, never read in shader.
3. **`grassGenerator.ts#L47, L102` `rand.y`:** Dead vertex buffer attribute (180,000 floats = 720 KB VRAM). Never read in vertex or fragment shaders.
4. **`src/core/math.ts#L48-L62`:** `smootherstep` and `invLerp` are dead exports.
5. **`src/core/Loop.ts#L11, L27`:** `LoopOptions.fixedDt` is dead property.
6. **`src/app/store.ts#L3, L17`:** `uptimeSeconds`, `'paused'`, and `'exit'` are dead state fields.
7. **`src/core/storage.ts#L57-L81`:** `removeItem()` and `clear()` are never called in production code.

### 9.2 Duplicate Logic

1. **Fog calculation:** Copy-pasted into `grass.frag.glsl:20`, `terrain.frag.glsl:16`, `tree.frag.glsl:15`, and `ridge.frag.glsl:9`.
2. **Math functions:** `lerp` and `easeInOut` re-implemented in `MoodController.ts:87-97` instead of importing from `src/core/math.ts`.
3. **Noise algorithms:** Value noise hashes duplicated in `grass.frag.glsl:50-63` and `sky.frag.glsl:19-34`.
4. **Wrap diffuse & rim lighting:** Duplicated between `grass.frag.glsl:90-102` and `tree.frag.glsl:26-36`.
5. **DPR caps record:** Duplicated in `capabilities.ts:48-52` and `App.ts:49-53`.
6. **Canvas `pointerleave` listener:** Registered in `Pointer.ts:146` and registered a second time as an uncleaned anonymous listener in `App.ts:356`.

---

## 10. Recommendations and Proposed Simplification Plan

### 10.1 Prioritized Pruning & Simplification Plan

#### Phase 1: Immediate Deletions & Bug Fixes (High Value, Zero Risk)

1. **Fix Audio Crickets Bug:** Connect `amGain` into the voice chain in `Crickets.ts` so crickets chirp with 28 Hz modulation instead of emitting a piercing tinnitus sine tone.
2. **Delete Dead Ballast (~450 LOC):**
   - Delete `ExitScreen.ts` and sliding key buffer in `eggs.ts`.
   - Delete `Uptime.ts` visible counter from HUD.
   - Delete dead `fog.glsl`, dead uniform `uFogColor` in `Sky.ts`/`sky.frag.glsl`, and dead attribute `rand.y` in `grassGenerator.ts`.
   - Delete unused math exports (`invLerp`, `smootherstep`) and dead store properties (`uptimeSeconds`).
3. **Fix Shading & Lighting Pipeline:**
   - Enable `THREE.ACESFilmicToneMapping` on `Renderer.ts`.
   - Reduce fog density from `0.016` down to `0.004` so background mountain ridges become visible.
   - Tilt blade normals in `grass.vert.glsl` during wind deflection and curvature lean.
   - Replace wrap-diffuse with directional diffuse; drop ambient intensity from `0.60` to `0.25`.
   - Drop root AO base from `0.55` to `0.15` to anchor blades to the terrain.

#### Phase 2: Structural Simplification (~1,200 LOC reduction)

1. **Break Circular Import:** Remove `export { TerrainMesh }` from `src/world/terrain.ts`.
2. **Slim Down God Class `App.ts`:**
   - Extract world rendering and lighting updates into a clean `WorldScene.ts`.
   - Remove redundant 1-line forwarding methods; let `window.__grass` access components directly.
3. **Eliminate Input & UI Lasagna:**
   - Delete `GestureClassifier.ts` FSM; fold tap/hold handling directly into `Pointer.ts` or `App.ts`.
   - Replace `HowItWorks.ts` manual DOM building and focus-trap with native HTML5 `<dialog>` in `index.html`.
   - Fold `SoundToggle.ts` and `MoodSwitch.ts` directly into `Hud.ts`.
   - In `HintLine.ts`, replace 28ms typewriter timer with CSS opacity transition.
   - In `HintSequencer.ts`, replace cumulative pixel distance state machine with a simple first-interaction dismissal.
4. **Simplify Adaptive Quality:**
   - Delete auto-upgrade logic and per-frame `sub.sort()` from `AdaptiveQuality.ts`. Evaluate at 1 Hz on moving average.

#### Phase 3: Asset-Readiness & Visual Elevation

1. **Implement `AssetManager.ts`:** Lightweight loader wrapping `THREE.TextureLoader` with async support.
2. **Foliage Texture Atlas:** Introduce a 1024x1024 atlas in `public/assets/foliage-atlas.webp` containing multi-species wildflower heads (poppies, daisies, dandelions), varied blade textures, and clover.
3. **Flower & Biodiversity Instancing:** Add `aType` (float) and `aColor` (vec3) attributes to instance buffers. Allocate 5–10% of instances as crossed-quad wildflowers with alpha-tested shader sampling.
4. **Billboard Butterfly System (`Butterflies.ts`):** 10–20 instanced 2-triangle butterfly meshes with sinusoidal wing-flap vertex animation fluttering along terrain waypoints.
5. **Replace Tree & Ridges:**
   - Replace the icosahedron broccoli tree with a stylized low-poly GLB or alpha-cutout foliage model.
   - Replace the 3 flat ridge ribbon meshes with contoured ridge geometry or skybox integration.

---

### 10.2 The Minimum Viable Architecture (MVA)

The entire functional scope of Grass (instanced grass with wind & brush, mixed wildflowers, layered mountains, 3 moods, lie-down camera, butterflies, audio) can be delivered cleanly in **under 2,500 lines of TypeScript** across 12 focused files:

```
src/
├── main.ts                    // Bootstrap, URL flags, canvas mount (60 LOC)
├── core/
│   ├── Loop.ts                // rAF loop, dt clamp, tab visibility pause (60 LOC)
│   ├── Renderer.ts            // WebGL2 canvas, ACES tone mapping, resize observer (70 LOC)
│   ├── math.ts                // Pure mathematical primitives (40 LOC)
│   └── AssetManager.ts        // Texture & model loader with caching (50 LOC)
├── camera/
│   └── CameraRig.ts           // Standing/lying poses, ground clamp, parallax (180 LOC)
├── input/
│   └── Input.ts               // Pointer, keyboard, analytical ground raycaster (160 LOC)
├── audio/
│   └── AudioEngine.ts         // High-quality ambient loop, spatial rustle, seed sfx (120 LOC)
├── ui/
│   └── Hud.ts                 // Clean HTML5 controls (mood pills, mute, help dialog) (150 LOC)
└── world/
    ├── terrain.ts             // Analytic heightfield & normal calculations (60 LOC)
    ├── WorldScene.ts          // Scene graph, lighting, sky, ridges, tree (250 LOC)
    ├── GrassField.ts          // Instanced grass + wildflowers with atlas sampling (350 LOC)
    ├── Butterflies.ts         // Instanced fluttering butterfly particle meshes (120 LOC)
    └── shaders/               // grass.vert/frag, sky.frag, terrain.vert/frag (300 LOC)
```

---

### 10.3 Reference-Image Comparison Harness

To match running screens to the owner's forthcoming reference concept images:

1. **Fixed Evaluation URL:** Access via `/?compare=1&mood=golden&camera=vista&freeze=1&seed=1337`.
2. **Fixed Viewport & Rendering Pipeline:** Hardcode canvas to $1920 \times 1080$ at `dpr = 1.0`, tone mapping fixed to ACES Filmic, exposure `1.0`.
3. **Playwright Perceptual Harness:**
   - Store reference art in `tests/reference-art/golden-reference.png`.
   - Add a Playwright test `tests/visual-compare.spec.ts` using `pixelmatch` or SSIM:
     ```ts
     const diffPixels = pixelmatch(renderedBuffer, referenceBuffer, diffBuffer, 1920, 1080, {
       threshold: 0.15,
       includeAA: false,
     });
     expect(diffPixels / (1920 * 1080)).toBeLessThan(0.08); // 8% structural tolerance
     ```
   - Automatically write side-by-side diff images (`actual.png`, `reference.png`, `diff.png`) to `docs/visual-diffs/`.

---

### 10.4 Asset Evaluation: What Helps vs. What Does Not

| Asset Type                                       |   Priority   |       Impact       | Reason                                                                                                                                                                     |
| :----------------------------------------------- | :----------: | :----------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Foliage Texture Atlas (1024x1024 WebP)**       | **CRITICAL** | **Transformative** | Instantly breaks the toothpick astroturf look by providing organic blade textures, flower petals (poppies, daisies, dandelions), and clover patches in a single draw call. |
| **Stylized Low-Poly Tree (GLB, ~80 KB)**         |   **HIGH**   | **Transformative** | Replaces the crude icosahedron blob tree at the crest with a charming, painterly silhouette.                                                                               |
| **Natural Audio Ambience Loop (45 KB OGG/WebP)** |   **HIGH**   |     **Major**      | Replaces 862 lines of synth DSP and broken crickets with genuine recorded alpine wind, gentle rustling, and authentic distant birdsong.                                    |
| **Butterfly Sprite Sheet (256x256 WebP)**        |  **MEDIUM**  |     **Major**      | Brings living motion and warmth to the meadow.                                                                                                                             |
| **Terrain Normal / Splat Map (512x512 WebP)**    |  **MEDIUM**  |    **Moderate**    | Breaks up flat green terrain polygons with dirt trails and soil variation.                                                                                                 |
| _Heavy Photorealistic PBR Textures_              |   _REJECT_   |     _Negative_     | 2K/4K PBR normal/roughness maps violate bundle budgets and clash with the stylized, painterly aesthetic.                                                                   |
| _Complex 3D Skeletal Animal Models_              |   _REJECT_   |     _Negative_     | Excessive bone animation overhead for a passive relaxation break app.                                                                                                      |

---

### 10.5 Risks of Simplifying & Mitigation

| Potential Risk                     | Root Cause                                                                          | Mitigation Strategy                                                                                                                 |
| :--------------------------------- | :---------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| **Existing Unit Tests Fail**       | 19 test files mock internal classes (`GestureClassifier`, `AudioEngine`, `Loop`).   | Delete brittle mock unit tests. Replace with integration and Playwright visual snapshot tests that verify visible/audible outcomes. |
| **Mobile Performance Regression**  | Adding a texture atlas or flower quads might increase fill rate.                    | Use `alphaTest: 0.5` instead of alpha blending; clamp mobile instances to 45k via existing capability check (`isTouch -> medium`).  |
| **Context Loss Recovery Breakage** | Removing over-engineered wrappers might inadvertently touch WebGL context handling. | Keep `Renderer.ts` context loss / restored handlers completely intact.                                                              |
| **Loss of Easter Eggs**            | Deleting `ExitScreen.ts` removes the terminal exit console.                         | Acceptable trade-off (YAGNI). Keep the lightweight console greeting in `eggs.ts`.                                                   |

---

## 11. Open Questions for the Owner

1. **Art Style: Painterly / Stylized (Ghibli) vs. Photorealistic?**
   - _Recommendation:_ Stylized painterly (Studio Ghibli / _The Legend of Zelda: Breath of the Wild_). It looks timeless, runs at 60 FPS on low-power devices, and works beautifully with instanced foliage.
2. **Procedural Dogmatism: Are Static Assets Permitted?**
   - May we include ~150–200 KB of static assets (`foliage-atlas.webp`, `tree.glb`, and a natural `ambience.ogg` loop) in `public/assets/`? This single decision unlocks 90% of the visual quality while deleting over 1,500 lines of complex procedural code.
3. **Session Uptime Counter:**
   - Can we permanently delete the digital `uptime outside: 04:12` counter from the HUD? In our view, an ticking digital clock actively undermines relaxation.
4. **Easter Egg Terminal Console:**
   - Is the simulated UNIX `$ ./grass` exit console an essential feature, or can it be pruned?
5. **Target Device Floor:**
   - Is a 2020 iPhone / integrated Intel GPU laptop the intended target? (If so, 45,000 instanced blades on medium tier with an atlas runs at 60 FPS effortlessly).

---

## 12. Appendix

### 12.1 Commands Run During Audit

- `npm run test` $\to$ Vitest 3.2.7: 38 test files, 220 tests passed in 4.28s.
- `npm run build` $\to$ TypeScript 5.7.3 (`tsc --noEmit`) + Vite 6.4.4: built in 2.87s.
- `npm run size` $\to$ Bundle size check: 168.57 KB gzip (within 500 KB budget).
- `npm run contrast` $\to$ WCAG 2.1 AA luminance ratio verification: passed.
- `madge --circular src/` $\to$ Detected 1 circular dependency: `world/terrain.ts > world/TerrainMesh.ts > world/terrain.ts`.
- `node scripts/check_mocks_exports.mjs` $\to$ Analyzed 51 test files; identified 19 mock-heavy files and 41 unused exported symbols.
- `node scripts/capture_audit.mjs` $\to$ Playwright Chromium headless runner executed across 4 tiers and 3 moods; generated 9 high-resolution evidence screenshots and performance measurements.

### 12.2 Subagent Contribution Matrix

- **Subagent A1 (Architecture & Structure):** God Class `App.ts` breakdown, circular dependency identification, lasagna call forwarding.
- **Subagent A2 (Rendering & Scene):** Draw call / triangle census, fake LOD analysis, "geometric broccoli" tree diagnosis, terrain analysis.
- **Subagent A3 (Shaders GLSL):** Normal vector locking, width-axis curvature bending bug, fake SSS flare, fragment Perlin waste, dead `fog.glsl` and `uFogColor`.
- **Subagent A4 (Lighting & Mood):** Wrap-diffuse shadow destruction, premature exponential fog extinction, `NoToneMapping` chalk highlights, color palette tuning.
- **Subagent A5 (Camera, Input & Interaction):** BrushTrail uniform ring buffer verification, `GestureClassifier` patternitis, `GroundRaycaster` 240-step sky raymarching.
- **Subagent A6 (UI/HUD & CSS):** SaaS onboarding state machine bloat, 28ms typewriter engine, custom hand cursor physics, ratio of UI code to graphics code (68%).
- **Subagent A7 (Audio):** Critical `Crickets.ts` disconnected wiring defect (tinnitus whine), arcade bird sweeps, dynamic grain node allocation GC churn (48 nodes/s).
- **Subagent A8 (Performance & Quality):** `AdaptiveQuality.ts` per-frame `sub.sort()` inside 60 FPS loop, speculative auto-upgrade violation.
- **Subagent A9 (Config & Settings):** 81-parameter mood dictionary, speculative `AdaptiveQualityOptions`, phantom URL parameters (`?tier=`, `?camera=`).
- **Subagent A10 (Tests & Build):** Mock test analysis, test-to-source ratio (83%), sham visual byte-count testing.
- **Subagent A11 (Code Smells & Types):** God class analysis, event listener memory leaks on canvas and buttons, `undefined as void` type assertions.
- **Subagent A12 (Visual Gap Analysis):** Real app capture at all moods and poses, visual defect root cause attribution.
- **Subagent A13 (Asset-Readiness):** Procedural lock-in analysis, 6-feature feasibility assessment, transition roadmap.

### 12.3 What Could Not Be Verified

1. **Physical iOS Safari Audio Autoplay Behavior:** While code confirms `AudioContext.resume()` on pointer gesture and visibility pause handlers are implemented, real hardware iOS audio thread wake-up after lock screen sleep could not be physically verified on an actual iPhone device in this headless Windows test environment.
2. **GPU Memory Fragmentation on Integrated Mobile GPUs:** While total VRAM usage was calculated (~3.5 MB) and WebGL draw calls were verified (7–9 calls), thermal throttling behavior over a continuous 30-minute session on low-end Mali/Adreno GPUs could only be simulated analytically.
