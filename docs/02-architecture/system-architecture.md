# System Architecture and Application Structure

**Purpose:** modules, ownership, lifecycle, data flow. **Read in:** M1, M2, and whenever adding a module.

## Overview
Single-page static app. `index.html` contains the static entry overlay + HUD skeleton + `<canvas id="scene" aria-hidden="true">`. `main.ts` boots `App`, which owns the renderer, systems and UI. No server, no routing (a separate `404.html`).

```
index.html ── main.ts ── App ──┬─ Renderer/Loop/QualityController   (core)
                               ├─ World: Terrain, Sky, Ridges, Tree, Grass, Fireflies, Seeds, MoodController
                               ├─ Camera: CameraRig
                               ├─ Input: Pointer, GestureClassifier, Keyboard, GroundRaycaster, BrushTrail
                               ├─ Audio: AudioEngine + layers
                               ├─ UI: Entry, Hud, MoodSwitch, SoundToggle, HintLine, HowItWorks, Uptime, HandCursor, ExitScreen
                               └─ Store (single source of UI/app state), Storage, Flags, Capabilities, DebugApi
```

## Repository layout (project root = this folder)
```
Grass/
├─ README.md  AGENTS.md  tracking/  docs/            (agent-facing; kept in repo)
├─ index.html  vite.config.ts  tsconfig.json  eslint.config.js  .prettierrc  vercel.json  package.json  .nvmrc
├─ public/  favicon.svg  og.png  404.html  (audio/ optional)
├─ src/
│  ├─ main.ts
│  ├─ app/        App.ts store.ts config.ts flags.ts capabilities.ts storage.ts
│  ├─ core/       Loop.ts Renderer.ts QualityController.ts math.ts prng.ts time.ts
│  ├─ world/      terrain.ts Terrain.ts Sky.ts Ridges.ts Tree.ts Grass.ts Fireflies.ts Seeds.ts moods.ts MoodController.ts shaders/*.glsl
│  ├─ camera/     CameraRig.ts
│  ├─ input/      Pointer.ts GestureClassifier.ts Keyboard.ts GroundRaycaster.ts BrushTrail.ts
│  ├─ audio/      AudioEngine.ts Wind.ts Rustle.ts Crickets.ts Birds.ts Sfx.ts scheduler.ts
│  ├─ ui/         copy.ts icons.ts Entry.ts Hud.ts MoodSwitch.ts SoundToggle.ts HintLine.ts HowItWorks.ts Uptime.ts HandCursor.ts ExitScreen.ts Fallback.ts styles/{tokens,base,hud,entry,dialog}.css
│  ├─ easter/     eggs.ts
│  └─ debug/      DebugApi.ts StatsOverlay.ts
├─ tests/  unit/  e2e/
└─ .github/  workflows/ci.yml  pull_request_template.md
```
`src/**` sub-folder == ownership boundary for subagents (`07-agent-operations/subagent-orchestration.md`).

## Contracts
```ts
// core
export interface System { update(dt: number, elapsed: number): void; dispose(): void; }
// App owns: systems: System[] updated in a fixed order each frame:
// input -> gesture -> camera -> mood -> grass/terrain/sky/fireflies/seeds -> audio-control -> ui-light -> render
```
Dependencies point inward: `ui` and `input` talk to the world only through `store` actions and typed events; `world` never imports `ui`; `audio` reads from `store` and events; nothing imports `App` except `main.ts`.

## State ownership
- `store` (observable): `{ phase, mood, targetMood, muted, lying, hintsSeen, quality, reducedMotion, isTouch, helpOpen, uptimeSeconds }`.
- Hot-path data (pointer position, trail points, camera pose, uniforms) is **not** in the store; it lives in the owning system to avoid per-frame subscriber churn.
- Events (`EventTarget`-based tiny bus): `tap{x,z}`, `holdStart`, `holdEnd`, `brush{x,z,speed}`, `moodChange{from,to}`, `entered`, `exit`.

## Lifecycle
`boot()` → capability check (WebGL2?) → Fallback or create Renderer/World/UI → first frame rendered → `store.phase='ready'` → user clicks entry → `phase='running'` (audio unlock, camera entry) → `dispose()` on `pagehide`/exit screen (not required on exit screen; loop pauses). Each class has `dispose()` that releases geometries, materials, textures, listeners, timers, audio nodes.

## Error handling
Boundary at `main.ts`: any init throw → Fallback with reload. Runtime loop errors are caught once per frame batch, logged via `console.error` a single time, and the loop continues only if state is sane; repeated (>3) errors → Fallback. No empty catch blocks except documented storage guards.

## Dev/test hooks
`window.__grass` exists only when `import.meta.env.DEV` or `VITE_EXPOSE_DEBUG=1`. Surface: `getState()`, `setMood(m)`, `stats()` → `{fps, tier, drawCalls, triangles, blades}`, `brushAt(x01,y01)`, `tapAt(x01,y01)`, `hold(on)`, `freeze(on)`. Production build MUST NOT include it (assert in a build test).
URL flags (`src/app/flags.ts`): `?mood=`, `?quality=low|medium|high`, `?debug=1` (stats overlay), `?seed=<int>`, `?freeze=1` (fixed time step for deterministic screenshots).
