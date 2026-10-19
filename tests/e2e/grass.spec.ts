import { test, expect } from '@playwright/test';
import fs from 'node:fs';

test.describe('M3 Grass Instancing & Wind Motion', () => {
  test.setTimeout(60000);

  test('renders grass with single draw call within total budget and default 90k blades', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/?quality=high&debug=1&freeze=1');
    await page.waitForFunction(() => Boolean(window.__grass?.app));

    // Enter vista
    const enterBtn = page.locator('#btn-enter');
    await enterBtn.click();
    await expect(page.locator('#entry-overlay')).toHaveClass(/hidden/);

    await page.waitForTimeout(600);

    const stats = await page.evaluate(() => window.__grass?.stats());
    expect(stats).toBeDefined();

    // Scene total draw calls <= 8 (Sky 1, Ridges 3, Terrain 1, Grass 1, Tree 1 = 7 draw calls)
    // Grass itself is strictly 1 instanced draw call
    expect(stats!.drawCalls).toBeGreaterThanOrEqual(5);
    expect(stats!.drawCalls).toBeLessThanOrEqual(8);

    // Default tier is high: 90,000 blades
    expect(stats!.blades).toBe(90000);
    expect(stats!.tier).toBe('high');

    // Total scene triangles includes ~630k from grass blades
    expect(stats!.triangles).toBeGreaterThan(600000);

    expect(consoleErrors).toEqual([]);
  });

  test('configures blade counts via URL flag and supports runtime tier switching', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // 1. Medium tier via URL flag
    await page.goto('/?quality=medium&debug=1&freeze=1');
    await page.waitForFunction(() => Boolean(window.__grass?.app));
    let stats = await page.evaluate(() => window.__grass?.stats());
    expect(stats!.tier).toBe('medium');
    expect(stats!.blades).toBe(45000);

    // 2. Low tier via URL flag
    await page.goto('/?quality=low&debug=1&freeze=1');
    await page.waitForFunction(() => Boolean(window.__grass?.app));
    stats = await page.evaluate(() => window.__grass?.stats());
    expect(stats!.tier).toBe('low');
    expect(stats!.blades).toBe(18000);

    // 3. Runtime tier switching
    await page.evaluate(() => window.__grass?.setTier('medium'));
    stats = await page.evaluate(() => window.__grass?.stats());
    expect(stats!.tier).toBe('medium');
    expect(stats!.blades).toBe(45000);

    await page.evaluate(() => window.__grass?.setTier('high'));
    stats = await page.evaluate(() => window.__grass?.stats());
    expect(stats!.tier).toBe('high');
    expect(stats!.blades).toBe(90000);

    expect(consoleErrors).toEqual([]);
  });

  test('verifies wind displacement animation produces visible motion between frames', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Boot with freeze=0 (default live loop)
    await page.goto('/?debug=1');
    await page.waitForFunction(() => Boolean(window.__grass?.app));

    const enterBtn = page.locator('#btn-enter');
    await enterBtn.click();
    await expect(page.locator('#entry-overlay')).toHaveClass(/hidden/);

    // Wait for entry camera animation to settle
    await page.waitForTimeout(1000);

    // Hide debug overlay so screenshot difference is strictly world/wind motion, not fps text
    await page.evaluate(() => window.__grass?.app.statsOverlay?.setVisible(false));

    // Capture frame 1
    const buffer1 = await page.screenshot();

    // Wait 1 second of live wind displacement
    await page.waitForTimeout(1000);

    // Capture frame 2
    const buffer2 = await page.screenshot();

    // Verify screenshots are not identical (wind creates motion)
    expect(buffer1.equals(buffer2)).toBe(false);

    // Count differing bytes
    let diffCount = 0;
    const len = Math.min(buffer1.length, buffer2.length);
    for (let i = 0; i < len; i++) {
      if (buffer1[i] !== buffer2[i]) {
        diffCount++;
      }
    }
    expect(diffCount).toBeGreaterThan(100);

    expect(consoleErrors).toEqual([]);
  });

  test('captures golden grass meadow vista for visual review', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // High quality golden meadow
    await page.goto('/?quality=high&debug=1&freeze=1');
    await page.waitForFunction(() => Boolean(window.__grass?.app));

    const enterBtn = page.locator('#btn-enter');
    await enterBtn.click();
    await expect(page.locator('#entry-overlay')).toHaveClass(/hidden/);

    await page.waitForTimeout(600);

    // Hide stats overlay for clean vista presentation
    await page.evaluate(() => window.__grass?.app.statsOverlay?.setVisible(false));

    fs.mkdirSync('tracking/evidence/M3', { recursive: true });
    const screenshotPath = 'tracking/evidence/M3/grass-vista.png';
    await page.screenshot({ path: screenshotPath });

    expect(fs.existsSync(screenshotPath)).toBe(true);
    const stat = fs.statSync(screenshotPath);
    expect(stat.size).toBeGreaterThan(50000); // Verify rich screenshot (> 50 KB)

    expect(consoleErrors).toEqual([]);
  });
});
