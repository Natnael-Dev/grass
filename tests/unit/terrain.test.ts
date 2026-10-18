import { describe, it, expect } from 'vitest';
import { terrainHeight, terrainNormal, TREE_COORDS } from '../../src/world/terrain';

describe('analytic terrainHeight', () => {
  it('is deterministic', () => {
    for (let x = -50; x <= 50; x += 25) {
      for (let z = -60; z <= 10; z += 20) {
        expect(terrainHeight(x, z)).toBe(terrainHeight(x, z));
      }
    }
  });

  it('calculates the main hill crest height around (6, -26)', () => {
    const crestHeight = terrainHeight(TREE_COORDS.x, TREE_COORDS.z);
    expect(crestHeight).toBeGreaterThan(4.5);
    expect(crestHeight).toBeLessThan(6.0);
    expect(TREE_COORDS.y).toBe(crestHeight);
  });

  it('keeps terrain continuous without jumps', () => {
    const step = 0.01;
    for (let x = -20; x <= 20; x += 10) {
      for (let z = -30; z <= 0; z += 10) {
        const h0 = terrainHeight(x, z);
        const hx = terrainHeight(x + step, z);
        const hz = terrainHeight(x, z + step);
        expect(Math.abs(hx - h0)).toBeLessThan(0.05);
        expect(Math.abs(hz - h0)).toBeLessThan(0.05);
      }
    }
  });

  it('stays calmer and flatter near the camera (z > -4)', () => {
    const hCameraBase = terrainHeight(0, 10);
    expect(Math.abs(hCameraBase)).toBeLessThan(0.5);
  });

  it('calculates normalized surface normal with unit length', () => {
    const norm = terrainNormal(0, 0);
    const len = Math.hypot(norm.x, norm.y, norm.z);
    expect(len).toBeCloseTo(1.0, 5);
    expect(norm.y).toBeGreaterThan(0.9); // Mostly pointing up in flat areas
  });

  it('calculates surface normal slope on the hill', () => {
    const norm = terrainNormal(6, -20); // Side of the hill
    const len = Math.hypot(norm.x, norm.y, norm.z);
    expect(len).toBeCloseTo(1.0, 5);
    expect(norm.y).toBeGreaterThan(0.7); // Sloped but upwards
    expect(Math.abs(norm.z)).toBeGreaterThan(0.1); // Significant Z slope
  });
});
