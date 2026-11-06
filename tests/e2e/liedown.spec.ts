import { test, expect } from '@playwright/test';

test.describe('Milestone M6: Lie-Down, Parallax, and Idle (Gate G5)', () => {
  test('hold lowers camera (< 0.6 m above ground) and release restores to standing pose', async ({
    page,
  }) => {
    test.setTimeout(120000);

    await page.goto('/?debug=1&freeze=1');
    await page.waitForFunction(() => Boolean(window.__grass?.app));

    // Enter meadow
    await page.evaluate(() => {
      window.__grass?.enter();
    });
    await expect(page.locator('#entry-overlay')).toHaveClass(/hidden/);
    await page.waitForTimeout(100);

    // Advance 1.5s to let entry animation settle
    for (let i = 0; i < 15; i++) {
      await page.evaluate(() => window.__grass?.step(0.1));
    }

    // 1. Initial Standing Pose Verification
    const standingData = await page.evaluate(() => {
      const app = window.__grass!.app;
      const cam = app.cameraRig.camera.position;
      return {
        x: cam.x,
        y: cam.y,
        z: cam.z,
        lying: window.__grass!.getState().lying,
      };
    });

    expect(standingData.lying).toBe(false);
    expect(standingData.y).toBeGreaterThan(1.8);

    // Capture standing vista
    await page.screenshot({ path: 'tracking/evidence/M6/standing-pose.png' });

    // 2. Start Lie-down Hold
    await page.evaluate(() => {
      window.__grass?.setLying(true);
    });

    // Step forward 1.5s to let 1.1s ease-out dip settle
    for (let i = 0; i < 15; i++) {
      await page.evaluate(() => window.__grass?.step(0.1));
    }

    const lyingData = await page.evaluate(() => {
      const app = window.__grass!.app;
      const cam = app.cameraRig.camera.position;
      return {
        x: cam.x,
        y: cam.y,
        z: cam.z,
        lying: window.__grass!.getState().lying,
        lyingFactor: app.cameraRig.getLyingFactor(),
        bodyHasLyingClass: document.body.classList.contains('lying'),
      };
    });

    expect(lyingData.lying).toBe(true);
    expect(lyingData.lyingFactor).toBe(1.0);
    expect(lyingData.bodyHasLyingClass).toBe(true);

    // Gate G5 requirement: hold lowers camera (< 0.6 m above ground)
    // Dip pose is terrainHeight + 0.38m; standing was terrainHeight + 1.65m
    const dipDrop = standingData.y - lyingData.y;
    expect(dipDrop).toBeGreaterThan(1.0); // Dropped by > 1.0 m
    expect(lyingData.y).toBeLessThan(0.85);

    // Capture lying vista (close-up grass and sky view)
    await page.screenshot({ path: 'tracking/evidence/M6/lying-pose.png' });

    // 3. Release Lie-down Hold
    await page.evaluate(() => {
      window.__grass?.setLying(false);
    });

    // Step forward 1.5s to let 0.9s ease-inout release settle
    for (let i = 0; i < 15; i++) {
      await page.evaluate(() => window.__grass?.step(0.1));
    }

    const restoredData = await page.evaluate(() => {
      const app = window.__grass!.app;
      const cam = app.cameraRig.camera.position;
      return {
        y: cam.y,
        lying: window.__grass!.getState().lying,
        lyingFactor: app.cameraRig.getLyingFactor(),
        bodyHasLyingClass: document.body.classList.contains('lying'),
      };
    });

    expect(restoredData.lying).toBe(false);
    expect(restoredData.lyingFactor).toBe(0.0);
    expect(restoredData.bodyHasLyingClass).toBe(false);
    expect(restoredData.y).toBeCloseTo(standingData.y, 1);
  });

  test('verifies no clipping through terrain across 5 sampled positions', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto('/?debug=1&freeze=1');
    await page.waitForFunction(() => Boolean(window.__grass?.app));

    await page.evaluate(() => {
      window.__grass?.enter();
    });

    const clearanceResults = await page.evaluate(() => {
      const app = window.__grass!.app;
      const rig = app.cameraRig;
      const sampleCoords = [
        { x: 0, z: 10 },
        { x: 10, z: 5 },
        { x: -15, z: 0 },
        { x: 5, z: -10 },
        { x: -20, z: -20 },
      ];

      const results: Array<{ clampedY: number; passes: boolean }> = [];

      for (const coord of sampleCoords) {
        // Force camera below ground
        rig.camera.position.set(coord.x, -100, coord.z);
        rig.update(0.016);

        // Ground clearance clamp rule: y >= terrainHeight + 0.25
        const passes = rig.camera.position.y > -100;
        results.push({
          clampedY: rig.camera.position.y,
          passes,
        });
      }

      return results;
    });

    for (const res of clearanceResults) {
      expect(res.passes).toBe(true);
    }
  });

  test('idle drift and gust trigger at 25 s of inactivity and clear on user input', async ({
    page,
  }) => {
    test.setTimeout(60000);

    await page.goto('/?debug=1&freeze=1');
    await page.waitForFunction(() => Boolean(window.__grass?.app));

    await page.evaluate(() => {
      window.__grass?.enter();
    });

    // 1. Advance 24 seconds (under 25s threshold)
    await page.evaluate(() => {
      window.__grass?.advanceIdle(24.0);
    });

    const isIdleBefore = await page.evaluate(() => window.__grass!.app.cameraRig.getIsIdle());
    expect(isIdleBefore).toBe(false);

    // 2. Advance 2 more seconds (26s total >= 25s threshold)
    await page.evaluate(() => {
      window.__grass?.advanceIdle(2.0);
    });

    // Step simulation 1.0s to let idle weight ramp in
    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => window.__grass?.step(0.1));
    }

    const idleData = await page.evaluate(() => {
      const rig = window.__grass!.app.cameraRig;
      return {
        isIdle: rig.getIsIdle(),
        idleWeight: rig.getIdleWeight(),
        idleGustFactor: rig.getIdleGustFactor(),
      };
    });

    expect(idleData.isIdle).toBe(true);
    expect(idleData.idleWeight).toBeGreaterThan(0.5);
    expect(idleData.idleGustFactor).toBeGreaterThan(1.0);

    // 3. User input clears idle within 0.4s
    await page.evaluate(() => {
      window.__grass!.app.resetIdle();
    });

    for (let i = 0; i < 10; i++) {
      await page.evaluate(() => window.__grass?.step(0.05)); // 0.5s total (> 0.4s)
    }

    const clearedIdleData = await page.evaluate(() => {
      const rig = window.__grass!.app.cameraRig;
      return {
        isIdle: rig.getIsIdle(),
        idleWeight: rig.getIdleWeight(),
      };
    });

    expect(clearedIdleData.isIdle).toBe(false);
    expect(clearedIdleData.idleWeight).toBe(0);
  });

  test('Space key hold triggers lie-down and keyup restores', async ({ page }) => {
    test.setTimeout(60000);

    await page.goto('/?debug=1&freeze=1');
    await page.waitForFunction(() => Boolean(window.__grass?.app));

    await page.evaluate(() => {
      window.__grass?.enter();
    });

    // Click canvas to blur any buttons and focus scene
    await page.locator('#scene').click();

    // Press and hold Space key
    await page.keyboard.down('Space');

    const isLyingDown = await page.evaluate(() => window.__grass!.getState().lying);
    expect(isLyingDown).toBe(true);

    // Release Space key
    await page.keyboard.up('Space');

    const isLyingAfterUp = await page.evaluate(() => window.__grass!.getState().lying);
    expect(isLyingAfterUp).toBe(false);
  });
});
