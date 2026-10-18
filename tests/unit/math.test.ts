import { describe, it, expect } from 'vitest';
import { clamp, lerp, damp, smoothstep, smootherstep, invLerp } from '../../src/core/math';

describe('math utilities', () => {
  describe('clamp', () => {
    it('constrains values to range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('throws when min > max', () => {
      expect(() => clamp(5, 10, 0)).toThrow('clamp: min (10) cannot be greater than max (0)');
    });
  });

  describe('lerp', () => {
    it('interpolates linearly', () => {
      expect(lerp(0, 100, 0)).toBe(0);
      expect(lerp(0, 100, 1)).toBe(100);
      expect(lerp(0, 100, 0.5)).toBe(50);
      expect(lerp(10, 20, 0.25)).toBe(12.5);
    });
  });

  describe('damp', () => {
    it('approaches target value smoothly over time', () => {
      const start = 0;
      const target = 100;
      const step1 = damp(start, target, 5, 0.1);
      expect(step1).toBeGreaterThan(0);
      expect(step1).toBeLessThan(100);

      const step2 = damp(step1, target, 5, 0.1);
      expect(step2).toBeGreaterThan(step1);
      expect(step2).toBeLessThan(100);
    });

    it('returns target when already at target', () => {
      expect(damp(100, 100, 5, 0.1)).toBe(100);
    });

    it('returns current if dt is zero or negative', () => {
      expect(damp(10, 100, 5, 0)).toBe(10);
      expect(damp(10, 100, 5, -1)).toBe(10);
    });
  });

  describe('smoothstep', () => {
    it('returns 0 at or below min, 1 at or above max', () => {
      expect(smoothstep(0, 10, -5)).toBe(0);
      expect(smoothstep(0, 10, 0)).toBe(0);
      expect(smoothstep(0, 10, 10)).toBe(1);
      expect(smoothstep(0, 10, 15)).toBe(1);
    });

    it('returns 0.5 at midpoint', () => {
      expect(smoothstep(0, 10, 5)).toBe(0.5);
    });

    it('handles identical min and max gracefully', () => {
      expect(smoothstep(5, 5, 4)).toBe(0);
      expect(smoothstep(5, 5, 5)).toBe(1);
      expect(smoothstep(5, 5, 6)).toBe(1);
    });
  });

  describe('smootherstep', () => {
    it('returns 0 at min and 1 at max', () => {
      expect(smootherstep(0, 1, 0)).toBe(0);
      expect(smootherstep(0, 1, 1)).toBe(1);
      expect(smootherstep(0, 1, 0.5)).toBe(0.5);
    });
  });

  describe('invLerp', () => {
    it('calculates the normalized ratio', () => {
      expect(invLerp(0, 100, 50)).toBe(0.5);
      expect(invLerp(10, 20, 10)).toBe(0);
      expect(invLerp(10, 20, 20)).toBe(1);
      expect(invLerp(10, 20, 5)).toBe(0);
      expect(invLerp(10, 20, 25)).toBe(1);
    });

    it('returns 0 when a == b', () => {
      expect(invLerp(10, 10, 10)).toBe(0);
    });
  });
});
