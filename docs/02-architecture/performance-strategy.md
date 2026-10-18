# Performance Strategy

**Purpose:** how we hit 60 fps desktop / 30 fps mobile. **Read in:** M3, M5, M11. Budgets: `05-quality/performance-benchmarks.md`.

## Principles
Cut effects before frames. One rAF loop. Zero allocations in hot paths. GPU does the work; CPU only updates uniforms.

## Techniques
1. **One draw call for grass:** a single `InstancedBufferGeometry` mesh; attributes: `offset(vec3)`, `params(vec4: height, width, yaw, bend)`, `rand(vec2)`. Instances are generated once from a seeded PRNG, positioned on `terrainHeight`, thinned by distance-weighted density rings (near 55% / mid 35% / far 10% of the budget), then **shuffled** so that reducing `instanceCount` thins uniformly. `frustumCulled=false` (bounds known; manual).
2. **Tiers** (design-system table). Start: desktop high, touch medium, `?quality=` override.
3. **Adaptive downgrade (`QualityController`):** after 3 s warm-up, over a rolling 120-frame window, if p95 frame time > 22 ms → step down one tier (reduce `instanceCount` ×0.5, trailPoints, fireflies, seed counts, DPR); 4 s cooldown; never auto-upgrade; max 2 downgrades. Compensate density loss by widening blades (`uDensityComp = sqrt(full/count)`, clamped 1–1.8).
4. **Resolution:** `renderer.setPixelRatio(min(devicePixelRatio, tier.dprCap))`; resize via `ResizeObserver` debounced 100 ms.
5. **Shader cost:** limit trail loop to `uTrailCount` (uniform) with early-out by distance; avoid `pow` in the fragment shader where `x*x` works; no texture lookups in the fragment shader of grass; wind noise from a 256² texture sampled in the vertex shader (2 taps).
6. **No real-time shadows, no post-processing, no MSAA on low** (`antialias` true only on high and DPR < 2).
7. **Frame pacing:** clamp `dt` to 0.1 s; pause on `visibilitychange`; throttle HUD text updates (uptime 1 Hz).
8. **Memory:** reuse `Vector3`/`Color` scratch objects; typed arrays for trail/seed/firefly state; dispose everything on teardown.
9. **Startup:** static entry overlay in HTML/CSS (no JS needed to paint); dynamic-import the scene bundle after first paint (`requestIdleCallback`/`setTimeout 0`) so LCP is the overlay; generate noise texture/instances in chunks if > 50 ms (yield with `await new Promise(requestAnimationFrame)`).
10. **Bundle:** import only what's used from `three` (named imports), no `three/examples` unless justified; GLSL as raw strings; no sourcemaps in prod beyond Vercel defaults.

## Measuring
- Draw calls / triangles from `renderer.info` via `window.__grass.stats()`.
- Frame time: `?debug=1` overlay (rolling avg + p95).
- Traces and heap: `chrome-devtools-mcp` (performance trace, memory snapshots) — note headless software GL is **not representative of real GPU fps**; use it for relative regressions, long tasks, and leaks.
- Lighthouse via the `web-perf` skill.
- Human verifies real-device fps at G10.

## Fallback ladder
tier high → medium → low → (if still > 33 ms p95) show a non-blocking hidden-by-default note in debug only; do not nag the user.
