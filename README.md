# Grass

<p align="center">
  <img src="./public/og.png" alt="Grass Meadow Preview" width="800" style="border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);" />
</p>

<p align="center">
  <strong>A calm, stylized, interactive 3D meadow that runs in the browser, built for developers who need a quick break.</strong>
</p>

<p align="center">
  <a href="https://github.com/Natnael-Dev/grass/actions/workflows/ci.yml"><img src="https://github.com/Natnael-Dev/grass/actions/workflows/ci.yml/badge.svg" alt="CI Status" /></a>
  <img src="https://img.shields.io/badge/TypeScript-5.7-blue.svg?logo=typescript" alt="TypeScript Strict" />
  <img src="https://img.shields.io/badge/Three.js-r186-black.svg?logo=three.js" alt="Three.js r186" />
  <img src="https://img.shields.io/badge/WebGL-2.0-orange.svg" alt="WebGL2" />
  <img src="https://img.shields.io/badge/Vitest-3.2-green.svg?logo=vitest" alt="Vitest 3.2" />
  <img src="https://img.shields.io/badge/Playwright-1.64-purple.svg?logo=playwright" alt="Playwright" />
  <a href="./LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT" /></a>
</p>

---

## Highlights & Features

- 🌿 **Instanced Grass Simulation:** Up to 90,000 animated grass blades rendered in a **single GPU draw call**, featuring stratified Poisson-jittered placement, dynamic normal leaning responding to wind waves, and root ambient occlusion anchoring.
- 🌅 **Three Living Moods:** Seamless real-time crossfading between **Dawn**, **Golden Hour**, and **Night with Fireflies**, dynamically interpolating sky dome gradients, lighting colors, fog falloff, and audio synthesizers.
- 🍃 **Interactive Mechanics:** Mouse pointer and mobile touch part the grass blades with a reactive spring-damped brush trail. Click or tap to disperse floating dandelion seeds; hold down to **lie down** in the meadow (spring-damped camera dip).
- 🎵 **Procedural Web Audio:** Filtered noise wind, dawn birdsong, nighttime crickets with AM modulation, and interactive rustling—100% synthesized through the Web Audio API with zero external audio assets.
- ♿ **Accessible & Resilient:** WCAG 2.1 AA compliant color contrast ($\ge 4.5:1$), prefers-reduced-motion support, WebGL context lost auto-recovery toast, and semantic HTML5 landmarks with native `<dialog>` modals.
- ⚡ **Adaptive Performance:** 1 Hz moving-average adaptive quality controller (Ultra, High, Medium, Low) maintaining 60 FPS on integrated mobile GPUs and high-refresh desktop monitors alike.

---

## Tech Stack

