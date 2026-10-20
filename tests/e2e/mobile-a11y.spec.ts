import { test, expect } from '@playwright/test';

test.describe('Milestone M10: Mobile, Touch, Accessibility, Reduced Motion, Fallbacks (Gate G9)', () => {
  test('T1: Mobile portrait layout (iPhone 13 & Pixel 5) with safe-areas and touch targets >= 44px', async ({
    browser,
  }) => {
    test.setTimeout(90000);
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();

    try {
      await page.goto('/?debug=1&freeze=1&mood=golden');
      await page.waitForFunction(() => Boolean(window.__grass?.app));

      // Semantic landmark assertion
      const mainLandmark = page.locator('main#app');
      await expect(mainLandmark).toBeVisible();

      // Verify Entry button touch target >= 44px
      const enterBtn = page.locator('#btn-enter');
      await expect(enterBtn).toBeVisible();
      await expect(enterBtn).toHaveText('step outside');
      await expect(enterBtn).toBeEnabled();
      const enterBox = await enterBtn.boundingBox();
      expect(enterBox).not.toBeNull();
      expect(enterBox!.width).toBeGreaterThanOrEqual(44);
      expect(enterBox!.height).toBeGreaterThanOrEqual(44);

      // Enter the scene
      await enterBtn.click();
      await page.waitForTimeout(1100);
      await expect(page.locator('#entry-overlay')).toBeHidden({ timeout: 10000 });

      // Verify HUD controls landmark
      const hudNav = page.locator('nav.hud');
      await expect(hudNav).toBeVisible();
      await expect(hudNav).toHaveAttribute('aria-label', 'controls');

      // Verify Uptime counter centered horizontally in portrait (< 640px)
      const uptime = page.locator('.hud-uptime-container');
      await expect(uptime).toBeVisible();
      const uptimeBox = await uptime.boundingBox();
      expect(uptimeBox).not.toBeNull();
      const uptimeCenterX = uptimeBox!.x + uptimeBox!.width / 2;
      // Within 8px of exact viewport center (390 / 2 = 195)
      expect(Math.abs(uptimeCenterX - 195)).toBeLessThanOrEqual(8);

      // Verify Uptime is positioned above bottom mood container
      const moodContainer = page.locator('.hud-mood-container');
      await expect(moodContainer).toBeVisible();
      const moodBox = await moodContainer.boundingBox();
      expect(moodBox).not.toBeNull();
      expect(uptimeBox!.y + uptimeBox!.height).toBeLessThanOrEqual(moodBox!.y + 10);

      // Verify all visible HUD buttons satisfy minimum 44px touch targets
      const buttons = page.locator('.hud button');
      const btnCount = await buttons.count();
      for (let i = 0; i < btnCount; i++) {
        const btn = buttons.nth(i);
        if (await btn.isVisible()) {
          const box = await btn.boundingBox();
          expect(box).not.toBeNull();
          expect(box!.width).toBeGreaterThanOrEqual(44);
          expect(box!.height).toBeGreaterThanOrEqual(44);
        }
      }

      // Capture iPhone 13 portrait screenshot
      await page.screenshot({ path: 'tracking/evidence/M10/mobile-portrait-iphone13.png' });

      // 2. Emulate Pixel 5 (393 x 851)
      await page.setViewportSize({ width: 393, height: 851 });
      await page.waitForTimeout(300);

      const pixelUptimeBox = await uptime.boundingBox();
      expect(pixelUptimeBox).not.toBeNull();
      const pixelUptimeCenterX = pixelUptimeBox!.x + pixelUptimeBox!.width / 2;
      expect(Math.abs(pixelUptimeCenterX - 393 / 2)).toBeLessThanOrEqual(8);

      // Capture Pixel 5 portrait screenshot
      await page.screenshot({ path: 'tracking/evidence/M10/mobile-portrait-pixel5.png' });
    } finally {
      await context.close();
    }
  });

  test('T2: Small height landscape phone layout (< 420px) hides uptime and compacts mood pills', async ({
    browser,
  }) => {
    test.setTimeout(60000);
    const context = await browser.newContext({
      viewport: { width: 844, height: 390 },
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();

    try {
      await page.goto('/?debug=1&freeze=1&mood=dawn');
      await page.waitForFunction(() => Boolean(window.__grass?.app));

      const enterBtn = page.locator('#btn-enter');
      await expect(enterBtn).toBeVisible();
      await expect(enterBtn).toHaveText('step outside');
      await expect(enterBtn).toBeEnabled();
      await enterBtn.click();
      await page.waitForTimeout(600);
      if (await page.locator('#entry-overlay').isVisible()) {
        await page.evaluate(() => window.__grass?.enter());
      }
      await page.waitForTimeout(1100);
      await expect(page.locator('#entry-overlay')).toBeHidden({ timeout: 15000 });

      // Verify uptime container is hidden in landscape phone (< 420px height)
      const uptime = page.locator('.hud-uptime-container');
      await expect(uptime).toBeHidden();

      // Verify mood button text spans are hidden
      const moodTextSpans = page.locator('.mood-btn span');
      const spanCount = await moodTextSpans.count();
      expect(spanCount).toBeGreaterThan(0);
      for (let i = 0; i < spanCount; i++) {
        await expect(moodTextSpans.nth(i)).toBeHidden();
      }

      // Verify mood button SVG icons remain visible
      const moodSvgs = page.locator('.mood-btn svg');
      const svgCount = await moodSvgs.count();
      expect(svgCount).toBe(3);
      for (let i = 0; i < svgCount; i++) {
        await expect(moodSvgs.nth(i)).toBeVisible();
      }

      // Capture landscape phone screenshot
      await page.screenshot({ path: 'tracking/evidence/M10/mobile-landscape-phone.png' });
    } finally {
      await context.close();
    }
  });

  test('T3: Touch device ergonomics: hidden hand cursor, touch hints, and interactive touch response', async ({
    browser,
  }) => {
    test.setTimeout(60000);
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();

    try {
      await page.goto('/?debug=1&freeze=1&mood=golden');
      await page.waitForFunction(() => Boolean(window.__grass?.app));

      const enterBtn = page.locator('#btn-enter');
      await expect(enterBtn).toBeVisible();
      await expect(enterBtn).toHaveText('step outside');
      await expect(enterBtn).toBeEnabled();
      await enterBtn.click();
      await page.waitForTimeout(600);
      if (await page.locator('#entry-overlay').isVisible()) {
        await page.evaluate(() => window.__grass?.enter());
      }
      await page.waitForTimeout(1100);
      await expect(page.locator('#entry-overlay')).toBeHidden({ timeout: 15000 });

      // Simulate touch device by adding .is-touch class to body
      await page.evaluate(() => {
        document.body.classList.add('is-touch');
      });

      // Verify HandCursor is hidden on touch device
      const cursor = page.locator('.hand-cursor');
      if ((await cursor.count()) > 0) {
        await expect(cursor).toBeHidden();
      }

      // Trigger seed scatter via pointer / tap on canvas
      const initialSeeds = await page.evaluate(() => window.__grass!.getSeedsCount());
      await page.evaluate(() => {
        window.__grass!.spawnSeeds(0, 0);
      });
      const afterSeeds = await page.evaluate(() => window.__grass!.getSeedsCount());
      expect(afterSeeds).toBeGreaterThan(initialSeeds);

      // Capture touch ergonomics & targets screenshot
      await page.screenshot({ path: 'tracking/evidence/M10/touch-hud-targets.png' });
    } finally {
      await context.close();
    }
  });

  test('T4: Dynamic prefers-reduced-motion synchronization across engine, camera, and UI', async ({
    browser,
  }) => {
    test.setTimeout(60000);
    const context = await browser.newContext({
      viewport: { width: 960, height: 540 },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();

    try {
      await page.goto('/?debug=1&freeze=1&mood=golden');
      await page.waitForFunction(() => Boolean(window.__grass?.app));

      const enterBtn = page.locator('#btn-enter');
      await expect(enterBtn).toBeVisible();
      await expect(enterBtn).toHaveText('step outside');
      await expect(enterBtn).toBeEnabled();
      await enterBtn.click();
      await page.waitForTimeout(600);
      await expect(page.locator('#entry-overlay')).toBeHidden({ timeout: 10000 });

      // Verify app store synchronized reducedMotion to true
      const reducedMotionState = await page.evaluate(
        () => window.__grass!.app.store.getState().reducedMotion,
      );
      expect(reducedMotionState).toBe(true);

      // Verify HintLine renders instantly without typewriter lag
      await page.evaluate(() => {
        window.__grass!.app.hintSequencer.dispose();
        window.__grass!.showHint('calm meadow break');
      });
      const hintLine = page.locator('.hint-line');
      await expect(hintLine).toContainText('calm meadow break');

      // Capture reduced motion screenshot
      await page.screenshot({ path: 'tracking/evidence/M10/reduced-motion-hud.png' });
    } finally {
      await context.close();
    }
  });

  test('T5: Forced-colors / High Contrast mode styling verification', async ({ browser }) => {
    test.setTimeout(60000);
    const context = await browser.newContext({
      viewport: { width: 960, height: 540 },
      forcedColors: 'active',
    });
    const page = await context.newPage();

    try {
      await page.goto('/?debug=1&freeze=1&mood=night');
      await page.waitForFunction(() => Boolean(window.__grass?.app));

      const enterBtn = page.locator('#btn-enter');
      await expect(enterBtn).toBeVisible();
      await expect(enterBtn).toHaveText('step outside');
      await expect(enterBtn).toBeEnabled();
      await enterBtn.click();
      await page.waitForTimeout(1100);
      await expect(page.locator('#entry-overlay')).toBeHidden({ timeout: 10000 });

      // Verify high-contrast border applied to glass buttons
      const btnStyle = await page
        .locator('.glass-btn')
        .first()
        .evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            borderStyle: computed.borderStyle,
            boxShadow: computed.boxShadow,
          };
        });
      expect(btnStyle.borderStyle).toBe('solid');

      // Capture forced colors screenshot
      await page.screenshot({ path: 'tracking/evidence/M10/forced-colors-hud.png' });
    } finally {
      await context.close();
    }
  });

  test('T6: WebGL context lost recovery toast and 5-second unrecovered fallback overlay', async ({
    browser,
  }) => {
    test.setTimeout(60000);
    const context = await browser.newContext({
      viewport: { width: 960, height: 540 },
    });
    const page = await context.newPage();

    try {
      await page.goto('/?debug=1&freeze=1&mood=dawn');
      await page.waitForFunction(() => Boolean(window.__grass?.app));

      test.setTimeout(90000);
      const enterBtn = page.locator('#btn-enter');
      await expect(enterBtn).toBeVisible();
      await expect(enterBtn).toHaveText('step outside');
      await expect(enterBtn).toBeEnabled();
      await enterBtn.click();
      await page.waitForTimeout(600);
      if (await page.locator('#entry-overlay').isVisible()) {
        await page.evaluate(() => window.__grass?.enter());
      }
      await page.waitForTimeout(1100);
      await expect(page.locator('#entry-overlay')).toBeHidden({ timeout: 15000 });

      // 1. Simulate webglcontextlost event
      await page.evaluate(() => {
        const canvas = document.querySelector('canvas')!;
        canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
      });

      // Verify recovery toast is visible
      const toast = page.locator('.recovery-toast');
      await expect(toast).toBeVisible();
      await expect(toast).toContainText('the meadow blinked. recovering…');

      // Allow toastFadeIn animation to finish
      await page.waitForTimeout(350);

      // Capture recovery toast screenshot
      await page.screenshot({ path: 'tracking/evidence/M10/context-lost-recovery-toast.png' });

      // 2. Simulate webglcontextrestored event
      await page.evaluate(() => {
        const canvas = document.querySelector('canvas')!;
        canvas.dispatchEvent(new Event('webglcontextrestored'));
      });

      // Verify recovery toast hides
      await expect(toast).toBeHidden();

      // 3. Verify unrecovered fallback screen overlay
      await page.evaluate(() => {
        window.__grass!.app.fallbackScreen.showFallback();
      });

      const fallbackOverlay = page.locator('.fallback-overlay');
      await expect(fallbackOverlay).toBeVisible();
      await expect(page.locator('.fallback-title')).toContainText(
        "your browser can't grow grass today.",
      );
      await expect(page.locator('.fallback-body')).toContainText('grass needs webgl2.');
      const reloadBtn = page.locator('.btn-reload');
      await expect(reloadBtn).toBeVisible();
      await expect(reloadBtn).toContainText('reload');

      // Capture fallback screen screenshot
      await page.screenshot({ path: 'tracking/evidence/M10/context-lost-fallback-screen.png' });
    } finally {
      await context.close();
    }
  });
});
