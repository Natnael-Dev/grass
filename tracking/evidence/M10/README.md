# Milestone M10 Verification Evidence (Gate G9)

**Milestone:** M10 — Mobile, Touch, Accessibility, Reduced Motion, Fallbacks (Gate G9)  
**Requirements:** FR-14, FR-15, NFR-05  
**Date:** 2026-10-20  
**Branch:** `feat/m10-mobile-a11y-fallbacks`

---

## 1. Summary of Deliverables & Requirements Verified

1. **FR-14: Mobile, Touch, Accessibility & Reduced Motion Support**

   - **Viewport & Safe Areas:** Removed `user-scalable=no`, preserved `viewport-fit=cover`. App styled with dynamic `100dvh` and safe-area insets (`env(safe-area-inset-top)`, etc.).
   - **Semantic Landmarks:** Converted `#app` container to `<main id="app">` and HUD shell to `<nav class="hud" aria-label="controls">`.
   - **Portrait (< 640px) Responsive Rules:** Uptime counter centers horizontally above mood pills (`Math.abs(centerX - 195) <= 8px`), mood pills maintain centered bottom layout with touch targets $\ge 44\text{ px}$.
   - **Landscape Phone (< 420px height) Responsive Rules:** Uptime counter hides automatically (`display: none`), mood buttons shrink to icon-only buttons (`display: none` on text spans, icons preserved) to maximize view of the serene meadow.
   - **Touch Targets:** All interactive touch targets (`.glass-btn`, `.btn-enter`, `.mood-btn`, sound toggle, help button) satisfy $\ge 44\text{ px} \times 44\text{ px}$ minimum bounding dimensions on coarse/touch screens.
   - **Touch Heuristics:** Hand cursor hides automatically when touch or pen input is active (`display: none !important`), touch devices default to `medium` quality tier (45k blades), contextual touch hints (`> drag a finger across the grass.`, `> tap to scatter seeds.`, `> press and hold to lie down. you've earned it.`).
   - **Reduced Motion (`prefers-reduced-motion: reduce`):** Dynamic live synchronization via `matchMedia('(prefers-reduced-motion: reduce)')` change listener. Shaders attenuate wind by $\times 0.35$ (`uReduced`), fireflies maintain steady glow (no blinking, $\times 0.3$ drift), camera rig disables parallax and idle drift, mood crossfade shortens to 1.0 s, hint typewriter effect displays text instantly.
   - **High Contrast / Forced Colors (`@media (forced-colors: active)`):** System colors (`Canvas`, `CanvasText`, `ButtonBorder`, `Highlight`), crisp high-contrast solid borders and high-visibility focus outlines.

2. **FR-15: WebGL Fallback Screen & Context Lost Recovery**

   - **Context Loss Recovery:** Prevents default browser handling on `webglcontextlost` to enable recovery. Pauses render loop and immediately surfaces pill toast: `the meadow blinked. recovering…`.
   - **Context Restored:** Seamlessly cleans up toast and resumes render loop on `webglcontextrestored`.
   - **5-Second Fallback Overlay:** If context is not restored within 5.0 seconds, transitions to full centered fallback overlay with title `your browser can't grow grass today.`, explanation, and working `reload` action button.

3. **NFR-05: WCAG 2.1 AA Color Contrast Verification**
   - Script `scripts/check-contrast.mjs` verifies relative luminance and contrast ratio for all 10 UI text and panel combinations across Dawn, Golden Horizon, and Night moods. All pairs pass $\ge 4.5:1$ minimum.

---

## 2. Automated Test Results & Empirical Output

### A. Full Verification Suite (`npm run check`)

```
> grass@0.1.0 check
> npm run lint && npm run typecheck && npm run test && npm run build && npm run size && npm run contrast

> grass@0.1.0 lint
> eslint . --max-warnings 0

> grass@0.1.0 typecheck
> tsc --noEmit

> grass@0.1.0 test
> vitest run

 Test Files  36 passed (36)
      Tests  207 passed (207)

> grass@0.1.0 build
> tsc --noEmit && vite build
✓ built in 3.23s
dist/assets/main-BCyc6noi.css    5.96 kB │ gzip:   1.84 kB
dist/assets/main-0WQgTz40.js   667.57 kB │ gzip: 169.37 kB

> grass@0.1.0 size
> node scripts/check-size.mjs
Asset Gzip Size Check:
- main-0WQgTz40.js: raw 651.92 KB -> gzip 165.40 KB
- main-BCyc6noi.css: raw 5.82 KB -> gzip 1.80 KB
Total bundle gzip: 167.20 KB (budget: 500 KB)
Largest JS file (main-0WQgTz40.js): 165.40 KB (budget: 300 KB)
Size check PASSED.

> grass@0.1.0 contrast
> node scripts/check-contrast.mjs
=== WCAG 2.1 AA Contrast Verification ===
✓ accent-ink on accent button                  : 13.24:1 (min: 4.5:1)
✓ --text on glass panel (dawn horizon)         : 5.94:1 (min: 4.5:1)
✓ --text on solid panel (dawn horizon)         : 11.82:1 (min: 4.5:1)
✓ --text-muted on solid panel (dawn horizon)   : 8.37:1 (min: 4.5:1)
✓ --text on glass panel (golden horizon)       : 5.15:1 (min: 4.5:1)
✓ --text on solid panel (golden horizon)       : 11.08:1 (min: 4.5:1)
✓ --text-muted on solid panel (golden horizon) : 7.84:1 (min: 4.5:1)
✓ --text on glass panel (night horizon)        : 16.32:1 (min: 4.5:1)
✓ --text on solid panel (night horizon)        : 16.75:1 (min: 4.5:1)
✓ --text-muted on solid panel (night horizon)  : 11.86:1 (min: 4.5:1)

All contrast checks PASSED (>= 4.5:1).
```

