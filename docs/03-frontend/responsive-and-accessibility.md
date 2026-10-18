# Responsive Behavior and Accessibility

**Purpose:** mobile, resize and a11y rules. **Read in:** M8, M10, M12.

## Responsive
| Condition | Behavior |
|---|---|
| Landscape desktop | layout per UI spec |
| Portrait / narrow (< 640 px) | fov 55°; mood pills stay bottom-centre (icons + labels, 44 px); sound + help move to top-right stacked horizontally; uptime moves above mood pills centred, hint line wraps to 2 lines max (width 90vw); entry title uses `--size-title` clamp |
| Touch device | hand cursor off; tier starts medium; hint copy = touch variants; safe-area insets via `env(safe-area-inset-*)`; all targets >= 44 px |
| Small height (< 420 px landscape phone) | hide uptime, shrink pills to icons only |
| Very large (>= 2560) | DPR cap holds; no scaling of blade counts |
Use `100dvh` for the full-screen layers; `viewport-fit=cover`.

## Reduced motion (`prefers-reduced-motion: reduce`, live-updating via `matchMedia` change)
Wind amplitude ×0.35 (`uReduced`); no parallax/idle drift/gust; lie-down 300 ms linear with no fov/vignette change; fireflies steady glow (no blink, drift ×0.3); no typed-text effect; no blinking underscore; hand cursor no tilt; mood crossfade shortened to 1.0 s; entry dolly replaced by a 400 ms fade. Provide the same functionality.

## Keyboard and focus
Everything operable by keyboard (see `input-and-controls.md`). Tab order: entry button → (after entry) how-it-works → sound → mood pills. Focus ring always visible. Dialog: focus trap, `Esc`, restores focus. No keyboard traps. Skip link not required (tiny page).

## Screen readers
Canvas: `aria-hidden="true"` (decorative) and the how-it-works dialog includes a text description of the scene. `HintLine` is `role="status" aria-live="polite"`. Buttons have names; `aria-pressed` for toggle buttons; the exit screen's re-run is a button with focus on appear. Page has `lang="en"`, a single `<h1>` (wordmark in entry), landmarks: `<main>` (scene), `<nav aria-label="controls">` for HUD.

## Colour and contrast
All UI text on panels >= 4.5:1; verify per mood by measuring contrast of `--text` vs the panel composited over the *brightest* expected background (golden horizon). Fireflies/glows are decorative only. Never encode information by colour alone.

## High contrast / forced colors
`@media (forced-colors: active)`: buttons use system colours, panels get borders.

## Verification
Lighthouse a11y >= 95; axe-style checks through Playwright (use roles/labels in locators — if a locator needs a CSS class, the a11y is wrong); manual keyboard run recorded as evidence; reduced-motion emulation test.
