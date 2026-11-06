# Milestone M9: Procedural Audio Engine Evidence (Gate G8)

## 1. Overview & Verification Summary

Milestone M9 delivers the complete, procedural Web Audio engine for _Grass_ conforming strictly to `docs/04-audio/audio-design.md`, FR-10, and modern browser autoplay policies:

- **Autoplay Compliance & Lifecycle (`src/audio/AudioEngine.ts`)**:
  - `AudioContext` is created/unlocked **strictly** on user entry interaction (clicking `#btn-enter` or pressing Enter). Zero audio runs beforehand.
  - Automatically resumes on mobile touch (`pointerdown`) if not already unlocked.
  - If `AudioContext` is unsupported or blocked, the app continues silently with zero errors and hides the HUD sound toggle button.
  - Page visibility handling: `visibilitychange` hidden suspends `AudioContext` (`ctx.suspend()`), and visible resumes it (`ctx.resume()`) if unmuted.
- **Audio Routing Graph Topology**:
  - `layers → ambienceBus (18 kHz lowpass filter, gain) → masterGain → compressor → destination`
  - `sfxBus → masterGain` (bypasses ambience lowpass filter)
  - `compressor`: Light `DynamicsCompressorNode` (threshold -12 dB, knee 10 dB, ratio 3, attack 0.01s, release 0.25s) to guarantee zero clipping or distortion.
  - Master gain default: 0.5; mute toggle linearly ramps gain between 0 and 0.5 over 300 ms (`AudioEngine.MUTE_RAMP_DURATION = 0.3`). Persisted across sessions via `localStorage` (`grass:muted`).
- **Procedural Ambient Layers (`src/audio/`)**:
  - **Wind (`Wind.ts`)**: Looping 4 s pink-noise AudioBuffer generated procedurally using 5-pole Paul Kellet filter + 420 Hz bandpass filter ($Q = 0.7$) + 0.07 Hz LFO modulating cutoff $\pm 160\text{ Hz}$ and amplitude + 1.2 kHz highpass hiss layer. Formula: $\text{gain} = \text{mood.audio.wind} \times (0.6 + 0.4 \times \text{windStrength}) \times (\text{isLying} ? 1.25 : 1.0)$.
  - **Rustle (`Rustle.ts`)**: Brush-driven short noise grains (60–140 ms) bandpass filtered at 3.2 kHz ($Q = 1.2$) with random stereo panning $\pm 0.4$. Rate proportional to brush speed ($\le 12\text{ grains/s}$ max), gain proportional to strength. Zero grains when stationary.
  - **Crickets (`Crickets.ts`)**: 3 detuned sine oscillators (4.1 kHz, 4.35 kHz, 4.6 kHz) with 28 Hz amplitude modulation grouped into chirps. Master layer gain $= \text{mood.audio.crickets} \times 0.03$ (night: 0.9, golden: 0, dawn: 0).
  - **Birds (`Birds.ts`)**: Scheduled chirps every 2–7 s: sine sweep 3200 $\rightarrow$ 4800 Hz in 70–120 ms with 25 Hz vibrato ($\pm 60\text{ Hz}$), 1–3 syllables per sequence, random stereo panning $\pm 0.6$. Master layer gain $= \text{mood.audio.birds} \times 0.06$ (dawn: 0.9, golden: 0.6, night: 0).
- **Procedural Sound Effects (`src/audio/Sfx.ts`)**:
  - Seed scatter effect: 140 ms noise "pff" (1.8 kHz bandpass, $Q = 1.0$) + 90 ms soft sine blip (520 $\rightarrow$ 680 Hz pitch sweep) routed directly to `sfxBus`.
- **Lie-Down Ambience Filter**:
  - Ambience lowpass cutoff ramps from 18 kHz $\rightarrow$ 2.2 kHz over 1.1 s, and wind gain multiplies by 1.25x (muffled, closer, cosy meadow perspective).
  - On release, smoothly ramps back to 18 kHz and 1.0x over 1.1 s.

---

## 2. Automated Test Results

### Vitest Unit Tests (`npm test`)

