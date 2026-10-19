import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { Seeds, createSeedTexture } from '../../src/world/Seeds';

describe('SeedTexture', () => {
  it('creates a procedural 6-spoke seed texture with valid RGBA dimensions', () => {
    const texture = createSeedTexture();
    expect(texture).toBeInstanceOf(THREE.DataTexture);
    expect(texture.image.width).toBe(64);
    expect(texture.image.height).toBe(64);

    const data = texture.image.data!;
    expect(data).not.toBeNull();
    expect(data.length).toBe(64 * 64 * 4);

    // Verify center core has high alpha and non-zero brightness
    const centerIdx = (32 * 64 + 32) * 4;
    expect(data[centerIdx]!).toBeGreaterThan(200); // R
    expect(data[centerIdx + 3]!).toBeGreaterThan(200); // Alpha

    // Verify corners outside circle have 0 alpha
    const cornerIdx = 0; // (0, 0)
    expect(data[cornerIdx + 3]!).toBe(0);
  });
});

describe('Seeds Particle System', () => {
  let seeds: Seeds;

  beforeEach(() => {
    seeds = new Seeds({ seed: 42 });
  });

  it('initializes with a points mesh, shader material, and 0 active seeds', () => {
    expect(seeds.mesh).toBeInstanceOf(THREE.Points);
    expect(seeds.getActiveCount()).toBe(0);
    expect(seeds.mesh.visible).toBe(false);
  });

  it('spawns the exact configured seed counts by tier', () => {
    // High tier: 18 seeds
    seeds.spawn(0, 1, 0, 'high');
    expect(seeds.getActiveCount()).toBe(18);
    expect(seeds.mesh.visible).toBe(true);

    // Reset and test medium tier: 14 seeds
    seeds.clear();
    seeds.spawn(0, 1, 0, 'medium');
    expect(seeds.getActiveCount()).toBe(14);

    // Reset and test low tier: 10 seeds
    seeds.clear();
    seeds.spawn(0, 1, 0, 'low');
    expect(seeds.getActiveCount()).toBe(10);
  });

  it('initializes positions at spawn origin with upward velocity and valid lifetime', () => {
    seeds.spawn(5, 2, -10, 'high');
    const state = seeds.getSeedStates();
    expect(state.length).toBeGreaterThanOrEqual(18);

    const firstSeed = state[0]!;
    expect(firstSeed.active).toBe(true);
    expect(firstSeed.x).toBeCloseTo(5, 1);
    expect(firstSeed.y).toBeCloseTo(2, 1);
    expect(firstSeed.z).toBeCloseTo(-10, 1);

    // Upward velocity 1.2 - 2.4 m/s
    expect(firstSeed.vy).toBeGreaterThanOrEqual(1.2);
    expect(firstSeed.vy).toBeLessThanOrEqual(2.4);

    // Lifetime 3.5 - 5.5 s
    expect(firstSeed.lifetime).toBeGreaterThanOrEqual(3.5);
    expect(firstSeed.lifetime).toBeLessThanOrEqual(5.5);
  });

  it('simulates wind drift, drag, sink, and alpha fade correctly over time', () => {
    seeds.spawn(0, 2, 0, 'high');
    const windDir = new THREE.Vector2(1, 0); // Blowing along +X
    const windStrength = 1.0;
    const lightColor = new THREE.Color(1, 1, 1);

    // Check t = 0.05s (during 0.15s fade-in)
    seeds.update(0.05, windDir, windStrength, lightColor, 1.0);
    let first = seeds.getSeedStates()[0]!;
    expect(first.alpha).toBeCloseTo(0.05 / 0.15, 1);
    expect(first.vx).toBeGreaterThan(0); // Accelerated by wind in +X

    // Advance past fade-in to t = 0.5s (full alpha)
    seeds.update(0.45, windDir, windStrength, lightColor, 1.0);
    first = seeds.getSeedStates()[0]!;
    expect(first.alpha).toBeCloseTo(1.0, 1);

    // Advance to apex and past (t = 1.5s total), seed should sink
    seeds.update(1.0, windDir, windStrength, lightColor, 1.0);
    first = seeds.getSeedStates()[0]!;
    expect(first.vy).toBeLessThanOrEqual(0.0);

    // Advance past total lifetime (e.g. +6.0s), all seeds should expire and deactivate
    seeds.update(6.0, windDir, windStrength, lightColor, 1.0);
    expect(seeds.getActiveCount()).toBe(0);
    expect(seeds.mesh.visible).toBe(false);
  });

  it('recycles inactive particle slots in ring pool without leaking', () => {
    // Spawn multiple waves
    seeds.spawn(0, 0, 0, 'high');
    expect(seeds.getActiveCount()).toBe(18);

    const windDir = new THREE.Vector2(1, 0);
    const lightColor = new THREE.Color(1, 1, 1);

    // Advance 6s so they expire
    seeds.update(6.0, windDir, 1.0, lightColor, 1.0);
    expect(seeds.getActiveCount()).toBe(0);

    // Spawn again
    seeds.spawn(10, 0, 10, 'high');
    expect(seeds.getActiveCount()).toBe(18);
    const state = seeds.getSeedStates();
    expect(state[0]!.x).toBeCloseTo(10, 1);
  });

  it('disposes geometry, material, and texture without memory leak', () => {
    const geomDispose = vi.spyOn(seeds.mesh.geometry, 'dispose');
    const matDispose = vi.spyOn(seeds.material, 'dispose');

    seeds.dispose();

    expect(geomDispose).toHaveBeenCalled();
    expect(matDispose).toHaveBeenCalled();
  });
});
