#!/usr/bin/env node

/**
 * check-contrast.mjs — WCAG 2.1 AA Contrast Ratio Verification
 *
 * Verifies that text colors against composited panels and UI backgrounds meet
 * the minimum 4.5:1 contrast requirement for normal text across all moods.
 */

// Colors from tokens.css and moods.ts
const TOKENS = {
  text: '#f4f1e8',
  textMuted: '#cfcdc2',
  accent: '#c5f277',
  accentInk: '#10200c',
  panel: { r: 10, g: 14, b: 28, a: 0.58 },
  panelSolid: { r: 10, g: 14, b: 28, a: 0.82 },
};

const MOOD_HORIZONS = {
  dawn: '#ffba88',
  golden: '#ffd99e', // Brightest expected horizon
  night: '#121a36',
};

export function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return { r, g, b };
}

export function srgbToLinear(c) {
  const norm = c / 255;
  return norm <= 0.04045 ? norm / 12.92 : Math.pow((norm + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(rgb) {
  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(rgb1, rgb2) {
  const l1 = relativeLuminance(rgb1);
  const l2 = relativeLuminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export function compositeOver(fg, bg) {
  const r = Math.round(fg.a * fg.r + (1 - fg.a) * bg.r);
  const g = Math.round(fg.a * fg.g + (1 - fg.a) * bg.g);
  const b = Math.round(fg.a * fg.b + (1 - fg.a) * bg.b);
  return { r, g, b };
}

export function runContrastChecks() {
  const results = [];
  let allPass = true;

  // 1. Check accent-ink on accent button background
  const accentRatio = contrastRatio(hexToRgb(TOKENS.accentInk), hexToRgb(TOKENS.accent));
  results.push({
    pair: 'accent-ink on accent button',
    ratio: Number(accentRatio.toFixed(2)),
    min: 4.5,
    pass: accentRatio >= 4.5,
  });
  if (accentRatio < 4.5) allPass = false;

  // 2. Check text and textMuted on glass panel and solid panel across all mood horizons
  for (const [mood, horizonHex] of Object.entries(MOOD_HORIZONS)) {
    const horizonRgb = hexToRgb(horizonHex);

    // Glass panel with backdrop
    const glassComp = compositeOver(TOKENS.panel, horizonRgb);
    const textGlassRatio = contrastRatio(hexToRgb(TOKENS.text), glassComp);
    results.push({
      pair: `--text on glass panel (${mood} horizon)`,
      ratio: Number(textGlassRatio.toFixed(2)),
      min: 4.5,
      pass: textGlassRatio >= 4.5,
    });
    if (textGlassRatio < 4.5) allPass = false;

    // Solid panel fallback
    const solidComp = compositeOver(TOKENS.panelSolid, horizonRgb);
    const textSolidRatio = contrastRatio(hexToRgb(TOKENS.text), solidComp);
    results.push({
      pair: `--text on solid panel (${mood} horizon)`,
      ratio: Number(textSolidRatio.toFixed(2)),
      min: 4.5,
      pass: textSolidRatio >= 4.5,
    });
    if (textSolidRatio < 4.5) allPass = false;

    const mutedSolidRatio = contrastRatio(hexToRgb(TOKENS.textMuted), solidComp);
    results.push({
      pair: `--text-muted on solid panel (${mood} horizon)`,
      ratio: Number(mutedSolidRatio.toFixed(2)),
      min: 4.5,
      pass: mutedSolidRatio >= 4.5,
    });
    if (mutedSolidRatio < 4.5) allPass = false;
  }

  return { allPass, results };
}

import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

// CLI execution
if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const { allPass, results } = runContrastChecks();

  console.log('=== WCAG 2.1 AA Contrast Verification ===');
  for (const res of results) {
    const icon = res.pass ? '✓' : '✗';
    console.log(`${icon} ${res.pair.padEnd(45)}: ${res.ratio}:1 (min: ${res.min}:1)`);
  }

  if (!allPass) {
    console.error('\nContrast verification FAILED: one or more pairs fell below WCAG AA 4.5:1.');
    process.exit(1);
  } else {
    console.log('\nAll contrast checks PASSED (>= 4.5:1).');
    process.exit(0);
  }
}
