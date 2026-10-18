# Input and Controls

**Purpose:** pointer/touch/keyboard handling and ground raycasting. **Read in:** M5, M6, M10. Gesture thresholds: `01-design/motion-and-interactions.md`.

## Pointer (unified Pointer Events)
- Listen on the canvas wrapper (`pointermove`, `pointerdown`, `pointerup`, `pointercancel`, `pointerleave`) with `setPointerCapture` on down. `touch-action: none` on the canvas. `contextmenu` prevented on the canvas only.
- Track one active `pointerId`; ignore others. Normalised coords (0..1) plus pixel deltas.
- Pen counts as touch for UI purposes; mouse gets the hand cursor.

## Ground raycasting (`GroundRaycaster`)
Cast a ray from camera through the pointer; intersect the analytic terrain by marching: start at near plane, step 0.5 m up to 120 m while `ray.y > terrainHeight`, then 6 binary-refinement iterations. Return `null` if no hit (sky). Cache scratch vectors; run at most once per frame.

## Brush input
Per frame: if hit && !lying → compute speed (m/s, smoothed over 3 frames) → `BrushTrail.maybePush(hit, speed)`. Emits `brush` event for audio.

## Keyboard
| Key | Action | Notes |
|---|---|---|
| Arrow keys | move virtual brush (hand) | speed 9 m/s ground-space on screen-projected axes; hand cursor follows; pointer input overrides when the mouse moves |
| Enter | tap at virtual brush (scatter seeds) | only when focus is not on a button/dialog |
| Space (hold) | lie down | ignored if event target is a button/input/dialog; `keyup` ends; prevent page scroll |
| 1 / 2 / 3 | mood dawn / golden / night | |
| M | toggle sound | |
| ? (Shift+/) or H | open how-it-works | |
| Esc | close dialog | |
| e-x-i-t | EE-1 | buffer; ignored in dialogs/inputs |
Key handling must ignore events with Ctrl/Meta/Alt. Key repeat for Space must not re-trigger start.

## Touch specifics
One-finger drag = brush; quick tap = seeds; press-hold 250 ms = lie down; second finger down cancels current gesture. Prevent browser gestures only on the canvas: `touch-action: none` and `overscroll-behavior: none`. Keep the viewport meta standard (`width=device-width, initial-scale=1, viewport-fit=cover`) and never set `user-scalable=no` (accessibility).

## Focus and blur
`window.blur`/`visibilitychange` → release any hold, clear virtual keys, stop brush.

## Tests
Unit: `GestureClassifier` (tap vs hold vs drag boundaries: 249/250 ms, 8/9 px, cancel), `BrushTrail` (ring buffer, response curve, expiry), `GroundRaycaster` (hit/miss against `terrainHeight`), `Keyboard` buffer for `exit`. E2E: synthetic pointer events via `window.__grass` helpers and real Playwright mouse/touch actions.
