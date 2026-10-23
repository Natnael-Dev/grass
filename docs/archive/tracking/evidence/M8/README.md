# Milestone M8: UI Shell, Hints, Help, Uptime, Easter Eggs, 404 Evidence (Gate G7)

## 1. Overview & Verification Summary

Milestone M8 delivers the entire frontend shell, accessible dialogs, contextual hint sequencing, easter eggs, and static error handling:

- **Copy Single Source of Truth (`src/ui/copy.ts`)**:
  - Full copy tree authored strictly according to `docs/01-design/copywriting.md`.
  - Verified by comprehensive unit tests (`tests/unit/copy.spec.ts`) asserting exact string matching across all moods, hint variations, dialog tables, and easter eggs.
- **Design Tokens & SVG Iconography (`src/ui/styles/tokens.css`, `src/ui/icons.ts`)**:
  - Semantic CSS variables for colors, typography, spacing, elevations, glass panels (`backdrop-filter: blur(12px)`), and motion easing.
  - Custom inline 16×16 / 20×20 SVG icons for sound on/off, dawn, golden, night, and close.
- **Safe Storage Wrapper (`src/core/storage.ts`)**:
  - Graceful wrapper for `localStorage` (`grass:mood`, `grass:muted`, `grass:hints-seen`).
  - Seamless memory store fallback when `localStorage` is disabled or blocked in private/incognito browsing.
- **Entry Overlay (`src/ui/Entry.ts`)**:
  - Wordmark `grass_`, tagline, and accessible button `step outside` (`#btn-enter`).
  - 300 ms debounce for loading state to prevent flash-of-loading on fast devices.
  - Automatic button focus on ready; smooth 900 ms fade transition into meadow on enter.
- **HUD Shell (`src/ui/Hud.ts`)**:
  - 4-corner anchor layout matching `docs/01-design/ui-ux-specification.md`.
  - Top-right: Glass panel containing `(?) how it works` button and `SoundToggle` button.
  - Bottom-center: Pill bar with `MoodSwitch` (dawn, golden, night).
  - Bottom-left: Monospace subtle `Uptime` counter (`uptime outside: mm:ss`), paused when tab is hidden.
  - Auto-dimming: HUD fades smoothly to 30% opacity after 4 s of scene interaction and restores to 100% on pointer hover or header interaction.
- **Contextual HintLine & First-Visit Sequencer (`src/ui/HintLine.ts`, `src/ui/HintSequencer.ts`)**:
  - Accessible live region at $y \approx 16\%$ with `role="status"` and `aria-live="polite"`.
  - 28 ms/char typed text effect with elapsed-time catchup; instantaneous rendering when `prefers-reduced-motion` is active.
  - First-visit state machine: Hint 1 (+1.5 s after entry) $\rightarrow$ Hint 2 (brush $\ge 600\text{ px}$ or +8 s) $\rightarrow$ Hint 3 (tap or +8 s) $\rightarrow$ Hint 4 (lie-down end or +12 s). Automatically sets `grass:hints-seen` on completion to suppress on returning visits.
- **"How It Works" Modal Dialog (`src/ui/HowItWorks.ts`)**:
  - Accessible modal dialog (`role="dialog"`, `aria-modal="true"`, `aria-labelledby="how-it-works-title"`).
  - Background inerting of canvas and HUD.
  - Complete focus trap with tab loop and Escape key dismiss.
- **Easter Eggs & Terminal Exit Screen (`src/easter/eggs.ts`, `src/ui/ExitScreen.ts`)**:
  - **EE-1**: Typing sequence `exit` triggers terminal screen `$ ./grass \n process exited with code 0` with `[ re-run ]` button.
  - **EE-2**: Holding lie-down for $\ge 10.0\text{ s}$ displays `> fatal: no merge conflicts in this meadow.`.
  - **EE-3**: Reaching 3 min uptime displays `> you've been outside 3 minutes. your build is probably fine.`; 10 min displays `> ok. that's a real break. proud of you.`.
  - **EE-4**: DevTools console greeting with stylized ASCII grass blades.
- **Static 404 Page (`404.html`)**:
  - Standalone HTML page with zero external CSS/JS dependencies using the shared design tokens.
  - Monospace headline `404: grass not found`, body copy, and button returning to meadow `/`.

---

## 2. Automated Test Results

### Unit Tests (`npm test`)

```text
 RUN  v3.2.7 C:/Users/HP/OneDrive/Desktop/Grass

 ✓ tests/unit/prng.test.ts (8 tests) 31ms
 ✓ tests/unit/gesture-classifier.test.ts (11 tests) 17ms
 ✓ tests/unit/noise.test.ts (3 tests) 27ms
 ✓ tests/unit/Entry.spec.ts (4 tests) 21ms
 ✓ tests/unit/eggs.spec.ts (6 tests) 22ms
 ✓ tests/unit/pointer.test.ts (7 tests) 12ms
 ✓ tests/unit/HintSequencer.spec.ts (6 tests) 25ms
 ✓ tests/unit/app.test.ts (5 tests) 15ms
 ✓ tests/unit/camera.test.ts (10 tests) 23ms
 ✓ tests/unit/fireflies.test.ts (5 tests) 32ms
 ✓ tests/unit/seeds.test.ts (7 tests) 34ms
 ✓ tests/unit/hud.spec.ts (5 tests) 23ms
 ✓ tests/unit/world-render.test.ts (4 tests) 147ms
 ✓ tests/unit/copy.spec.ts (7 tests) 12ms
 ✓ tests/unit/grass-generator.test.ts (4 tests) 589ms
 ✓ tests/unit/math.test.ts (12 tests) 12ms
 ✓ tests/unit/grass-system.test.ts (3 tests) 602ms
 ✓ tests/unit/ground-raycaster.test.ts (5 tests) 14ms
 ✓ tests/unit/brush-trail.test.ts (13 tests) 12ms
 ✓ tests/unit/hand-cursor.test.ts (7 tests) 13ms
 ✓ tests/unit/mood-controller.test.ts (4 tests) 15ms
 ✓ tests/unit/moods.test.ts (7 tests) 14ms
 ✓ tests/unit/vignette.test.ts (4 tests) 12ms
 ✓ tests/unit/HowItWorks.spec.ts (3 tests) 12ms
 ✓ tests/unit/grass-geometry.test.ts (3 tests) 10ms
 ✓ tests/unit/terrain.test.ts (6 tests) 11ms
 ✓ tests/unit/loop.test.ts (5 tests) 7ms
 ✓ tests/unit/storage.spec.ts (4 tests) 7ms
 ✓ tests/unit/icons.spec.ts (2 tests) 6ms

 Test Files  29 passed (29)
      Tests  170 passed (170)
   Duration  2.29s
```

