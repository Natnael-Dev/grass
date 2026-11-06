import { describe, it, expect } from 'vitest';
import { createBladeGeometry } from '../../src/world/grassGeometry';

describe('createBladeGeometry', () => {
  it('creates geometry with correct vertex and triangle counts per segment level', () => {
    // S = 4 (high tier) -> 2 * 4 + 1 = 9 vertices, 2 * 4 - 1 = 7 triangles
    const geom4 = createBladeGeometry(4);
    expect(geom4.attributes.position).toBeDefined();
    expect(geom4.attributes.position!.count).toBe(9);
    expect(geom4.index?.count).toBe(7 * 3);

    // S = 3 (medium tier) -> 2 * 3 + 1 = 7 vertices, 2 * 3 - 1 = 5 triangles
    const geom3 = createBladeGeometry(3);
    expect(geom3.attributes.position).toBeDefined();
    expect(geom3.attributes.position!.count).toBe(7);
    expect(geom3.index?.count).toBe(5 * 3);

    // S = 2 (low tier) -> 2 * 2 + 1 = 5 vertices, 2 * 2 - 1 = 3 triangles
    const geom2 = createBladeGeometry(2);
    expect(geom2.attributes.position).toBeDefined();
    expect(geom2.attributes.position!.count).toBe(5);
    expect(geom2.index?.count).toBe(3 * 3);
  });

  it('tapers width smoothly from base to tip', () => {
    const geom = createBladeGeometry(4);
    const pos = geom.attributes.position;
    expect(pos).toBeDefined();
    if (!pos) throw new Error('Missing position attribute');

    // Row 0 (base): left = -0.5, right = +0.5, y = 0
    expect(pos.getX(0)).toBeCloseTo(-0.5, 4);
    expect(pos.getX(1)).toBeCloseTo(0.5, 4);
    expect(pos.getY(0)).toBe(0);
    expect(pos.getY(1)).toBe(0);

    // Tip: x = 0, y = 1
    const tipIdx = pos.count - 1;
    expect(pos.getX(tipIdx)).toBe(0);
    expect(pos.getY(tipIdx)).toBe(1);

    // Mid rows get progressively narrower
    for (let i = 1; i < 4; i++) {
      const prevHalfWidth = pos.getX((i - 1) * 2 + 1);
      const currHalfWidth = pos.getX(i * 2 + 1);
      expect(currHalfWidth).toBeLessThan(prevHalfWidth);
      expect(currHalfWidth).toBeGreaterThan(0);
    }
  });

  it('computes valid bounding box and sphere', () => {
    const geom = createBladeGeometry(4);
    expect(geom.boundingBox).toBeDefined();
    expect(geom.boundingBox?.min.y).toBe(0);
    expect(geom.boundingBox?.max.y).toBe(1);
    expect(geom.boundingSphere).toBeDefined();
    expect(geom.boundingSphere?.radius).toBeGreaterThan(0.5);
  });
});
