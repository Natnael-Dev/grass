#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { chromium } from '@playwright/test';
import { preview } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');

async function main() {
  const args = process.argv.slice(2);
  let refPath = null;
  let mood = 'golden';
  let camera = 'vista';
  let seed = 1337;
  let outDir = path.join(root, 'docs', 'visual-diffs');

  for (const arg of args) {
    if (arg.startsWith('--mood=')) {
      mood = arg.split('=')[1];
    } else if (arg.startsWith('--camera=')) {
      camera = arg.split('=')[1];
    } else if (arg.startsWith('--seed=')) {
      seed = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--out=') || arg.startsWith('--output=')) {
      outDir = path.resolve(root, arg.split('=')[1]);
    } else if (!arg.startsWith('--') && !refPath) {
      refPath = path.resolve(process.cwd(), arg);
    }
  }

  if (!refPath) {
    console.error('Usage: node scripts/compare-reference.mjs <reference-image-path> [--mood=dawn|golden|night] [--camera=vista|lying] [--output=docs/visual-diffs]');
    process.exit(1);
  }

  if (!fs.existsSync(refPath)) {
    console.error(`Reference image not found: ${refPath}`);
    process.exit(1);
  }

  fs.mkdirSync(outDir, { recursive: true });

  console.log(`Starting reference comparison...`);
  console.log(`Reference image: ${refPath}`);
  console.log(`Target: mood=${mood}, camera=${camera}, seed=${seed}`);
  console.log(`Output folder: ${outDir}`);

  // 1. Start preview server
  const server = await preview({
    root,
    preview: { port: 0 }
  });
  const port = server.httpServer.address().port;

  // 2. Launch browser
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--ignore-gpu-blocklist',
    ],
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    page.on('console', (msg) => {
      if (msg.type() === 'error') console.error('PAGE LOG ERROR:', msg.text());
    });
    page.on('pageerror', (err) => console.error('PAGE ERROR:', err));

    // 3. Render actual screen
    const url = `http://localhost:${port}/?compare=1&mood=${mood}&camera=${camera}&freeze=1&seed=${seed}&ui=0`;
    console.log(`Rendering actual frame from ${url}...`);
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => Boolean(window.__grass?.app), { timeout: 15000 });
    await page.evaluate(() => {
      window.__grass?.step(0.0167);
      window.__grass?.step(0.0167);
    });
    await page.waitForTimeout(400);

    const actualBuf = await page.screenshot();
    const actualPath = path.join(outDir, 'actual.png');
    const refOutPath = path.join(outDir, 'reference.png');
    const diffPath = path.join(outDir, 'diff.png');
    const sideBySidePath = path.join(outDir, 'side_by_side.png');

    fs.writeFileSync(actualPath, actualBuf);
    fs.copyFileSync(refPath, refOutPath);

    // 4. Compute pixel difference and create side-by-side composite in browser canvas
    const refBase64 = fs.readFileSync(refOutPath).toString('base64');
    const actualBase64 = actualBuf.toString('base64');

    const result = await page.evaluate(async ({ refData, actualData }) => {
      const loadImg = (src) =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });

      const refImg = await loadImg('data:image/png;base64,' + refData);
      const actImg = await loadImg('data:image/png;base64,' + actualData);

      const w = 1920;
      const h = 1080;

      // Offscreen canvas for diff
      const diffCanvas = document.createElement('canvas');
      diffCanvas.width = w;
      diffCanvas.height = h;
      const diffCtx = diffCanvas.getContext('2d');

      // Draw ref and actual to read pixels
      const c1 = document.createElement('canvas');
      c1.width = w;
      c1.height = h;
      const ctx1 = c1.getContext('2d');
      ctx1.drawImage(refImg, 0, 0, w, h);
      const d1 = ctx1.getImageData(0, 0, w, h).data;

      const c2 = document.createElement('canvas');
      c2.width = w;
      c2.height = h;
      const ctx2 = c2.getContext('2d');
      ctx2.drawImage(actImg, 0, 0, w, h);
      const d2 = ctx2.getImageData(0, 0, w, h).data;

      const diffImgData = diffCtx.createImageData(w, h);
      const out = diffImgData.data;

      let differingPixels = 0;
      const totalPixels = w * h;

      for (let i = 0; i < d1.length; i += 4) {
        const dr = Math.abs(d1[i] - d2[i]);
        const dg = Math.abs(d1[i + 1] - d2[i + 1]);
        const db = Math.abs(d1[i + 2] - d2[i + 2]);
        const delta = dr + dg + db;

        if (delta > 30) {
          differingPixels++;
          // High-visibility magenta diff color
          out[i] = 255;
          out[i + 1] = 0;
          out[i + 2] = 128;
          out[i + 3] = 255;
        } else {
          // Dimmed grayscale background
          const gray = (d2[i] * 0.299 + d2[i + 1] * 0.587 + d2[i + 2] * 0.114) * 0.3;
          out[i] = gray;
          out[i + 1] = gray;
          out[i + 2] = gray;
          out[i + 3] = 255;
        }
      }

      diffCtx.putImageData(diffImgData, 0, 0);

      // Composite side-by-side canvas (Reference | Actual | Diff)
      const compCanvas = document.createElement('canvas');
      compCanvas.width = w * 3;
      compCanvas.height = h + 80;
      const compCtx = compCanvas.getContext('2d');

      compCtx.fillStyle = '#0f1410';
      compCtx.fillRect(0, 0, compCanvas.width, compCanvas.height);

      // Labels
      compCtx.fillStyle = '#d4ded2';
      compCtx.font = 'bold 36px monospace';
      compCtx.fillText('REFERENCE', 40, 52);
      compCtx.fillText('ACTUAL RENDER', w + 40, 52);
      compCtx.fillText('DIFF (MAGENTA = DIFFERENCE)', w * 2 + 40, 52);

      // Draw 3 panels
      compCtx.drawImage(c1, 0, 80, w, h);
      compCtx.drawImage(c2, w, 80, w, h);
      compCtx.drawImage(diffCanvas, w * 2, 80, w, h);

      return {
        diffBase64: diffCanvas.toDataURL('image/png').split(',')[1],
        sideBySideBase64: compCanvas.toDataURL('image/png').split(',')[1],
        differingPixels,
        diffPercent: ((differingPixels / totalPixels) * 100).toFixed(2),
      };
    }, { refData: refBase64, actualData: actualBase64 });

    fs.writeFileSync(diffPath, Buffer.from(result.diffBase64, 'base64'));
    fs.writeFileSync(sideBySidePath, Buffer.from(result.sideBySideBase64, 'base64'));

    console.log(`Comparison completed:`);
    console.log(`  - Reference: ${refOutPath}`);
    console.log(`  - Actual:    ${actualPath}`);
    console.log(`  - Diff:      ${diffPath}`);
    console.log(`  - Combined:  ${sideBySidePath}`);
    console.log(`Differing pixels: ${result.differingPixels} (${result.diffPercent}%)`);
  } finally {
    await browser.close();
    await server.close();
  }
}

main().catch((err) => {
  console.error('Reference comparison failed:', err);
  process.exit(1);
});
