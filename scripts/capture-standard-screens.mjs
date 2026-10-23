import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';
import { preview } from 'vite';

const root = process.cwd();
const playwrightPath = pathToFileURL(path.join(root, 'node_modules', 'playwright', 'index.mjs')).href;
const { chromium } = await import(playwrightPath);

const targetDir = process.argv[2] ? path.resolve(root, process.argv[2]) : path.join(root, 'docs', 'baseline');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

async function capture() {
  console.log(`Starting in-process preview server for capture to ${targetDir}...`);
  const server = await preview({
    root,
    preview: {
      port: 0,
      strictPort: false
    }
  });

  const address = server.httpServer.address();
  const port = typeof address === 'object' && address ? address.port : 4173;
  console.log(`Preview server listening on ephemeral port ${port}`);

  console.log('Launching browser...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu-process-crash-limit']
  });

  async function withPage(fn) {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1
    });
    const page = await context.newPage();
    page.on('console', msg => {
      const text = msg.text();
      if (!text.includes('hey dev.')) {
        console.log(`[page ${msg.type()}] ${text}`);
      }
    });
    page.on('pageerror', err => console.error(`[page err] ${err}`));

    try {
      return await fn(page);
    } finally {
      await page.close().catch(() => {});
      await context.close().catch(() => {});
    }
  }

  async function enterApp(page, url) {
    console.log(`Navigating to ${url}...`);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => Boolean(window.__grass?.app), { timeout: 15000 });
    console.log('App ready. Entering meadow...');
    const enterBtn = page.locator('#btn-enter');
    if (await enterBtn.isVisible()) {
      await enterBtn.click();
      await page.waitForTimeout(600);
      if (await page.locator('#entry-overlay').isVisible()) {
        await page.evaluate(() => window.__grass?.enter());
      }
      await page.locator('#entry-overlay').waitFor({ state: 'hidden', timeout: 10000 });
    }
    // Step simulation deterministically
    await page.evaluate(() => {
      window.__grass?.step(0.0167);
      window.__grass?.step(0.0167);
    });
    await page.waitForTimeout(400);
  }

  const measurements = {
    capturedAt: new Date().toISOString(),
    tiers: {},
    bundle: {}
  };

  // Measure bundle size
  const distDir = path.join(root, 'dist', 'assets');
  if (fs.existsSync(distDir)) {
    const files = fs.readdirSync(distDir);
    for (const f of files) {
      const stat = fs.statSync(path.join(distDir, f));
      measurements.bundle[f] = { rawBytes: stat.size };
    }
  }

  // 1. Measure Tiers
  for (const tier of ['high', 'medium', 'low']) {
    await withPage(async (page) => {
      await enterApp(page, `http://localhost:${port}/?quality=${tier}&debug=1&freeze=1&seed=1337`);
      const stats = await page.evaluate(() => window.__grass?.stats());
      measurements.tiers[tier] = stats;
      console.log(`Measured tier ${tier}:`, stats);
    });
  }

  // 2. Capture Vista (3 moods)
  for (const mood of ['dawn', 'golden', 'night']) {
    await withPage(async (page) => {
      await enterApp(page, `http://localhost:${port}/?quality=high&mood=${mood}&debug=1&freeze=1&seed=1337`);
      const outPath = path.join(targetDir, `vista_${mood}.png`);
      await page.screenshot({ path: outPath });
      console.log(`Saved: ${outPath}`);
    });
  }

  // 3. Capture Lie-down (3 moods)
  for (const mood of ['dawn', 'golden', 'night']) {
    await withPage(async (page) => {
      await enterApp(page, `http://localhost:${port}/?quality=high&mood=${mood}&debug=1&freeze=1&seed=1337`);
      await page.evaluate(() => {
        window.__grass?.setLying(true);
        window.__grass?.step(1.5);
      });
      await page.waitForTimeout(400);
      const outPath = path.join(targetDir, `liedown_${mood}.png`);
      await page.screenshot({ path: outPath });
      console.log(`Saved: ${outPath}`);
    });
  }

  fs.writeFileSync(path.join(targetDir, 'measurements.json'), JSON.stringify(measurements, null, 2));
  console.log(`Saved measurements: ${path.join(targetDir, 'measurements.json')}`);

  await browser.close();
  server.httpServer.close();
  console.log('Capture complete!');
}

capture().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
