import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { encodePng8 } from '../../scripts/png8';

test.describe('FR-18 Metadata, Favicon & OG Image Assets', () => {
  test.setTimeout(90000);

  test('captures and verifies 1200x630 golden vista OG image and favicon asset', async ({
    page,
  }) => {
    // 1. Verify favicon.svg exists and is < 1 KB
    const faviconPath = path.resolve('public/favicon.svg');
    expect(fs.existsSync(faviconPath)).toBe(true);
    const faviconStat = fs.statSync(faviconPath);
    expect(faviconStat.size).toBeLessThan(1024);
    const faviconContent = fs.readFileSync(faviconPath, 'utf8');
    expect(faviconContent).toContain('<svg');
    expect(faviconContent).toContain('</svg>');

    // 2. Set viewport to 1200x630 for standard Open Graph preview dimensions
    await page.setViewportSize({ width: 1200, height: 630 });
    await page.goto('/?mood=golden&debug=1&freeze=1');
    await page.waitForFunction(() => Boolean(window.__grass?.app));

    // 3. Enter vista and advance simulation for grass and lighting to settle
    const enterBtn = page.locator('#btn-enter');
    await expect(enterBtn).toBeVisible();
    await enterBtn.click();
    await page.waitForTimeout(600);
    if (await page.locator('#entry-overlay').isVisible()) {
      await page.evaluate(() => window.__grass?.enter());
    }
    await page.waitForTimeout(1100);
    await expect(page.locator('#entry-overlay')).toBeHidden({ timeout: 15000 });

    // Step simulation 30 frames
    await page.evaluate(() => {
      for (let i = 0; i < 30; i++) {
        window.__grass?.step(0.0167);
      }
    });

    // 4. Capture RGBA frame and encode as optimized PNG-8 (<= 150 KB)
    const rawPixels = await page.evaluate(() => {
      const canvas = document.querySelector<HTMLCanvasElement>('canvas#scene');
      if (!canvas) return null;
      const offscreen = document.createElement('canvas');
      offscreen.width = 1200;
      offscreen.height = 630;
      const ctx = offscreen.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(canvas, 0, 0, 1200, 630);
      const imgData = ctx.getImageData(0, 0, 1200, 630);
      return Array.from(imgData.data);
    });

    expect(rawPixels).not.toBeNull();
    const png8Buffer = encodePng8(1200, 630, Buffer.from(rawPixels!));

    const ogPath = path.resolve('public/og.png');
    fs.writeFileSync(ogPath, png8Buffer);

    expect(fs.existsSync(ogPath)).toBe(true);
    const ogStat = fs.statSync(ogPath);
    // Budget: <= 150 KB
    expect(ogStat.size).toBeLessThanOrEqual(150 * 1024);
    expect(ogStat.size).toBeGreaterThan(10 * 1024);

    // 5. Verify head tags rendered in DOM
    const faviconLink = page.locator('link[rel="icon"]');
    await expect(faviconLink).toHaveAttribute('href', '/favicon.svg');

    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute(
      'content',
      'grass — a tiny meadow for a one-minute break',
    );

    const ogImage = page.locator('meta[property="og:image"]');
    await expect(ogImage).toHaveAttribute('content', '/og.png');

    const twitterCard = page.locator('meta[name="twitter:card"]');
    await expect(twitterCard).toHaveAttribute('content', 'summary_large_image');
  });
});
