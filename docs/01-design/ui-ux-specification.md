# UI/UX Specification

**Purpose:** every interface element and state. **Read in:** M8, M10. Tokens: `design-system.md`. Copy: `copywriting.md`. Motion: `motion-and-interactions.md`.

Principle: the scene is the interface. All UI is small, glassy, peripheral, and fades back when the user is actively brushing (HUD opacity 1 → 0.45 after 4 s of pointer activity over the scene; returns on pointer leaving or Tab focus).

## Layout (desktop; mobile rules in `responsive-and-accessibility.md`)
| Element | Placement | Visible | Behavior |
|---|---|---|---|
| Entry overlay | full screen, centred stack | until "step outside" | wordmark, tagline, button, tiny note. Scene blurred/dimmed behind (CSS backdrop dim only; no live blur on canvas). |
| Wordmark (HUD) | top-left, 16px inset | after entry | `grass_`; not a link; non-interactive |
| How-it-works button | top-right | after entry | opens dialog; `?` key |
| Sound toggle | top-right next to it | after entry (hidden if no AudioContext) | speaker icon pill; `aria-pressed`; `M` key |
| Mood pills | bottom-centre | after entry | 3 pills with icon+label; current is filled; keys 1/2/3 |
| Uptime counter | bottom-left | after entry | `uptime outside: 00:42` mono 12 px |
| Hint line | upper-centre (y ≈ 16%) | contextual | terminal-style single line in a panel; typed effect 28 ms/char (instant under reduced motion); fades after 6 s or on next hint |
| Hand cursor | follows pointer | pointer devices, over scene | states: open, moving (tilt ±12° by velocity), pressed (closed fist); native cursor hidden over canvas (`cursor: none`) but restored over UI |
| Vignette overlay | full screen | always, strength from mood/lying | CSS radial-gradient, `pointer-events:none` |
| Exit screen (EE-1) | full screen | after `exit` | terminal screen, `process exited with code 0`, `[ re-run ]` button |
| Fallback page | full screen | no WebGL2 | message + gradient; no scripts needed |

## Entry overlay
Stack (centre): wordmark (`--size-title`) → tagline (`--size-text-l`, muted) → primary button `step outside` (accent bg, 48 px high, 20 px padding) → note (`--size-text-s`) "sound starts when you click". Button is auto-focused. Enter/Space/click all work. States: `loading` (disabled, "growing grass…", only if > 300 ms), `ready`, `error` (falls to Fallback).

## Dialog: how it works
Modal (`role="dialog" aria-modal="true" aria-labelledby`), max 520 px, scrim 55%. Sections: "what is this", "controls" (3-column table: mouse / touch / keyboard), "q&a" (2–3 jokes), credits (three.js MIT; "open source" link to the repo). Focus trap, Esc closes, returns focus to opener. Scene continues running behind (dimmed 30%).

## HUD behaviors
- Mood switch: pill click → crossfade 2.5 s; pill shows `aria-pressed`. While crossfading, extra clicks retarget smoothly from the current blended state.
- Sound toggle: toggles master gain with 300 ms ramp; persists.
- All buttons: hover raise (background +8% white), active press scale 0.97, 160 ms.

## Error / unsupported / low-performance states
- No WebGL2 → Fallback (copy in `copywriting.md`), 200 OK, no console errors.
- Context lost → show toast "the meadow blinked. recovering…", attempt restore via `webglcontextrestored`; if not restored in 5 s show Fallback with reload button.
- Low performance → silent tier downgrade; no UI, but `?debug=1` shows it.
- Storage blocked → silent; app still works.

## First-visit guidance
See hint sequence in `copywriting.md` and triggers in `motion-and-interactions.md`. Stored via `grass:hints-seen`.

## Accessibility summary (full: `responsive-and-accessibility.md`)
Every control is a real `<button>`; names via text or `aria-label`; live region (`aria-live="polite"`) for hint lines; dialog semantics; keyboard path for all interactions; visible focus; contrast >= 4.5:1 verified for each mood.
