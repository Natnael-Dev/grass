# Grass

A calm, stylized, interactive 3D meadow that runs in the browser, built for developers who need a quick break.

## Tech Stack

- **Engine:** Vanilla [Three.js](https://threejs.org/) + custom WebGL2 GLSL shaders
- **Tooling:** Vite + TypeScript (strict mode)
- **Audio:** Procedural Web Audio API synthesis (no audio files)
- **Architecture:** Zero backend, static client SPA, hosted on Vercel

---

## Getting Started

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Run unit test suite (Vitest)
npm run test

# Typecheck and lint
npm run typecheck
npm run lint

# Production build
npm run build
```

---

## Controls & Interaction

- **Mouse / Finger Move:** Brushes through the grass blades via interactive trail.
- **Click / Tap:** Scatters dandelion seeds that drift with the wind.
- **Click & Hold (or Spacebar):** Lie down in the meadow (camera dips down into the blades).
- **Arrow Keys / WASD:** Keyboard brushing navigation.
- **H / ?:** Toggle "How It Works" help dialog.
- **1 / 2 / 3:** Switch moods (`dawn`, `golden`, `night`).
- **M:** Toggle ambient audio.

---

## Visual & Test Harness

Deterministic rendering flags are supported via URL query parameters:

```
http://localhost:5173/?compare=1&mood=golden&camera=vista&freeze=1&seed=42&ui=0
```

- `compare=1`: Locks viewport and deterministic seed
- `mood=dawn|golden|night`: Sets the mood
- `camera=vista|lying`: Sets camera view
- `freeze=1`: Stops procedural wind time at fixed offset
- `ui=0`: Hides HUD overlays for pure render verification

### Standard Screenshot Capture

```bash
node scripts/capture-standard-screens.mjs docs/baseline
```

For full architecture and rendering pipeline details, see [ARCHITECTURE.md](file:///c:/Users/HP/OneDrive/Desktop/Grass/ARCHITECTURE.md). Historical planning and milestone archives are preserved in `docs/archive/`.
