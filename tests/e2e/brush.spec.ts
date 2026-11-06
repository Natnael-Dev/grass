import { test, expect } from '@playwright/test';
import fs from 'node:fs';

test.describe('M5 Brush Interaction & Hand Cursor', () => {
  test.setTimeout(60000);

  test('verifies hand cursor DOM states (open, moving, pressed, and sky behaviour)', async ({
    page,
  }) => {
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

    const cursorEl = page.locator('#hand-cursor');
    await expect(cursorEl).toBeAttached();

    // 1. Initial state before mouse movement
    expect(await cursorEl.getAttribute('data-state')).toBe('open');

    // 2. Move pointer onto canvas over ground
    await page.mouse.move(400, 380);
    await page.evaluate(() => window.__grass?.step(0.016));

    const opacity = await cursorEl.evaluate((el) => window.getComputedStyle(el).opacity);
    expect(Number(opacity)).toBeGreaterThan(0);

    // 3. Fast movement over terrain triggers moving state
    await page.mouse.move(550, 380, { steps: 5 });
    await page.evaluate(() => window.__grass?.step(0.016));
    const stateMoving = await cursorEl.getAttribute('data-state');
    expect(stateMoving).toBe('moving');

    // 4. Mouse down triggers pressed fist state
    await page.mouse.down();
    await page.evaluate(() => window.__grass?.step(0.016));
    const statePressed = await cursorEl.getAttribute('data-state');
    expect(statePressed).toBe('pressed');

    await page.mouse.up();
    await page.evaluate(() => window.__grass?.step(0.016));

    // 5. Pointing at sky keeps cursor open
    await page.mouse.move(400, 50, { steps: 5 });
    await page.evaluate(() => window.__grass?.step(0.016));
    const stateSky = await cursorEl.getAttribute('data-state');
    expect(stateSky).toBe('open');

    expect(consoleErrors).toEqual([]);
  });

  test('verifies keyboard virtual brush moving meadow blades via arrow keys', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/?debug=1&freeze=1');
    await page.waitForFunction(() => Boolean(window.__grass?.app));
    await page.evaluate(() => window.__grass?.enter());

    // Press ArrowRight to activate virtual brush
    await page.keyboard.down('ArrowRight');
    // Step loop to advance virtual brush
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.__grass?.step(0.05));
    }
    await page.keyboard.up('ArrowRight');

    const kbActive = await page.evaluate(() => window.__grass?.app.keyboardBrush.isActive);
    expect(kbActive).toBe(true);

    const trailCount = await page.evaluate(() => window.__grass?.app.brushTrail.count);
    expect(trailCount).toBeGreaterThan(0);

    expect(consoleErrors).toEqual([]);
  });

  test('captures sweep and spring-back recovery screenshot sequence (t=0, 0.4, 1.0, 2.0, 3.0s)', async ({
    page,
  }) => {
    test.setTimeout(120000);
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    fs.mkdirSync('tracking/evidence/M5', { recursive: true });

    await page.goto('/?mood=golden&debug=1&freeze=1');
    await page.waitForFunction(() => Boolean(window.__grass?.app));
    await page.evaluate(() => window.__grass?.enter());

    // Step a few frames to settle camera
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.__grass?.step(0.016));
    }

    // 1. Perform a vigorous pointer sweep across foreground meadow
    await page.mouse.move(260, 380);
    await page.evaluate(() => window.__grass?.step(0.016));

    await page.mouse.move(360, 380, { steps: 5 });
    await page.evaluate(() => window.__grass?.step(0.05));

    await page.mouse.move(460, 380, { steps: 5 });
    await page.evaluate(() => window.__grass?.step(0.05));

    await page.mouse.move(560, 380, { steps: 5 });
    await page.evaluate(() => window.__grass?.step(0.05));

    // Verify trail has active points
    const trailCountT0 = await page.evaluate(() => window.__grass?.app.brushTrail.count);
    expect(trailCountT0).toBeGreaterThan(0);

    // Capture t = 0.0s (active push displacement)
    await page.screenshot({ path: 'tracking/evidence/M5/brush-sweep-t0.0s.png' });
    expect(fs.existsSync('tracking/evidence/M5/brush-sweep-t0.0s.png')).toBe(true);

    // 2. Advance by 0.4s to maximum overshoot (using 4x 0.1s steps to respect maxDt)
    for (let i = 0; i < 4; i++) {
      await page.evaluate(() => window.__grass?.step(0.1));
    }
    const responseT04 = await page.evaluate(() => {
      const uTrail = window.__grass?.app.grass.uTrail.value;
      return uTrail && uTrail[0] ? uTrail[0].w : 0;
    });
    // Response should be negative during overshoot
    expect(responseT04).toBeLessThan(0);

    await page.screenshot({ path: 'tracking/evidence/M5/brush-sweep-t0.4s.png' });
    expect(fs.existsSync('tracking/evidence/M5/brush-sweep-t0.4s.png')).toBe(true);

    // 3. Advance by 0.6s to t = 1.0s (settling phase)
    for (let i = 0; i < 6; i++) {
      await page.evaluate(() => window.__grass?.step(0.1));
    }
    await page.screenshot({ path: 'tracking/evidence/M5/brush-sweep-t1.0s.png' });
    expect(fs.existsSync('tracking/evidence/M5/brush-sweep-t1.0s.png')).toBe(true);

    // 4. Advance by 1.0s to t = 2.0s (near-decayed phase)
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => window.__grass?.step(0.1));
    }
    await page.screenshot({ path: 'tracking/evidence/M5/brush-sweep-t2.0s.png' });
    expect(fs.existsSync('tracking/evidence/M5/brush-sweep-t2.0s.png')).toBe(true);

    // 5. Advance by 1.5s to t = 3.5s (fully recovered, age > 2.4s max life)
    for (let i = 0; i < 15; i++) {
      await page.evaluate(() => window.__grass?.step(0.1));
    }
    const trailCountT3 = await page.evaluate(() => window.__grass?.app.brushTrail.count);
    expect(trailCountT3).toBe(0);

    await page.screenshot({ path: 'tracking/evidence/M5/brush-sweep-t3.0s.png' });
    expect(fs.existsSync('tracking/evidence/M5/brush-sweep-t3.0s.png')).toBe(true);

    expect(consoleErrors).toEqual([]);
  });
});