### B. Playwright Mobile & A11y E2E Suite (`tests/e2e/mobile-a11y.spec.ts`)

```
Running 6 tests using 1 worker

  ok 1 [chromium] › tests/e2e/mobile-a11y.spec.ts:4:3 › Milestone M10: Mobile, Touch, Accessibility, Reduced Motion, Fallbacks (Gate G9) › T1: Mobile portrait layout (iPhone 13 & Pixel 5) with safe-areas and touch targets >= 44px (28.8s)
  ok 2 [chromium] › tests/e2e/mobile-a11y.spec.ts:91:3 › Milestone M10: Mobile, Touch, Accessibility, Reduced Motion, Fallbacks (Gate G9) › T2: Small height landscape phone layout (< 420px) hides uptime and compacts mood pills (30.3s)
  ok 3 [chromium] › tests/e2e/mobile-a11y.spec.ts:145:3 › Milestone M10: Mobile, Touch, Accessibility, Reduced Motion, Fallbacks (Gate G9) › T3: Touch device ergonomics: hidden hand cursor, touch hints, and interactive touch response (32.8s)
  ok 4 [chromium] › tests/e2e/mobile-a11y.spec.ts:198:3 › Milestone M10: Mobile, Touch, Accessibility, Reduced Motion, Fallbacks (Gate G9) › T4: Dynamic prefers-reduced-motion synchronization across engine, camera, and UI (34.3s)
  ok 5 [chromium] › tests/e2e/mobile-a11y.spec.ts:241:3 › Milestone M10: Mobile, Touch, Accessibility, Reduced Motion, Fallbacks (Gate G9) › T5: Forced-colors / High Contrast mode styling verification (23.1s)
  ok 6 [chromium] › tests/e2e/mobile-a11y.spec.ts:278:3 › Milestone M10: Mobile, Touch, Accessibility, Reduced Motion, Fallbacks (Gate G9) › T6: WebGL context lost recovery toast and 5-second unrecovered fallback overlay (38.8s)

  6 passed (3.3m)
```

---

## 3. Visual Evidence Gallery

| Evidence Screenshot                | Description                                                                                     |
| :--------------------------------- | :---------------------------------------------------------------------------------------------- |
| `mobile-portrait-iphone13.png`     | iPhone 13 (390×844) portrait meadow with centered uptime counter and $\ge 44\text{ px}$ targets |
| `mobile-portrait-pixel5.png`       | Pixel 5 (393×851) portrait meadow with centered uptime counter and responsive HUD               |
| `mobile-landscape-phone.png`       | Small height landscape phone (844×390) with hidden uptime and icon-only mood pills              |
| `touch-hud-targets.png`            | Touch device ergonomics: hidden cursor, touch hints, and interactive touch response             |
| `reduced-motion-hud.png`           | Reduced motion mode: zero camera sway, steady fireflies, instant typewriter text rendering      |
| `forced-colors-hud.png`            | High contrast forced-colors mode: solid system borders, high-visibility contrast styling        |
| `context-lost-recovery-toast.png`  | WebGL context lost recovery toast: `"the meadow blinked. recovering…"`                          |
| `context-lost-fallback-screen.png` | WebGL unrecovered fallback overlay: `"your browser can't grow grass today."` + reload button    |

---

## 4. Gate G9 Verification Status

- [x] Responsive layout rules, safe areas, and semantic landmarks active in DOM.
- [x] Touch detection, touch target sizing ($\ge 44\text{ px}$), and touch hints operational.
- [x] Dynamic reduced motion listener and shader/engine attenuation verified.
- [x] High contrast / forced colors system styling verified.
- [x] WebGL context loss recovery toast and 5.0 s fallback dialog operational.
- [x] WCAG 2.1 AA color contrast verification script passed (all 10 pairs $\ge 4.5:1$).
- [x] All 36 unit test files passed (207 tests total).
- [x] All 6 mobile & accessibility E2E tests passed.
- [x] Bundle budget satisfied (167.20 KB gzip vs 500 KB limit).
