# Technology Decisions

**Purpose:** the stack and why. **Read in:** M0, M1. Versions are NOT pinned here because they could not be verified when this package was written: the agent MUST look up the latest stable versions (Context7 MCP / npm registry), pin exact versions in `package.json`, and record them in ADR-010.

## Decided stack
| Concern | Choice | Why | Alternatives | Reconsider if |
|---|---|---|---|---|
| Language | TypeScript (`strict`) | safety for a render loop and shader uniforms | JS | never |
| Build/dev | Vite | instant dev server, static output, `?raw` GLSL imports | Webpack, Parcel | never |
| Rendering | **vanilla Three.js** (WebGL2) | mature, tree-shakable, full control of instancing and `ShaderMaterial` | R3F, Babylon, raw WebGL | need ecosystem tooling or WebGPU-only features |
| Grass | custom GLSL in `ShaderMaterial` + `InstancedBufferGeometry` | one draw call, per-blade variation, cheap interaction | mesh blades, textured quads | quality target changes to photoreal |
| UI | plain DOM + CSS custom properties, small TS classes | no framework overhead, tiny bundle | React/Svelte | UI grows beyond ~10 components |
| State | tiny typed observable store (`src/app/store.ts`) | enough; zero deps | Zustand, Redux | multi-page app |
| Audio | Web Audio API (procedural) | no assets, instant | Howler, samples | spatial/complex mixing needed |
| Tests | Vitest (unit), Playwright (e2e) | fast, same toolchain as Vite; playwright MCP available | Jest, Cypress | never |
| Lint/format | ESLint (flat config) + Prettier + TypeScript-ESLint | standard | Biome | team preference |
| Hooks | Husky + lint-staged (use `setup-pre-commit` skill) | enforces quality at commit | lefthook | n/a |
| CI | GitHub Actions | free, integrates with PRs | | |
| Hosting | Vercel (static, `vite` preset) | free tier, previews | Netlify, Cloudflare Pages | limits hit |
| Backend | **none** | no requirement needs it (`04-backend/no-backend.md`) | | accounts/shared state wanted |

## Explicitly not used
React/Next.js/R3F, post-processing libraries, physics engines, animation libraries (use the small `damp`/`spring` helpers), audio libraries, CSS frameworks, icon libraries, analytics, font CDNs.

## Allowed dependencies (exhaustive)
runtime: `three` (and `@types/three` if not bundled). dev: `vite`, `typescript`, `vitest`, `@playwright/test`, `eslint` + `typescript-eslint` + `@eslint/js` + `globals`, `prettier`, `husky`, `lint-staged`, `@commitlint/cli` + config (optional), `vite-plugin-glsl` **only if** raw imports prove insufficient (prefer `?raw`). Anything else needs an ADR + human approval.

## WebGL vs WebGPU
WebGL2 only for v1: universal support, ample for ~90k blades. WebGPU is a future experiment (FE-02).

## Colour management
Use Three's default colour management (sRGB output, linear working space); specify mood colours as hex via `THREE.Color`; in custom `ShaderMaterial`s output linear colour and let the renderer convert (`#include <colorspace_fragment>` where applicable — verify the current include name via Context7 because chunk names change between releases).

## Verification duty
Before using any Three.js API in a new area (InstancedBufferGeometry, ShaderMaterial uniforms arrays, Points, DataTexture, color management), check current docs via Context7. Record the resolved version and any API deviation in ADR-010.
