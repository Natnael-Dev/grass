import { test, expect } from '@playwright/test';
import fs from 'node:fs';

test.describe('M2 Render Core & Golden Vista', () => {
  test('boots 3D render core, satisfies draw call budget, handles visibility pause, and captures golden vista', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // 1. Boot with debug stats overlay and fixed time step
    await page.goto('/?debug=1&freeze=1');

    // 2. Wait for app initialization and window.__grass hook
    await page.waitForFunction(() => Boolean(window.__grass?.app));

    // 3. Verify debug stats overlay is visible
    const statsOverlay = page.locator('#stats-overlay');
    await expect(statsOverlay).toBeVisible();

    // 4. Click enter button to trigger camera entry and hide overlay
    const enterBtn = page.locator('#btn-enter');
    await enterBtn.click();
    await expect(page.locator('#entry-overlay')).toHaveClass(/hidden/);

    // Wait for camera entry and frame rendering
    await page.waitForTimeout(600);

    // 5. Assert draw calls and triangles budget (< 10 draw calls)
    const stats = await page.evaluate(() => window.__grass?.stats());
    expect(stats).toBeDefined();
    expect(stats!.drawCalls).toBeGreaterThan(0);
    expect(stats!.drawCalls).toBeLessThanOrEqual(8); // Sky (1), Ridges (3), Terrain (1), Tree (1) = 6 draw calls
    expect(stats!.triangles).toBeGreaterThan(15000); // Terrain 32k + Ridges + Tree

    // 6. Test FR-19 Tab Visibility Pause
    const framesBefore = await page.evaluate(() => window.__grass?.app.loop.getFrameCount());
    expect(framesBefore).toBeGreaterThan(0);

    // Simulate tab hidden
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForTimeout(250);
    const framesDuringHidden = await page.evaluate(() => window.__grass?.app.loop.getFrameCount());
    expect(framesDuringHidden).toBe(framesBefore);

    // Simulate tab restored
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { value: false, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForTimeout(250);
    const framesAfterResume = await page.evaluate(() => window.__grass?.app.loop.getFrameCount());
    expect(framesAfterResume).toBeGreaterThan(framesBefore!);

    // 7. Test responsive resize (portrait -> landscape)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(200);
    const portraitAspect = await page.evaluate(() => window.__grass?.app.cameraRig.camera.aspect);
    expect(portraitAspect).toBeCloseTo(390 / 844, 2);

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(300);

    // 8. Capture golden vista screenshot for visual verification
    fs.mkdirSync('tracking/evidence/M2', { recursive: true });
    const screenshotPath = 'tracking/evidence/M2/golden-vista.png';
    await page.screenshot({ path: screenshotPath });

    expect(fs.existsSync(screenshotPath)).toBe(true);
    const stat = fs.statSync(screenshotPath);
    expect(stat.size).toBeGreaterThan(30000); // Verify non-blank image (> 30 KB)

    // 9. Zero console errors
    expect(consoleErrors).toEqual([]);
  });
});
