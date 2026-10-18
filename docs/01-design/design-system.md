# Design System (tokens)

**Purpose:** all colours, type, spacing, mood presets. Mirror these into `src/app/config.ts` and `src/ui/styles/tokens.css`; do not invent values. **Read in:** M4, M8.

## UI tokens (CSS custom properties)
```css
:root {
  --font-mono: ui-monospace, "SF Mono", "Cascadia Mono", Menlo, Consolas, monospace;
  --font-ui: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --text: #f4f1e8;            /* primary text on glass */
  --text-muted: #cfcdc2;      /* secondary, >= 4.5:1 on panel */
  --accent: #c5f277;          /* grass-neon, primary button bg */
  --accent-ink: #10200c;      /* text on accent */
  --panel: rgba(10, 14, 28, 0.58);
  --panel-solid: rgba(10, 14, 28, 0.82); /* fallback w/o backdrop-filter, and high-contrast */
  --panel-border: rgba(255, 255, 255, 0.16);
  --focus: #ffe08a;
  --radius-pill: 999px; --radius-panel: 14px;
  --blur: 12px;
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px; --space-5: 24px; --space-6: 32px;
  --size-text-s: 12px; --size-text-m: 14px; --size-text-l: 18px; --size-title: clamp(48px, 9vw, 112px);
  --ease-out: cubic-bezier(.22,.8,.2,1); --ease-inout: cubic-bezier(.65,0,.35,1);
  --dur-fast: 160ms; --dur-med: 320ms; --dur-slow: 900ms;
  --safe-top: env(safe-area-inset-top); --safe-bottom: env(safe-area-inset-bottom);
}
```
- Panels: `background: var(--panel); backdrop-filter: blur(var(--blur)); border: 1px solid var(--panel-border);` with `@supports not (backdrop-filter: blur(1px))` → `--panel-solid`.
- Pills: height 36 px (44 px on touch), horizontal padding 14 px, mono 13 px, lowercase.
- Focus: `outline: 2px solid var(--focus); outline-offset: 2px` on every interactive element; never removed.
- Text always sits on a panel/scrim; never directly on the scene (contrast guarantee). Large wordmark on entry overlay uses a dark radial scrim behind it.
- Iconography: inline SVG, 1.5 px stroke, 18 px: sun-rise (dawn), sun (golden), moon (night), speaker/speaker-off, question mark. Draw them in code; no icon library.
- Wordmark: `grass_` mono, weight 600, letter-spacing -0.02em; the underscore blinks at 1.1 s (static under reduced motion).

## Mood presets (single source of truth; interface in `state-and-ui-components.md`)
Colours are sRGB hex; convert with `THREE.Color` (set colour management consistently, see scene doc).

| Param | dawn | golden | night |
|---|---|---|---|
| skyTop | #4a5a9c | #5b8fd0 | #060b24 |
| skyMid | #c88fb0 | #f0b27a | #101b4a |
| skyHorizon | #ffc9a3 | #ffd89a | #24366e |
| discColor | #fff0d0 | #fff3c4 | #f4f1e0 |
| discElevationDeg | 6 | 14 | 38 |
| discAzimuthDeg | 35 | 30 | 25 |
| discSize / halo | 0.030 / 0.35 | 0.036 / 0.45 | 0.026 / 0.30 |
| lightColor | #ffd9b8 | #ffcf8a | #8fa8ff |
| lightIntensity | 0.90 | 1.10 | 0.45 |
| ambientColor | #8e86b8 | #a8a0b0 | #1c2a5c |
| ambientIntensity | 0.55 | 0.60 | 0.50 |
| grassBase | #2f6b4a | #3d7a3a | #0c2a2a |
| grassTip | #a8d878 | #d4e36a | #2f6f5a |
| terrainColor | #355f3d | #4a7a3a | #0d2a28 |
| ridge1/2/3 | #7a6f9c / #9a86a8 / #c09aac | #8a9a7a / #b0a890 / #d6bf9a | #101a3c / #16254f / #1d2f62 |
| fogColor | #e8b9a8 | #f3cf9f | #0f1a3a |
| fogDensity | 0.020 | 0.016 | 0.020 |
| cloudColor / cloudCover | #ffd2c0 / 0.45 | #fff0d8 / 0.40 | #3a4a8a / 0.35 |
| starsAmount | 0 | 0 | 1 |
| firefliesAmount | 0 | 0 | 1 |
| windStrength | 0.75 | 0.90 | 0.55 |
| vignette | 0.30 | 0.22 | 0.38 |
| audio: wind / birds / crickets | 0.7 / 0.9 / 0 | 0.8 / 0.6 / 0 | 0.5 / 0 / 0.9 |

Notes: `discElevation` is above the horizon; the same disc is "sun" in dawn/golden and "moon" at night (night adds soft crater-less mottling via noise, no bitmap). Light direction derives from disc elevation/azimuth.

## Quality tier table (authoritative)
| | high | medium | low |
|---|---|---|---|
| blades | 90,000 | 45,000 | 18,000 |
| blade segments | 4 | 3 | 2 |
| trail points | 16 | 12 | 8 |
| fireflies | 90 | 60 | 30 |
| seeds per click | 18 | 14 | 10 |
| cloud octaves | 3 | 3 | 2 |
| DPR cap | 2.0 | 1.5 | 1.25 |