### E2E Playwright Suite (`npx playwright test tests/e2e/ui-shell.spec.ts`)

```text
Running 5 tests using 1 worker

  ok 1 [chromium] › tests\e2e\ui-shell.spec.ts:4:3 › Milestone M8: UI Shell, Hints, Help, Uptime, Easter Eggs, 404 (Gate G7) › J1: First visit desktop golden path (entry, hud, hints, modal, exit screen) (1.1m)
  ok 2 [chromium] › tests\e2e\ui-shell.spec.ts:84:3 › Milestone M8: UI Shell, Hints, Help, Uptime, Easter Eggs, 404 (Gate G7) › J2: Returning visit restores mood, mute, and suppresses hints (32.6s)
  ok 3 [chromium] › tests\e2e\ui-shell.spec.ts:118:3 › Milestone M8: UI Shell, Hints, Help, Uptime, Easter Eggs, 404 (Gate G7) › J4: Keyboard-only navigation, shortcuts, and dialog focus trap (22.5s)
  ok 4 [chromium] › tests\e2e\ui-shell.spec.ts:163:3 › Milestone M8: UI Shell, Hints, Help, Uptime, Easter Eggs, 404 (Gate G7) › Easter Eggs EE-2 and EE-3 trigger expected hints (9.1s)
  ok 5 [chromium] › tests\e2e\ui-shell.spec.ts:197:3 › Milestone M8: UI Shell, Hints, Help, Uptime, Easter Eggs, 404 (Gate G7) › Static 404 page renders properly with links and tokens (9.5s)

  5 passed (2.4m)
```

### Full Quality Check Suite (`npm run check`)

- **ESLint**: 0 warnings, 0 errors
- **TypeScript (`tsc --noEmit`)**: 0 errors
- **Vitest**: 170 passed (29 test files)
- **Vite Build**: Built cleanly with multi-page entries (`index.html` + `404.html`)
- **Bundle Gzip Size**:
  - `main.css`: 1.02 KB
  - `main.js`: 160.62 KB (Budget: 300 KB) — **PASSED**
  - Total bundle gzip: 161.64 KB (Budget: 500 KB) — **PASSED**

---

## 3. Visual Review of Screenshot Evidence

| Screenshot File           | State & Description                                                                                                             |
| :------------------------ | :------------------------------------------------------------------------------------------------------------------------------ |
| `entry-screen.png`        | Centered `grass_` wordmark, tagline, and focused `step outside` button over preview meadow.                                     |
| `hud-active.png`          | Full HUD shell active in golden mood: 4-corner anchor layout, mood switch pills, uptime counter, sound toggle, and help button. |
| `hint-active.png`         | Floating glass panel hint line at $y \approx 16\%$ with monospace typed guidance and 30% HUD interaction dimming.               |
| `dialog-how-it-works.png` | Accessible modal dialog with darkened scrim, controls reference table, and Q&A section.                                         |
| `exit-screen.png`         | Retro terminal exit screen with `$ ./grass` and `process exited with code 0` and interactive `[ re-run ]` action.               |
| `404-page.png`            | Static error page with `404: grass not found` and link back to meadow `/`.                                                      |

---

## 4. Gate G7 Checklist

- [x] Copy tree in `src/ui/copy.ts` matches `docs/01-design/copywriting.md` exactly.
- [x] Design tokens in `src/ui/styles/tokens.css` establish dark mood-compatible glass panels and type scale.
- [x] Safe storage wrapper tested with both real storage and simulated throwing private browsing mode.
- [x] Entry overlay with 300 ms debounce, 900 ms fade, and keyboard access verified.
- [x] HUD shell with 4-corner layout, 4 s auto-dimming to 30%, and uptime counter verified.
- [x] HintLine typed effect at 28 ms/char with live region and sequencer verified via fake clocks.
- [x] HowItWorks dialog focus trap, keyboard Escape, and WAI-ARIA attributes verified.
- [x] Easter eggs EE-1 (`exit`), EE-2 (10 s hold), EE-3 (uptime 3 min/10 min), and EE-4 (console) verified.
- [x] Static `404.html` bundled into build output and tested via E2E.
- [x] E2E Playwright test journeys J1, J2, and J4 all passing.
- [x] Visual screenshots for every UI state verified in `tracking/evidence/M8/`.
- [x] All 170 unit tests pass; `npm run check` clean with zero errors.
