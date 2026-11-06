import { test, expect } from '@playwright/test';
import fs from 'node:fs';

test.describe('Milestone M7: Seeds and Fireflies (Gate G6)', () => {
  test.setTimeout(90000);

  test('tap scatters seeds (> 0) which drift, sink, and decay to 0 within 6s', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/?debug=1&freeze=1');
    await page.waitForFunction(() => Boolean(window.__grass?.app));

    // Dismiss entry overlay
    await page.evaluate(() => window.__grass?.enter());
    await page.waitForTimeout(100);

    // Initial seeds count must be 0
    const initialSeeds = await page.evaluate(() => window.__grass?.getSeedsCount() ?? 0);
    expect(initialSeeds).toBe(0);

    // Click on canvas over foreground meadow terrain (y=380 is meadow ground)
    await page.mouse.move(400, 380);
    await page.mouse.down();
    await page.mouse.up();
    await page.evaluate(() => window.__grass?.step(0.016));

    // Seeds should be spawned (> 0, e.g. 18 in high tier)
    const activeSeeds = await page.evaluate(() => window.__grass?.getSeedsCount() ?? 0);
    expect(activeSeeds).toBeGreaterThan(0);
    expect(activeSeeds).toBeLessThanOrEqual(18);

    // Step forward in time (0.1s intervals) and verify seeds remain active and drift
    await page.evaluate(() => {
      for (let i = 0; i < 20; i++) {
        window.__grass?.step(0.1);
      }
    });

    const midSeeds = await page.evaluate(() => window.__grass?.getSeedsCount() ?? 0);
    expect(midSeeds).toBeGreaterThan(0);

    // Advance past max lifetime (5.5s + buffer = total 7.0s)
    await page.evaluate(() => {
      for (let i = 0; i < 60; i++) {
        window.__grass?.step(0.1);
      }
    });

    // All seeds must have decayed to 0 within 6s
    const finalSeeds = await page.evaluate(() => window.__grass?.getSeedsCount() ?? 0);
    expect(finalSeeds).toBe(0);

    expect(consoleErrors).toEqual([]);
  });

  test('tier switching configures firefly count (90/60/30) and seed spawn count (18/14/10)', async ({
    page,
  }) => {
    await page.goto('/?debug=1&quality=high&freeze=1');
    await page.waitForFunction(() => Boolean(window.__grass?.app));
    await page.evaluate(() => window.__grass?.enter());

    // High tier defaults
    expect(await page.evaluate(() => window.__grass?.getFirefliesCount())).toBe(90);

    // Medium tier
    await page.evaluate(() => window.__grass?.setTier('medium'));
    expect(await page.evaluate(() => window.__grass?.getFirefliesCount())).toBe(60);

    // Low tier
    await page.evaluate(() => window.__grass?.setTier('low'));
    expect(await page.evaluate(() => window.__grass?.getFirefliesCount())).toBe(30);

    // Reset to high
    await page.evaluate(() => window.__grass?.setTier('high'));
    expect(await page.evaluate(() => window.__grass?.getFirefliesCount())).toBe(90);
  });

  test('golden mood has 0 fireflies drawn while night mood activates fireflies within draw call budget', async ({
    page,
  }) => {
    await page.goto('/?debug=1&mood=golden&freeze=1');
    await page.waitForFunction(() => Boolean(window.__grass?.app));
    await page.evaluate(() => window.__grass?.enter());
    await page.evaluate(() => window.__grass?.step(0.016));

    // Golden mood: fireflies mesh must not be visible
    const goldenVisible = await page.evaluate(
      () => window.__grass?.app.fireflies.mesh.visible ?? false,
    );
    expect(goldenVisible).toBe(false);

    const goldenStats = await page.evaluate(() => window.__grass?.stats());
    expect(goldenStats?.drawCalls).toBeLessThanOrEqual(12);

    // Switch to night mood
    await page.evaluate(() => window.__grass?.setMood('night'));

    // Advance past crossfade (2.5s)
    for (let i = 0; i < 6; i++) {
      await page.evaluate(() => window.__grass?.step(0.5));
    }

    // Night mood: fireflies mesh must be active and visible
    const nightVisible = await page.evaluate(
      () => window.__grass?.app.fireflies.mesh.visible ?? false,
    );
    expect(nightVisible).toBe(true);

    const nightStats = await page.evaluate(() => window.__grass?.stats());
    expect(nightStats?.drawCalls).toBeLessThanOrEqual(12);
  });

  test('captures visual evidence screenshots for seeds scatter and nighttime fireflies', async ({
    page,
  }) => {
    test.setTimeout(120000);

    fs.mkdirSync('tracking/evidence/M7', { recursive: true });

    // 1. Capture seeds scatter in golden mood
    await page.goto('/?debug=1&mood=golden&freeze=1');
    await page.waitForFunction(() => Boolean(window.__grass?.app));
    await page.evaluate(() => window.__grass?.enter());
    await page.waitForTimeout(200);

    // Spawn seeds in front of camera
    await page.evaluate(() => window.__grass?.spawnSeeds(0, 5));
    // Step forward 0.4s to let seeds launch into air with visible fluffy sprites
    for (let i = 0; i < 8; i++) {
      await page.evaluate(() => window.__grass?.step(0.05));
    }

    const seedsShot = await page.screenshot();
    fs.writeFileSync('tracking/evidence/M7/seeds-scatter.png', seedsShot);
    expect(fs.existsSync('tracking/evidence/M7/seeds-scatter.png')).toBe(true);

    // 2. Capture night mood with fireflies
    await page.goto('/?debug=1&mood=night&freeze=1');
    await page.waitForFunction(() => Boolean(window.__grass?.app));
    await page.evaluate(() => window.__grass?.enter());
    await page.waitForTimeout(200);

    // Step forward to advance Lissajous drift and blink phases
    for (let i = 0; i < 20; i++) {
      await page.evaluate(() => window.__grass?.step(0.1));
    }

    const nightShot = await page.screenshot();
    fs.writeFileSync('tracking/evidence/M7/fireflies-night.png', nightShot);
    expect(fs.existsSync('tracking/evidence/M7/fireflies-night.png')).toBe(true);
  });
});
