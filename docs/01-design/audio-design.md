# Audio Design

**Purpose:** procedural audio spec (primary) and optional sample upgrade. **Read in:** M9. Implementation lives in `src/audio/`.

## Rules
- AudioContext is created/resumed **only** inside the entry-button click handler (autoplay policy; also resume on first `touchend` for iOS). No audio before that.
- Master gain default 0.5; mute ramps 300 ms; persisted `grass:muted`.
- `visibilitychange` hidden → `ctx.suspend()`; visible → `ctx.resume()` (if not muted).
- If `AudioContext` is unavailable, hide the sound toggle and continue silently.
- Audio is generated, not downloaded: zero bytes of asset cost.

## Graph
`layers → ambienceBus (lowpass filter, gain) → master (gain) → compressor (light) → destination`. `sfxBus` bypasses the ambience lowpass: `sfx → master`.

## Layers (procedural)
| Layer | Synthesis | Control |
|---|---|---|
| Wind | looping 4 s pink-ish noise buffer → bandpass (f0 420 Hz, Q 0.7); LFO 0.07 Hz modulating cutoff ±160 Hz and gain 0.5–1.0; second layer highpassed 1.2 kHz at low gain for "hiss" | gain = mood.audioWind × (0.6 + 0.4·windStrength) |
| Rustle | short noise grains (60–140 ms) → bandpass 3.2 kHz Q 1.2, random panning ±0.4 | triggered while brushing: rate ∝ speed, max 12 grains/s, gain ∝ strength; none when still |
| Crickets | 3 detuned sine voices 4.1–4.6 kHz, amplitude-modulated by 28 Hz pulses grouped in chirps of 3 every 0.7–1.3 s (randomised), very low gain 0.02–0.035 | gain = mood.audioCrickets |
| Birds | scheduled chirps every 2–7 s: sine sweep 3200→4800 Hz in 70–120 ms with 25 Hz vibrato, 1–3 syllables, random pan | gain = mood.audioBirds; none at night |
| Seed sfx | 140 ms noise "pff" (bandpass 1.8 kHz) + soft sine blip 520→680 Hz 90 ms | on tap |
| Lie-down | ambience lowpass cutoff 18 kHz → 2.2 kHz over 1.1 s and wind gain ×1.25 (cosy, closer); reverse on release | on holdStart/holdEnd |

Mood crossfade uses the same 2.5 s curve on layer gains. Never create nodes per frame; grains/chirps are scheduled with `ctx.currentTime` look-ahead (100 ms) from a lightweight scheduler; cleanup via `onended`.

## Spatial audio
Not used (stereo pan on grains only). Keep it simple.

## M9b (optional) — CC0 sample upgrade
Only if all hold: files are CC0 (license verified and recorded in `public/audio/CREDITS.md` with URL + author), total <= 250 KB, mono ~64 kbps **mp3** (Safari-safe), lazily fetched after entry, procedural layer remains the fallback if fetch/decode fails. Candidates: dawn birdsong loop, night cricket loop. Do not use sources that are not CC0 (e.g. "free to use" licences with restrictions). If nothing suitable is found within 2 attempts, skip M9b, log it, and move on — procedural audio ships.

## Verification
Unit-test the scheduler and gain mapping (pure functions). In Playwright: after clicking entry, `AudioContext.state === 'running'`; toggling mute sets master gain to 0; hidden tab suspends. Audible quality is judged by the human at G8.
