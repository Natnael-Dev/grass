import { test, expect } from '@playwright/test';

test.describe('Grass smoke test', () => {
  test('boots without console errors and presents static entry overlay', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');

    // 1. Verify canvas is present and accessible
    const canvas = page.locator('#scene');
    await expect(canvas).toBeAttached();
    await expect(canvas).toHaveAttribute('aria-hidden', 'true');

    // 2. Verify static entry overlay elements
    const overlay = page.locator('#entry-overlay');
    await expect(overlay).toBeVisible();

    const wordmark = page.locator('.entry-wordmark');
    await expect(wordmark).toContainText('grass');

    const tagline = page.locator('.entry-tagline');
    await expect(tagline).toHaveText('go outside for a minute. your build will wait.');

    const enterBtn = page.locator('#btn-enter');
    await expect(enterBtn).toBeVisible();
    await expect(enterBtn).toBeEnabled();
    await expect(enterBtn).toHaveText('step outside');

    // Capture visual evidence of static entry overlay
    await page.screenshot({ path: 'tracking/evidence/M1/entry-overlay.png' });

    // 3. Verify clicking enter hides overlay
    await enterBtn.click();
    await expect(overlay).toHaveClass(/hidden/);

    // 4. Assert zero console errors
    expect(consoleErrors).toEqual([]);
  });
});
