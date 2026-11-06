import { describe, it, expect } from 'vitest';
import { PRNG } from '../../src/core/prng';

describe('PRNG (Mulberry32)', () => {
  it('generates deterministic sequences with the same seed', () => {
    const rng1 = new PRNG(42);
    const rng2 = new PRNG(42);

    for (let i = 0; i < 50; i++) {
      expect(rng1.next()).toBe(rng2.next());
    }
  });

  it('generates different sequences with different seeds', () => {
    const rng1 = new PRNG(42);
    const rng2 = new PRNG(43);

    let identical = true;
    for (let i = 0; i < 20; i++) {
      if (rng1.next() !== rng2.next()) {
        identical = false;
        break;
      }
    }
    expect(identical).toBe(false);
  });

  it('resets correctly to initial seed', () => {
    const rng = new PRNG(100);
    const firstFive = [rng.next(), rng.next(), rng.next(), rng.next(), rng.next()];

    rng.reset(100);
    const resetFive = [rng.next(), rng.next(), rng.next(), rng.next(), rng.next()];

    expect(resetFive).toEqual(firstFive);
  });

  it('generates values within range', () => {
    const rng = new PRNG(999);
    for (let i = 0; i < 100; i++) {
      const val = rng.range(5, 15);
      expect(val).toBeGreaterThanOrEqual(5);
      expect(val).toBeLessThan(15);
    }
  });

  it('generates integers within rangeInt', () => {
    const rng = new PRNG(777);
    const seen = new Set<number>();
    for (let i = 0; i < 100; i++) {
      const val = rng.rangeInt(1, 6);
      expect(Number.isInteger(val)).toBe(true);
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(6);
      seen.add(val);
    }
    expect(seen.size).toBeGreaterThanOrEqual(4);
  });

  it('samples normally around mean with gaussian()', () => {
    const rng = new PRNG(12345);
    let sum = 0;
    const n = 1000;
    for (let i = 0; i < n; i++) {
      sum += rng.gaussian(10, 2);
    }
    const mean = sum / n;
    expect(mean).toBeGreaterThan(9.7);
    expect(mean).toBeLessThan(10.3);
  });

  it('chooses from array', () => {
    const rng = new PRNG(314);
    const items = ['dawn', 'golden', 'night'] as const;
    const seen = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const chosen = rng.choice(items);
      expect(items).toContain(chosen);
      seen.add(chosen);
    }
    expect(seen.size).toBe(3);
  });

  it('throws when choice is called on empty array', () => {
    const rng = new PRNG(1);
    expect(() => rng.choice([])).toThrow('empty array');
  });
});
