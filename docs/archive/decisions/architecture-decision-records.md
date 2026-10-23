# Architecture Decision Records

Format: `ADR-nnn — title (status: accepted | agent-proposed | superseded)`. Agent-proposed entries are appended here during the build (README §9). Human-approved entries are `accepted`.

## ADR-001 — Stylized-painterly visuals (accepted)

Procedural, stylized look rather than photoreal. Reason: 60 fps on laptops/phones, reliable for an autonomous agent, no asset pipeline. Revisit if the human wants photoreal.

## ADR-002 — Vite + TypeScript + vanilla Three.js + custom GLSL (accepted)

No React/Next/R3F. Static site, render-loop-sensitive, minimal abstractions. Revisit if multi-page/community features arrive.

## ADR-003 — No backend (accepted)

No requirement needs one. localStorage only. See `04-backend/no-backend.md`.

## ADR-004 — WebGL2 only (accepted)

Universal support; WebGPU deferred (FE-02).

## ADR-005 — Single vista camera; lie-down is a camera dip (accepted)

First-person walking deferred (FE-01). The "dip" delivers the cosy moment at low cost.

## ADR-006 — Procedural audio first, optional CC0 samples (accepted)

Zero asset cost; samples only if CC0 and ≤ 250 KB (M9b).

## ADR-007 — Three moods on one terrain (dawn/golden/night) (accepted)

Lighting presets, not separate biomes; cheap and cohesive.

## ADR-008 — Strict human-approval gates, atomic commits, rebase-merge (accepted)

The human tests each milestone before push/merge (default `MODE: strict`). History preserved via rebase-merge; no squash.

## ADR-009 — Production deploy only at M13 (accepted)

Vercel project created at release time so unfinished work is never public; previews for testing.

## ADR-010 — Dependency versions (agent-proposed)

Verified on 2026-10-18 via npm registry and Context7:

- Node LTS: v24.15.0 (system runtime)
- npm: 11.12.1
- `three`: `0.186.1`
- `@types/three`: `0.186.0`
- `vite`: `^6.2.0` (or `8.3.4` latest stable; Vite 6.x is standard with Vitest 3.x / 5.x)
- `typescript`: `^5.7.0` (or `7.0.2` latest npm release)
- `vitest`: `^3.0.0` / `5.0.5`
- `@playwright/test`: `1.64.1`
- `eslint`: `^9.0.0` / `10.13.0` (flat config)
- `prettier`: `3.9.10`
- `husky`: `9.1.7`
- `lint-staged`: `17.6.0`
- `@commitlint/cli`: `21.2.4`
- `@commitlint/config-conventional`: `21.2.4`

Three.js API & Colour Management Caveats:

- In Three.js (r154+), `encodings_fragment` was replaced with `colorspace_fragment`. Fragment shaders in custom `ShaderMaterial` must output linear color and include `#include <colorspace_fragment>` as verified via Context7.
- Default output color space is `THREE.SRGBColorSpace`. `renderer.outputColorSpace = THREE.SRGBColorSpace`.
- All custom mood hex colors must be parsed with `THREE.Color` to maintain linear working space accuracy.

## ADR-011 — MIT licence (agent-proposed default; human may change)

## ADR-012 — Terrain Module File Naming on Case-Insensitive Filesystems (agent-proposed)

Context: On default Windows (NTFS) and macOS filesystems, file paths are case-insensitive. Placing both `terrain.ts` (analytic height/normal functions) and `Terrain.ts` (Three.js mesh class) in `src/world/` causes file clobbering and git case collision.
Decision: Keep analytic functions in `src/world/terrain.ts` and define the 3D mesh and material class in `src/world/TerrainMesh.ts`, re-exported from `src/world/terrain.ts` as `Terrain` and `TerrainMesh`.
Alternatives: 1) Merge everything into `terrain.ts`, 2) Rename `terrain.ts` to `terrainFunction.ts`.
Consequences: Preserves existing contracts (`terrainHeight`, `terrainNormal`, `TREE_COORDS`), enables seamless imports on all operating systems without git case divergence, and adheres to strict TypeScript rules.
Needs human approval: n
Related: FR-02, Task 2.6
