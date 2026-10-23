import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { pathToFileURL } from 'url';

const root = process.cwd();
const playwrightPath = pathToFileURL(path.join(root, 'node_modules', 'playwright', 'index.mjs')).href;
const { chromium } = await import(playwrightPath);

const targetDir = process.argv[2] ? path.resolve(root, process.argv[2]) : path.join(root, 'docs', 'baseline');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

async function capture() {
  const port = 4188;
  console.log(`Starting preview server for capture to ${targetDir} on port ${port}...`);
  const server = spawn('npx', ['vite', 'preview', '--port', String(port), '--strictPort'], {
    shell: true,
    cwd: root,
    stdio: 'pipe'
  });

  server.stdout.on('data', data => console.log(`[preview] ${data}`));
  server.stderr.on('data', data => console.error(`[preview err] ${data}`));

  await new Promise(r => setTimeout(r, 3000));

  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();
  page.on('console', msg => console.log(`[page ${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => console.error(`[page err] ${err}`));

  async function enterApp(url) {
    console.log(`Navigating to ${url}...`);
    await page.goto(url);
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
    await page.waitForTimeout(500);
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
    await enterApp(`http://localhost:${port}/?quality=${tier}&debug=1&freeze=1&seed=1337`);
    const stats = await page.evaluate(() => window.__grass?.stats());
    measurements.tiers[tier] = stats;
    console.log(`Measured tier ${tier}:`, stats);
  }

  // 2. Capture Vista (3 moods)
  for (const mood of ['dawn', 'golden', 'night']) {
    await enterApp(`http://localhost:${port}/?quality=high&mood=${mood}&debug=1&freeze=1&seed=1337`);
    const outPath = path.join(targetDir, `vista_${mood}.png`);
    await page.screenshot({ path: outPath });
    console.log(`Saved: ${outPath}`);
  }

  // 3. Capture Lie-down (3 moods)
  for (const mood of ['dawn', 'golden', 'night']) {
    await enterApp(`http://localhost:${port}/?quality=high&mood=${mood}&debug=1&freeze=1&seed=1337`);
    await page.evaluate(() => {
      window.__grass?.setLying(true);
      window.__grass?.step(1.5); // step enough to finish lie-down transition
    });
    await page.waitForTimeout(500);
    const outPath = path.join(targetDir, `liedown_${mood}.png`);
    await page.screenshot({ path: outPath });
    console.log(`Saved: ${outPath}`);
  }

  fs.writeFileSync(path.join(targetDir, 'measurements.json'), JSON.stringify(measurements, null, 2));
  console.log(`Saved measurements: ${path.join(targetDir, 'measurements.json')}`);

  await browser.close();
  server.kill();
  console.log('Capture complete!');
}

capture().catch(err => {
  console.error('Capture failed:', err);
  process.exit(1);
});
