import { describe, it, expect } from 'vitest';
import { generateGrassInstances } from '../../src/world/grassGenerator';
import { terrainHeight } from '../../src/world/terrain';

describe('generateGrassInstances', () => {
  it('generates exact instance count with matching typed arrays', () => {
    const data = generateGrassInstances({ totalBlades: 1000, seed: 1337 });
    expect(data.count).toBe(1000);
    expect(data.offset.length).toBe(1000 * 3);
    expect(data.params.length).toBe(1000 * 4);
    expect(data.rand.length).toBe(1000 * 2);
  });

  it('is deterministic for identical seeds', () => {
    const data1 = generateGrassInstances({ totalBlades: 500, seed: 42 });
    const data2 = generateGrassInstances({ totalBlades: 500, seed: 42 });

    expect(data1.offset[0]).toBe(data2.offset[0]);
    expect(data1.offset[100]).toBe(data2.offset[100]);
    expect(data1.params[50]).toBe(data2.params[50]);
  });

  it('keeps all instances strictly within area bounds and snaps y to terrainHeight', () => {
    const data = generateGrassInstances({ totalBlades: 2000, seed: 1337 });
    const CAM_BASE_X = 0;
    const CAM_BASE_Z = 10;

    for (let i = 0; i < 2000; i++) {
      const x = data.offset[i * 3]!;
      const y = data.offset[i * 3 + 1]!;
      const z = data.offset[i * 3 + 2]!;

      expect(x).toBeGreaterThanOrEqual(-60);
      expect(x).toBeLessThanOrEqual(60);
      expect(z).toBeGreaterThanOrEqual(-70);
      expect(z).toBeLessThanOrEqual(22);

      const expectedY = terrainHeight(x, z);
      expect(y).toBeCloseTo(expectedY, 4);

      const dist = Math.hypot(x - CAM_BASE_X, z - CAM_BASE_Z);
      expect(dist).toBeLessThanOrEqual(70.1);
    }
  });

  it('adheres to ring density weights (55% near, 35% mid, 10% far) within +-5% at full and thinned tiers', () => {
    const total = 90000;
    const data = generateGrassInstances({ totalBlades: total, seed: 1337 });
    const CAM_BASE_X = 0;
    const CAM_BASE_Z = 10;

    function countRings(subsetCount: number): { near: number; mid: number; far: number } {
      let near = 0;
      let mid = 0;
      let far = 0;

      for (let i = 0; i < subsetCount; i++) {
        const x = data.offset[i * 3]!;
        const z = data.offset[i * 3 + 2]!;
        const dist = Math.hypot(x - CAM_BASE_X, z - CAM_BASE_Z);

        if (dist < 14) near++;
        else if (dist < 32) mid++;
        else far++;
      }

      return { near, mid, far };
    }

    // 1. Full 90k instances
    const full = countRings(90000);
    const nearRatioFull = full.near / 90000;
    const midRatioFull = full.mid / 90000;
    const farRatioFull = full.far / 90000;

    expect(nearRatioFull).toBeCloseTo(0.55, 1);
    expect(midRatioFull).toBeCloseTo(0.35, 1);
    expect(farRatioFull).toBeCloseTo(0.1, 1);

    // 2. Medium tier (first 45,000 instances after Fisher-Yates shuffle)
    const med = countRings(45000);
    expect(med.near / 45000).toBeGreaterThanOrEqual(0.5);
    expect(med.near / 45000).toBeLessThanOrEqual(0.6);
    expect(med.mid / 45000).toBeGreaterThanOrEqual(0.3);
    expect(med.mid / 45000).toBeLessThanOrEqual(0.4);
    expect(med.far / 45000).toBeGreaterThanOrEqual(0.06);
    expect(med.far / 45000).toBeLessThanOrEqual(0.15);

    // 3. Low tier (first 18,000 instances after Fisher-Yates shuffle)
    const low = countRings(18000);
    expect(low.near / 18000).toBeGreaterThanOrEqual(0.5);
    expect(low.near / 18000).toBeLessThanOrEqual(0.6);
    expect(low.mid / 18000).toBeGreaterThanOrEqual(0.3);
    expect(low.mid / 18000).toBeLessThanOrEqual(0.4);
    expect(low.far / 18000).toBeGreaterThanOrEqual(0.06);
    expect(low.far / 18000).toBeLessThanOrEqual(0.15);
  });
});
