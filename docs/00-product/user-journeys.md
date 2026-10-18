# User Journeys

**Purpose:** end-to-end flows used for acceptance tests. **Read in:** M0, M8, M10, M12.

## J1 — First visit, desktop (golden path)
1. Open URL. Entry overlay + wordmark `grass_` paint immediately; scene boots behind (blurred-darkened).
2. Button reads `step outside` (enabled within ~1 s on a decent machine). Click.
3. Overlay fades 900 ms; camera eases from a slightly higher/farther pose to base pose over 1.4 s; ambience fades in 1.2 s.
4. After 1.5 s hint 1 appears: move the mouse over the grass.
5. User moves mouse → grass parts, springs back. After ~600 px cumulative movement (or 8 s) hint 2: click to scatter seeds.
6. User clicks → seeds drift. Hint 3 (or after 8 s): hold to lie down.
7. User holds → camera dips, vignette, sound softens; release returns. Hint 4 confirms and fades; `grass:hints-seen=1`.
8. User switches mood via pills or keys 1/2/3; sees the 2.5 s crossfade; night shows fireflies and crickets.
9. User opens "how it works", reads, presses Esc.
10. User types `exit` (EE-1) or closes tab.

## J2 — Returning visit
Mood restored, no hints, entry overlay still present (needed for audio unlock). Mute state restored.

## J3 — Mobile
Same as J1 with touch hint copy; UI bottom-safe; start tier medium; one-finger drag brushes; tap seeds; press-and-hold lies down; rotating the device re-frames (fov adjusts).

## J4 — Keyboard-only
Tab to "step outside" → Enter. Keys: arrows move the virtual brush, Enter scatters, hold Space lies down, 1/2/3 moods, M mute, ? help, Esc closes dialogs. All HUD buttons reachable by Tab with visible focus.

## J5 — Reduced motion
Wind amplitude 35%, no camera parallax/drift, dip becomes a 300 ms fade-less shorter move, firefly blink replaced by steady soft glow, cursor tilt off, no blinking underscore, no typed-text effect (instant text).

## J6 — No WebGL2 / very slow device
Fallback page with message and gradient; or auto-downgrade tier with no visible error.

## J7 — Tab hidden then returned
Render/audio pause; uptime pauses; resume without time jump.