- **Engine:** Vanilla [Three.js](https://threejs.org/) (r186) with custom WebGL2 GLSL vertex and fragment shaders.
- **Tonemapping & Pipeline:** ACES Filmic tone mapping with sRGB color encoding.
- **Language & Tooling:** TypeScript (strict mode) with [Vite](https://vite.dev/).
- **Testing:** [Vitest](https://vitest.dev/) for unit testing, [Playwright](https://playwright.dev/) for end-to-end browser workflows and deterministic visual comparisons.
- **Architecture:** Zero-backend static client SPA.

---

## Project Structure

```
├── .github/workflows/ci.yml # Automated CI pipeline
├── docs/
│   ├── STATE.md             # Active system state, metrics & roadmap
│   ├── CLEANUP_REPORT.md    # Phase A over-engineering cleanup & render pipeline report
│   ├── OVERENGINEERING_AUDIT.md # Architecture review & audit findings
│   ├── AGENT-README.md      # Comprehensive agent implementation instructions
│   └── archive/             # Preserved design, architecture, and quality specs
├── public/                  # Static web assets (favicon, Open Graph card)
├── scripts/                 # Build & visual verification scripts
├── src/
│   ├── app/                 # App coordinator, reactive store, and URL flags
│   ├── audio/               # Procedural Web Audio engine & soundscape synthesizers
│   ├── camera/              # CameraRig, poses (vista, lie-down), and parallax
│   ├── core/                # WebGL2 Renderer, RAF Loop, AdaptiveQuality, and math
│   ├── input/               # Pointer tracking, GroundRaycaster, and virtual keyboard brush
│   ├── ui/                  # HUD, minimal controls, modal dialog, and styling tokens
│   └── world/               # WorldScene, Grass, Terrain, Sky, Ridges, Tree, and shaders
├── tests/
│   ├── e2e/                 # Playwright test suite & visual comparison baselines
│   └── unit/                # Vitest unit test suite (37 test files)
└── tracking/                # Live tracking logs, gate records, and test evidence
```

---

## Getting Started

### Prerequisites

- Node.js `20.x` or higher
- npm `10.x` or higher

### Installation & Development

```bash
# Clone the repository
git clone https://github.com/Natnael-Dev/grass.git
cd grass

# Install dependencies
npm install

# Start local development server (with HMR)
npm run dev

# Open browser to http://localhost:5173
```

### Verification & Testing

```bash
# Run full verification suite (lint, typecheck, unit tests, build, size, contrast)
npm run check

# Run unit test suite (Vitest)
npm run test

# Run End-to-End tests (Playwright)
npm run test:e2e

# Run TypeScript strict typecheck
npm run typecheck

# Run ESLint with zero-warning threshold
npm run lint

# Format code with Prettier
npm run format

# Verify WCAG 2.1 AA color contrast
npm run contrast

# Verify production bundle budget
npm run size
```

---

## Controls & Interaction

| Input                       | Action                                                            |
| :-------------------------- | :---------------------------------------------------------------- |
| **Mouse Move / Touch Drag** | Brushes through the grass blades via interactive deflection trail |
| **Click / Tap**             | Scatters dandelion seed particles drifting with procedural wind   |
| **Click & Hold / Spacebar** | Lie down in the meadow (camera dips down into grass blades)       |
| **WASD / Arrow Keys**       | Virtual keyboard brush navigation                                 |
| **1 / 2 / 3**               | Switch moods (`1`: Dawn, `2`: Golden Hour, `3`: Night)            |
| **M**                       | Toggle ambient Web Audio soundscape                               |
| **H / ?**                   | Toggle "How It Works" guidance modal                              |

---

## Deterministic Visual Test Harness

The application supports URL query parameters for reproducible visual regression audits:

```
http://localhost:5173/?compare=1&mood=golden&camera=vista&freeze=1&seed=42&ui=0
```

- `compare=1`: Locks viewport to 1920x1080 at DPR 1.0 and fixes the PRNG seed.
- `mood=dawn|golden|night`: Sets the mood preset.
- `camera=vista|lying`: Sets standing vista pose or dipped lie-down pose.
- `freeze=1`: Stops procedural wind time at a deterministic offset.
- `ui=0`: Hides HUD overlays for pure render verification.

### Capture & Comparison Utilities

```bash
# Capture full suite (dawn, golden, night in vista and lie-down poses)
node scripts/capture-standard-screens.mjs docs/baseline

# Compare actual render against a reference image
node scripts/compare-reference.mjs <path-to-reference.png> --mood=golden --camera=vista
```

---

## Documentation & Governance

- [ARCHITECTURE.md](./ARCHITECTURE.md) — Subsystem design, coordinators, and rendering pipeline.
- [docs/STATE.md](./docs/STATE.md) — Single source of truth for active project health and roadmap.
- [docs/CLEANUP_REPORT.md](./docs/CLEANUP_REPORT.md) — Detailed summary of Phase A optimizations and visual pipeline fixes.
- [docs/OVERENGINEERING_AUDIT.md](./docs/OVERENGINEERING_AUDIT.md) — Codebase audit and minimum viable architecture roadmap.
- [CHANGELOG.md](./CHANGELOG.md) — Release notes and milestone delivery records.
- [docs/AGENT-README.md](./docs/AGENT-README.md) — Original agent specification, directives, and gate protocols.

---

## License

MIT License. See [LICENSE](./LICENSE) for details.
