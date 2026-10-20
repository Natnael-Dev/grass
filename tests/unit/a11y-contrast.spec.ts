import { describe, it, expect } from 'vitest';
import {
  hexToRgb,
  srgbToLinear,
  relativeLuminance,
  contrastRatio,
  compositeOver,
  runContrastChecks,
} from '../../scripts/check-contrast.mjs';

describe('WCAG 2.1 AA Color Contrast Verification', () => {
  it('correctly converts sRGB channels to linear luminance values', () => {
    expect(srgbToLinear(0)).toBe(0);
    expect(srgbToLinear(255)).toBe(1);
    // Middle grey #808080 (128)
    expect(srgbToLinear(128)).toBeCloseTo(0.215, 2);
  });

  it('calculates standard relative luminance for pure colors', () => {
    // Pure black (0, 0, 0)
    expect(relativeLuminance({ r: 0, g: 0, b: 0 })).toBe(0);
    // Pure white (255, 255, 255)
    expect(relativeLuminance({ r: 255, g: 255, b: 255 })).toBe(1);
  });

  it('calculates exact contrast ratios (21:1 for black and white)', () => {
    const white = { r: 255, g: 255, b: 255 };
    const black = { r: 0, g: 0, b: 0 };
    expect(contrastRatio(white, black)).toBeCloseTo(21, 1);
  });

  it('accurately alpha-composites foreground over background', () => {
    const fg = { r: 100, g: 100, b: 100, a: 0.5 };
    const bg = { r: 200, g: 200, b: 200 };
    const comp = compositeOver(fg, bg);
    expect(comp.r).toBe(150);
    expect(comp.g).toBe(150);
    expect(comp.b).toBe(150);
  });

  it('satisfies WCAG AA minimum 4.5:1 ratio across all UI text and panel combinations for all moods', () => {
    const { allPass, results } = runContrastChecks();
    expect(allPass).toBe(true);

    for (const res of results) {
      expect(res.pass).toBe(true);
      expect(res.ratio).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('verifies brightest golden horizon has sufficient contrast for primary text', () => {
    const goldenHorizon = hexToRgb('#ffd99e');
    const panel = { r: 10, g: 14, b: 28, a: 0.58 };
    const comp = compositeOver(panel, goldenHorizon);
    const textRgb = hexToRgb('#f4f1e8');

    const ratio = contrastRatio(textRgb, comp);
    expect(ratio).toBeGreaterThanOrEqual(4.5);
    expect(ratio).toBeGreaterThan(5.0);
  });
});