```text
 RUN  v3.2.7 C:/Users/HP/OneDrive/Desktop/Grass

 ✓ tests/unit/audio-engine.spec.ts (7 tests) 35ms
 ✓ tests/unit/prng.test.ts (8 tests) 43ms
 ✓ tests/unit/Entry.spec.ts (4 tests) 18ms
 ✓ tests/unit/gesture-classifier.test.ts (11 tests) 18ms
 ✓ tests/unit/eggs.spec.ts (6 tests) 22ms
 ✓ tests/unit/noise.test.ts (3 tests) 25ms
 ✓ tests/unit/HintSequencer.spec.ts (6 tests) 24ms
 ✓ tests/unit/camera.test.ts (10 tests) 23ms
 ✓ tests/unit/fireflies.test.ts (5 tests) 30ms
 ✓ tests/unit/seeds.test.ts (7 tests) 35ms
 ✓ tests/unit/audio-layers.spec.ts (7 tests) 47ms
 ✓ tests/unit/hud.spec.ts (5 tests) 22ms
 ✓ tests/unit/world-render.test.ts (4 tests) 143ms
 ✓ tests/unit/grass-generator.test.ts (4 tests) 564ms
 ✓ tests/unit/audio-math.spec.ts (6 tests) 19ms
 ✓ tests/unit/grass-system.test.ts (3 tests) 570ms
 ✓ tests/unit/pointer.test.ts (7 tests) 12ms
 ✓ tests/unit/ground-raycaster.test.ts (5 tests) 13ms
 ✓ tests/unit/math.test.ts (12 tests) 11ms
 ✓ tests/unit/brush-trail.test.ts (13 tests) 11ms
 ✓ tests/unit/moods.test.ts (7 tests) 12ms
 ✓ tests/unit/app.test.ts (5 tests) 13ms
 ✓ tests/unit/hand-cursor.test.ts (7 tests) 17ms
 ✓ tests/unit/mood-controller.test.ts (4 tests) 15ms
 ✓ tests/unit/copy.spec.ts (7 tests) 12ms
 ✓ tests/unit/sfx.spec.ts (1 test) 11ms
 ✓ tests/unit/terrain.test.ts (6 tests) 9ms
 ✓ tests/unit/vignette.test.ts (4 tests) 10ms
 ✓ tests/unit/HowItWorks.spec.ts (3 tests) 11ms
 ✓ tests/unit/loop.test.ts (5 tests) 8ms
 ✓ tests/unit/grass-geometry.test.ts (3 tests) 10ms
 ✓ tests/unit/storage.spec.ts (4 tests) 7ms
 ✓ tests/unit/icons.spec.ts (2 tests) 6ms

 Test Files  33 passed (33)
      Tests  191 passed (191)
   Duration  2.86s
```

### E2E Playwright Suite (`npx playwright test tests/e2e/audio.spec.ts`)

```text
Running 1 test using 1 worker

  ok 1 [chromium] › tests\e2e\audio.spec.ts:4:3 › Milestone M9: Procedural Audio Engine (Gate G8) › E2E Audio Engine: unlock, mute toggle, visibility, mood transitions, lie-down, sfx (56.4s)

  1 passed (1.1m)
```

### Full Quality Check Suite (`npm run check`)

- **ESLint**: 0 warnings, 0 errors
- **TypeScript (`tsc --noEmit`)**: 0 errors
- **Vitest**: 191 passed (33 test files)
- **Vite Build**: Multi-page production build in 2.33s
- **Bundle Gzip Size**:
  - `main.css`: 1.02 KB
  - `main.js`: 164.03 KB (Budget: 300 KB) — **PASSED**
  - Total bundle gzip: 165.05 KB (Budget: 500 KB) — **PASSED**

---

## 3. Visual Review of Screenshot Evidence

| Screenshot File            | State & Description                                                                                         |
| :------------------------- | :---------------------------------------------------------------------------------------------------------- |
| `sound-active.png`         | Sound active in HUD with `aria-pressed="true"` and `soundOn` icon.                                          |
| `sound-muted.png`          | Sound muted in HUD with `aria-pressed="false"` and `soundOff` icon after toggle button click.               |
| `audio-lie-down.png`       | Lie-down mode active: camera descended, 2.2 kHz lowpass filter engaged, wind gain scaled by 1.25x.          |
| `audio-night-crickets.png` | Night mood: stars and fireflies visible, cricket oscillators active with 28 Hz AM modulation at gain 0.027. |

---

## 4. Gate G8 Checklist

- [x] AudioContext strictly unlocked on user gesture (`#btn-enter` click or Enter key); silent beforehand.
- [x] Fallback graceful degradation for environments without Web Audio API.
- [x] Ambience bus and SFX bus separate; SFX bypasses ambience lowpass filter.
- [x] Master gain defaults to 0.5; mute toggle linearly ramps between 0 and 0.5 over 300 ms.
- [x] Master compressor prevents any clipping or distortion.
- [x] Tab visibility change suspends and resumes AudioContext.
- [x] Wind procedural layer uses pink-noise AudioBuffer with 420 Hz bandpass, 0.07 Hz LFO, and 1.2 kHz highpass hiss.
- [x] Rustle procedural layer spawns 60–140 ms bandpassed grains at 3.2 kHz with stereo pan, capped at 12 grains/s.
- [x] Crickets layer uses 3 detuned sine voices (4.1, 4.35, 4.6 kHz) with 28 Hz AM pulse, active at night.
- [x] Birds layer schedules procedural chirps with 25 Hz vibrato and pitch sweeps during dawn and golden moods.
- [x] Seed scatter SFX plays 140 ms noise puff + 90 ms sine blip on seed spawn.
- [x] Lie-down smoothly ramps ambience lowpass filter from 18 kHz to 2.2 kHz and boosts wind gain by 1.25x.
- [x] Vitest unit test suite with Web Audio mocks (191 tests across 33 files) all passing.
- [x] Automated Playwright E2E test verifying unlock, mute, visibility, moods, lie-down, and SFX passing.
- [x] Bundle size: 165.05 KB gzip (budget 500 KB), JS 164.03 KB gzip (budget 300 KB).
