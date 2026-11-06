import { test, expect } from '@playwright/test';

const MOODS = ['dawn', 'golden', 'night'] as const;
const CAMERAS = ['vista', 'lying'] as const;

test.describe('Deterministic Visual Baselines (3 moods x 2 cameras)', () => {
  for (const mood of MOODS) {
    for (const camera of CAMERAS) {
      test(`${mood} mood - ${camera} view`, async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.goto(`/?compare=1&mood=${mood}&camera=${camera}&freeze=1&seed=1337&ui=0`, {
          waitUntil: 'domcontentloaded',
        });
        await page.waitForFunction(() => Boolean(window.__grass?.app), { timeout: 15000 });
        await page.evaluate(() => {
          window.__grass?.app.loop.stop();
          window.__grass?.step(0.0167);
          window.__grass?.step(0.0167);
        });
        await page.waitForTimeout(300);

        await expect(page).toHaveScreenshot(`${mood}-${camera}.png`, {
          maxDiffPixelRatio: 0.05,
          animations: 'disabled',
          timeout: 15000,
        });
      });
    }
  }
});
