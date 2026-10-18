# Motion and Interaction Design

**Purpose:** exact timings, thresholds and behaviors. **Read in:** M5, M6, M7, M8. Input plumbing: `03-frontend/input-and-controls.md`.

## Gesture classification (pointer, primary button)
State machine in `GestureClassifier`:
- `idle` → pointerdown → `pressing` (record t0, x0, y0).
- In `pressing`: if moved > 8 px → `dragging` (brush continues; no tap/hold possible for this press). If held >= 250 ms and moved <= 8 px → `holding` (lie down starts).
- pointerup in `pressing` (< 250 ms, <= 8 px) → emit `tap` (seeds).
- pointerup in `holding` → emit `holdEnd` (rise).
- `pointercancel`/`blur`/`visibilitychange` → release cleanly.
Brushing (hover or drag) is independent: pointer *movement* always brushes unless `holding`.
Touch: same machine; one active pointer only (extra pointers ignored).

## Brush
- Sample the pointer ground position each frame; push a trail point when moved >= 0.25 m or >= 40 ms since last (and speed > 0.4 m/s).
- Point: `{x, z, radius, strength, birth}`. Radius = clamp(1.4 + 0.05·distFromCamera, 1.4, 3.0) m. Strength = clamp(speed/6, 0.15, 1).
- Displacement per blade: push away from point along ground, magnitude `strength · falloff(d/radius) · h²`, plus flatten `0.55 · strength · falloff · h` (reduces blade height). `falloff(u) = (1 - smoothstep(0.0, 1.0, u))`.
- Spring-back: `life = 2.4 s`; response `r(age) = exp(-2.4·age) · cos(6.0·age)`, clamped so only the first overshoot (age < 1.0 s) goes negative (≤ -12% overshoot), after which it decays to 0. Remove point at age > 2.4 s.
- Ring buffer of `trailPoints` (16/12/8); oldest overwritten.

## Seeds (tap)
Spawn at ground hit; count by tier; each seed: velocity up 1.2–2.4 m/s, horizontal 0.3–0.8 m/s random direction, wind accel along wind dir 0.6·windStrength, drag 0.8/s, sink 0.25 m/s after apex, life 3.5–5.5 s, alpha: fade in 0.15 s, fade out last 1.0 s, size 10–18 px scaled by distance. Also push a trail point with strength 1.0 and radius ×1.3 at the tap point. Seed sfx.

## Lie down (hold)
- Entering: over 1.1 s, `--ease-out`: camera y → terrainHeight + 0.38; pitch +14° (look up toward sky); fov +4°; vignette +0.25; HUD opacity → 0.35; audio lowpass opens-and-softens (see audio doc). Brush disabled; cursor shows pressed (fist), then hides after 1 s.
- While holding: parallax doubles (look around the sky); near-camera blades dither-fade within 0.5 m. 
- Releasing: 0.9 s `--ease-inout` back to base pose.
- EE-2 at 10 s hold.
- Keyboard: Space held = same.
- Reduced motion: 300 ms linear move, no fov change, no vignette change.

## Camera parallax and idle
Pointer position → target yaw/pitch ±6°/±3° via critically damped spring (ω = 4). Idle (>= 25 s no input): slow sinusoidal drift (±1.5° yaw, 0.04 Hz) and one wind gust (windStrength ×1.6 for 5 s, eased). Any input ends idle within 0.4 s. Idle hint at 40 s.

## Entry transition
Overlay opacity 1→0 over 900 ms (`--ease-out`), then `display:none`; focus moves to the HUD's first control (the how-it-works button) only if the user used the keyboard, otherwise stays on `body`; HUD fades in 600 ms staggered 80 ms. Camera: from `base + (0, +0.9, +3.5)` to base over 1.4 s `--ease-out`. Audio fade-in 1.2 s.

## Mood crossfade
All preset values lerp over 2.5 s with ease-in-out; colours lerp in linear-sRGB (not gamma space). Fireflies/stars/bird/cricket amounts ride the same curve. Disc position lerps by elevation/azimuth angles (not by vector) so it travels in an arc.

## Hint line
Typed at 28 ms/char, held 6 s, fades 400 ms. Hint triggers (first-visit sequence):
1. +1.5 s after entry.
2. after cumulative brush path >= 600 px, or +8 s since hint 1.
3. after first tap, or +8 s since hint 2.
4. after first lie-down end, or +12 s since hint 3 (then done).
Mark `hints-seen` when hint 4 is dismissed. Skipped entirely on later visits.

## Easter eggs (exact)
- **EE-1:** typing the letters `e x i t` consecutively (buffer of last 4 chars, reset after 2 s idle, ignored when focus is in an input/dialog) → 800 ms fade to the Exit screen (monospace, black → deep green), lines typed: `$ ./grass` / `process exited with code 0` / `[ re-run ]` button → returns to the scene (audio resumes).
- **EE-2:** lie down held for 10 s → one-time (per session) hint `> fatal: no merge conflicts in this meadow.`
- **EE-3:** uptime 03:00 → `> you've been outside 3 minutes. your build is probably fine.`; uptime 10:00 → `> ok. that's a real break. proud of you.` (each once per session).
- **EE-4:** on load `console.info` styled message with ASCII blade (see `copywriting.md`).

## Cursor
Hand states: open (default), moving (rotate = clamp(vx·0.02, ±12°)), pressed (closed fist; also on holding). Cursor position lerps with factor 0.35/frame to feel soft. Hidden for touch/pen; hidden when pointer leaves window.

## Feedback for "unsuccessful" interactions
Pointing at the sky: no brush, cursor stays open. Tapping the sky: nothing (no error). Keys without effect: ignored silently.
