import { test, expect, type Page } from '@playwright/test';

async function enterMeadow(page: Page) {
  const enterBtn = page.locator('#btn-enter');
  await expect(enterBtn).toBeVisible();
  await enterBtn.click();
  await page.waitForTimeout(600);
  if (await page.locator('#entry-overlay').isVisible()) {
    await page.evaluate(() => window.__grass?.enter());
  }
  await page.waitForTimeout(1100);
  await expect(page.locator('#entry-overlay')).toBeHidden({ timeout: 15000 });
}

test.describe('M11 Performance, Budgets & Adaptive Quality Suite (Gate G10)', () => {
  test.setTimeout(90000);

  test('adheres to draw call budget (<= 12) and triangle budget (<= 500k on medium tier)', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/?quality=medium&debug=1&freeze=1');
    await page.waitForFunction(() => Boolean(window.__grass?.app));

    await enterMeadow(page);

    // Advance frame simulation
    await page.evaluate(() => {
      window.__grass?.step(0.0167);
    });

    const stats = await page.evaluate(() => window.__grass?.stats());
    expect(stats).toBeDefined();

    // 1. Draw call budget: total scene draw calls <= 12 (grass = 1)
    expect(stats!.drawCalls).toBeLessThanOrEqual(12);
    expect(stats!.drawCalls).toBeGreaterThanOrEqual(5);

    // 2. Triangle budget: medium tier <= 500k triangles (45k blades * 5 tris ≈ 225k + world)
    expect(stats!.triangles).toBeLessThanOrEqual(500000);
    expect(stats!.triangles).toBeGreaterThan(200000);

    // 3. Medium tier blade count: 45,000 blades
    expect(stats!.blades).toBe(45000);
    expect(stats!.tier).toBe('medium');

    expect(consoleErrors).toEqual([]);
  });

  test('asserts 60 FPS baseline frame budget and sub-16ms script execution', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/?quality=high&debug=1&freeze=1');
    await page.waitForFunction(() => Boolean(window.__grass?.app));

    await enterMeadow(page);

    // Warm up the loop with 60 FPS dt = 0.01667 s
    await page.evaluate(() => {
      for (let i = 0; i < 60; i++) {
        window.__grass?.step(1 / 60);
      }
    });

    const stats = await page.evaluate(() => window.__grass?.stats());
    expect(stats).toBeDefined();
    // 60 FPS baseline
    expect(Math.round(stats!.fps)).toBe(60);

    // Benchmark script execution time of a full render tick in the browser
    const benchmark = await page.evaluate(() => {
      // Warm up JIT
      for (let i = 0; i < 5; i++) {
        window.__grass?.step(0.01667);
      }
      const times: number[] = [];
      for (let i = 0; i < 20; i++) {
        const t0 = performance.now();
        window.__grass?.step(0.01667);
        times.push(performance.now() - t0);
      }
      const sum = times.reduce((a, b) => a + b, 0);
      const avg = sum / times.length;
      const max = Math.max(...times);
      return { avg, max };
    });

    // CPU script time per frame should comfortably fit within the 16.7ms frame budget
    expect(benchmark.avg).toBeLessThan(16.7);
    expect(consoleErrors).toEqual([]);
  });

  test('verifies bounded memory growth under continuous interaction', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/?quality=medium&debug=1&freeze=1');
    await page.waitForFunction(() => Boolean(window.__grass?.app));

    await enterMeadow(page);

    // Warm up
    await page.evaluate(() => {
      for (let i = 0; i < 30; i++) {
        window.__grass?.step(0.0167);
      }
    });

    const initialHeapMb = await page.evaluate(() => {
      const perf = window.performance as unknown as { memory?: { usedJSHeapSize?: number } };
      return perf.memory?.usedJSHeapSize ? perf.memory.usedJSHeapSize / (1024 * 1024) : 0;
    });

    // Simulate 120 cycles of continuous interaction (brushing + seeds + step)
    await page.evaluate(() => {
      for (let i = 0; i < 120; i++) {
        const x = Math.sin(i * 0.1) * 10;
        const z = -5 + Math.cos(i * 0.1) * 8;
        if (i % 20 === 0) {
          window.__grass?.spawnSeeds(x, z);
        }
        window.__grass?.step(0.0167);
      }
    });

    const finalHeapMb = await page.evaluate(() => {
      const perf = window.performance as unknown as { memory?: { usedJSHeapSize?: number } };
      return perf.memory?.usedJSHeapSize ? perf.memory.usedJSHeapSize / (1024 * 1024) : 0;
    });

    if (initialHeapMb > 0 && finalHeapMb > 0) {
      const growthMb = finalHeapMb - initialHeapMb;
      // Bounded memory growth: heap growth during active interaction should be strictly under 15 MB
      expect(growthMb).toBeLessThan(15);
    }

    expect(consoleErrors).toEqual([]);
  });

  test('executes hysteresis-backed adaptive down-tiering below 45 FPS and up-tiering at stable 60 FPS', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // Boot with default tier and freeze
    await page.goto('/?debug=1&freeze=1');
    await page.waitForFunction(() => Boolean(window.__grass?.app));

    await enterMeadow(page);

    // 1. Explicitly initialize baseline at high tier unlocked for adaptive evaluation
    await page.evaluate(() => {
      window.__grass?.setTier('high', false);
    });

    let stats = await page.evaluate(() => window.__grass?.stats());
    expect(stats!.tier).toBe('high');
    expect(stats!.blades).toBe(90000);

    // 2. Feed 200 normal frames to pass warm-up period (3.0s warmup)
    await page.evaluate(() => {
      for (let i = 0; i < 200; i++) {
        window.__grass?.adaptiveQuality.recordFrame(0.0167);
      }
    });

    expect(await page.evaluate(() => window.__grass?.adaptiveQuality.isWarmupComplete())).toBe(
      true,
    );

    // 3. Feed synthetic low FPS frames (30 FPS -> 0.0333s) to trigger down-tiering below 45 FPS
    await page.evaluate(() => {
      for (let i = 0; i < 80; i++) {
        window.__grass?.adaptiveQuality.recordFrame(0.0333);
      }
      window.__grass?.step(0.0167);
    });

    // Assert downgraded to medium tier: 45k blades and <= 500k triangles
    stats = await page.evaluate(() => window.__grass?.stats());
    expect(stats!.tier).toBe('medium');
    expect(stats!.blades).toBe(45000);
    expect(stats!.triangles).toBeLessThanOrEqual(500000);

    // 4. Feed further slow frames past cooldown to trigger second down-tier to low
    await page.evaluate(() => {
      // Advance cooldown (4.0s)
      for (let i = 0; i < 150; i++) {
        window.__grass?.adaptiveQuality.recordFrame(0.0333);
      }
      window.__grass?.step(0.0167);
    });

    stats = await page.evaluate(() => window.__grass?.stats());
    expect(stats!.tier).toBe('low');
    expect(stats!.blades).toBe(18000);
    expect(stats!.triangles).toBeLessThanOrEqual(500000);
    expect(stats!.triangles).toBeLessThan(100000);

    // 5. Feed stable 60 FPS frames (0.0166s) past cooldown to trigger hysteresis up-tiering
    await page.evaluate(() => {
      // Advance cooldown and fill rolling window with stable 60 FPS
      for (let i = 0; i < 300; i++) {
        window.__grass?.adaptiveQuality.recordFrame(0.0166);
      }
      window.__grass?.step(0.0167);
    });

    stats = await page.evaluate(() => window.__grass?.stats());
    expect(stats!.tier).toBe('medium');
    expect(stats!.blades).toBe(45000);

    expect(consoleErrors).toEqual([]);
  });

  test('respects manual user overrides (?quality=) and forbids automatic tier shifts', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // Boot with explicit user quality override
    await page.goto('/?quality=low&debug=1&freeze=1');
    await page.waitForFunction(() => Boolean(window.__grass?.app));

    await enterMeadow(page);

    const isLocked = await page.evaluate(() => window.__grass?.adaptiveQuality.getIsLocked());
    expect(isLocked).toBe(true);

    let stats = await page.evaluate(() => window.__grass?.stats());
    expect(stats!.tier).toBe('low');
    expect(stats!.blades).toBe(18000);

    // Feed hundreds of fast frames (60 FPS)
    await page.evaluate(() => {
      for (let i = 0; i < 300; i++) {
        window.__grass?.adaptiveQuality.recordFrame(0.0166);
      }
      window.__grass?.step(0.0167);
    });

    // Tier must remain low because manual override locked it
    stats = await page.evaluate(() => window.__grass?.stats());
    expect(stats!.tier).toBe('low');
    expect(stats!.blades).toBe(18000);

    expect(consoleErrors).toEqual([]);
  });
});
