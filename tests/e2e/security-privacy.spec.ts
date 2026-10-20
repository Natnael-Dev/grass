import { test, expect } from '@playwright/test';

test.describe('NFR-08 & Security/Privacy Audit', () => {
  test('strictly adheres to same-origin requests with zero external network traffic', async ({
    page,
  }) => {
    const networkRequests: string[] = [];

    // Intercept all requests
    page.on('request', (req) => {
      networkRequests.push(req.url());
    });

    await page.goto('/?debug=1&freeze=1');
    await page.waitForFunction(() => Boolean(window.__grass?.app));

    // Dismiss overlay and interact
    if (await page.locator('#entry-overlay').isVisible()) {
      await page.evaluate(() => window.__grass?.enter());
    }
    await expect(page.locator('#entry-overlay')).toHaveClass(/hidden/, { timeout: 15000 });

    // Step simulation
    await page.evaluate(() => {
      for (let i = 0; i < 20; i++) {
        window.__grass?.step(0.0167);
      }
    });

    expect(networkRequests.length).toBeGreaterThan(0);

    // Verify all requests are 100% same-origin
    const origin = new URL(page.url()).origin;
    for (const reqUrl of networkRequests) {
      expect(reqUrl.startsWith(origin)).toBe(true);
      // Extra verification: no google analytics, cdn, fonts, telemetry
      expect(reqUrl).not.toMatch(/google|analytics|cdn|tracker|telemetry|doubleclick|clarity/i);
    }
  });

  test('zero cookies are ever set by the application', async ({ page, context }) => {
    await page.goto('/?debug=1&freeze=1');
    await page.waitForFunction(() => Boolean(window.__grass?.app));

    // Interact with app
    if (await page.locator('#entry-overlay').isVisible()) {
      await page.evaluate(() => window.__grass?.enter());
    }
    await expect(page.locator('#entry-overlay')).toHaveClass(/hidden/, { timeout: 15000 });

    const cookies = await context.cookies();
    expect(cookies.length).toBe(0);
  });

  test('localStorage only contains strictly whitelisted application keys', async ({ page }) => {
    await page.goto('/?debug=1&freeze=1');
    await page.waitForFunction(() => Boolean(window.__grass?.app));

    // Interact with app to trigger persistence (mood, mute, hints)
    if (await page.locator('#entry-overlay').isVisible()) {
      await page.evaluate(() => window.__grass?.enter());
    }
    await expect(page.locator('#entry-overlay')).toHaveClass(/hidden/, { timeout: 15000 });

    // Toggle mute and change mood to populate storage
    const muteBtn = page.locator('#mute-btn');
    if (await muteBtn.isVisible()) {
      await muteBtn.click();
    }

    const moodGolden = page.locator('button[data-mood="golden"]');
    if (await moodGolden.isVisible()) {
      await moodGolden.click();
    }

    const storedKeys = await page.evaluate(() => Object.keys(window.localStorage));

    const ALLOWED_KEYS = new Set([
      'grass:mood',
      'grass:muted',
      'grass:hints-seen',
      '__grass_test__',
    ]);

    for (const key of storedKeys) {
      expect(ALLOWED_KEYS.has(key)).toBe(true);
    }
  });
});
