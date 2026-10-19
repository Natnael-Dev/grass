/**
 * Deterministic seeded pseudo-random number generator (Mulberry32).
 * Ensures reproducible grass instancing, terrain variations, and testing frames.
 */
export class PRNG {
  private seed: number;

  constructor(seed = 1337) {
    this.seed = seed >>> 0;
  }

  /**
   * Resets the PRNG to a given seed.
   */
  public reset(seed = 1337): void {
    this.seed = seed >>> 0;
  }

  /**
   * Returns a pseudo-random float in [0, 1).
   */
  public next(): number {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Alias for next() matching Math.random convention.
   */
  public random(): number {
    return this.next();
  }

  /**
   * Returns a float in [min, max).
   */
  public range(min: number, max: number): number {
    return min + (max - min) * this.next();
  }

  /**
   * Returns an integer in [min, max] inclusive.
   */
  public rangeInt(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  /**
   * Generates a normally-distributed random number via Box-Muller transform.
   */
  public gaussian(mean = 0, stdDev = 1): number {
    const u1 = Math.max(1e-7, this.next());
    const u2 = this.next();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0 * stdDev + mean;
  }

  /**
   * Randomly selects an element from an array.
   */
  public choice<T>(array: readonly T[]): T {
    if (array.length === 0) {
      throw new Error('PRNG.choice: Cannot select from an empty array');
    }
    const index = Math.floor(this.next() * array.length);
    const item = array[index];
    if (item === undefined) {
      throw new Error('PRNG.choice: Index out of bounds');
    }
    return item;
  }
}

/**
 * Returns a closure function generating pseudo-random floats in [0, 1).
 */
export function mulberry32(seed = 1337): () => number {
  const prng = new PRNG(seed);
  return () => prng.next();
}
