import { test, expect } from '@playwright/test';
import fs from 'node:fs';

test.describe('M4 Mood System & Crossfade', () => {
  test.setTimeout(60000);

  test('boots with URL mood flag and switches moods via dev keys 1, 2, 3', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // 1. Boot with explicit mood=golden
    await page.goto('/?mood=golden&debug=1&freeze=1');
    await page.waitForFunction(() => Boolean(window.__grass?.app));

    let state = await page.evaluate(() => window.__grass?.getState());
    expect(state?.mood).toBe('golden');

    // 2. Press dev key '1' for Dawn
    await page.keyboard.press('1');
    state = await page.evaluate(() => window.__grass?.getState());
    expect(state?.targetMood).toBe('dawn');

    const isFadingToDawn = await page.evaluate(
      () => window.__grass?.app.moodController.state.isFading,
    );
    expect(isFadingToDawn).toBe(true);

    // Fast-forward fade in app loop
    await page.evaluate(() => window.__grass?.app.moodController.update(2.5));
    state = await page.evaluate(() => window.__grass?.getState());
    expect(state?.mood).toBe('dawn');

    // 3. Press dev key '3' for Night
    await page.keyboard.press('3');
    state = await page.evaluate(() => window.__grass?.getState());
    expect(state?.targetMood).toBe('night');

    await page.evaluate(() => window.__grass?.app.moodController.update(2.5));
    state = await page.evaluate(() => window.__grass?.getState());
    expect(state?.mood).toBe('night');

    // 4. Press dev key '2' for Golden
    await page.keyboard.press('2');
    state = await page.evaluate(() => window.__grass?.getState());
    expect(state?.targetMood).toBe('golden');

    await page.evaluate(() => window.__grass?.app.moodController.update(2.5));
    state = await page.evaluate(() => window.__grass?.getState());
    expect(state?.mood).toBe('golden');

    expect(consoleErrors).toEqual([]);
  });

  test('captures visual evidence for dawn mood', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    fs.mkdirSync('tracking/evidence/M4', { recursive: true });

    await page.goto('/?mood=dawn&debug=1&freeze=1');
    await page.waitForFunction(() => Boolean(window.__grass?.app));
    await page.locator('#btn-enter').click();
    await expect(page.locator('#entry-overlay')).toHaveClass(/hidden/);
    await page.waitForTimeout(600);
    await page.evaluate(() => window.__grass?.app.statsOverlay?.setVisible(false));

    const dawnPath = 'tracking/evidence/M4/mood-dawn.png';
    await page.screenshot({ path: dawnPath });
    expect(fs.existsSync(dawnPath)).toBe(true);
    expect(fs.statSync(dawnPath).size).toBeGreaterThan(50000);

    expect(consoleErrors).toEqual([]);
  });

  test('captures visual evidence for golden mood', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    fs.mkdirSync('tracking/evidence/M4', { recursive: true });

    await page.goto('/?mood=golden&debug=1&freeze=1');
    await page.waitForFunction(() => Boolean(window.__grass?.app));
    await page.locator('#btn-enter').click();
    await expect(page.locator('#entry-overlay')).toHaveClass(/hidden/);
    await page.waitForTimeout(600);
    await page.evaluate(() => window.__grass?.app.statsOverlay?.setVisible(false));

    const goldenPath = 'tracking/evidence/M4/mood-golden.png';
    await page.screenshot({ path: goldenPath });
    expect(fs.existsSync(goldenPath)).toBe(true);
    expect(fs.statSync(goldenPath).size).toBeGreaterThan(50000);

    expect(consoleErrors).toEqual([]);
  });

  test('captures visual evidence for night mood', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    fs.mkdirSync('tracking/evidence/M4', { recursive: true });

    await page.goto('/?mood=night&debug=1&freeze=1');
    await page.waitForFunction(() => Boolean(window.__grass?.app));
    await page.locator('#btn-enter').click();
    await expect(page.locator('#entry-overlay')).toHaveClass(/hidden/);
    await page.waitForTimeout(600);
    await page.evaluate(() => window.__grass?.app.statsOverlay?.setVisible(false));

    const nightPath = 'tracking/evidence/M4/mood-night.png';
    await page.screenshot({ path: nightPath });
    expect(fs.existsSync(nightPath)).toBe(true);
    expect(fs.statSync(nightPath).size).toBeGreaterThan(50000);

    expect(consoleErrors).toEqual([]);
  });
});
