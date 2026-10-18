# Asset Specification

**Purpose:** inventory of every asset and how it is produced. **Read in:** M2, M5, M8, M12. Principle: procedural first; keep the repo tiny.

| Asset | Source | Format / size | Produced in |
|---|---|---|---|
| Grass blades, terrain, ridges, tree, sky, fireflies, seeds | procedural (code/GLSL) | none | M2–M7 |
| Noise texture (wind/clouds) | generated at startup into a `DataTexture` (256², tileable value/gradient noise, seeded) | none | M3 |
| Seed sprite | canvas-generated radial 6-spoke texture (64²) | none | M7 |
| Hand cursor (3 states) | hand-authored inline SVG, drawn in code (`HandCursor.ts`) | < 2 KB | M5 |
| Icons (sun-rise, sun, moon, speaker, speaker-off, help) | inline SVG strings in `src/ui/icons.ts` | < 3 KB | M8 |
| Favicon | `public/favicon.svg` — a single bent blade of grass on a dark rounded square | < 1 KB | M12 |
| OG image 1200×630 | Playwright screenshot of golden mood at 1200×630 from the real build, optimized (PNG/JPG ≤ 150 KB) → `public/og.png` | | M12 |
| 404 page | `public/404.html`, self-contained inline CSS | < 4 KB | M8 |
| Fonts | none (system stacks) | | |
| Audio | procedural (optional CC0 mp3 in M9b ≤ 250 KB, with CREDITS) | | M9 |

Rules: no external hosts; no copyrighted imagery; no stock photos; log any added binary asset and its licence in `docs/decisions/architecture-decision-records.md`. Screenshots stored as evidence ≤ 150 KB each (use PNG-8/WebP).
