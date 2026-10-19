import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as THREE from 'three';
import { Fireflies } from '../../src/world/Fireflies';
import { terrainHeight } from '../../src/world/terrain';

describe('Fireflies GPU Particle System', () => {
  let fireflies: Fireflies;

  beforeEach(() => {
    fireflies = new Fireflies({ seed: 1234 });
  });

  it('initializes Points mesh with AdditiveBlending and 90 total capacity', () => {
    expect(fireflies.mesh).toBeInstanceOf(THREE.Points);
    expect(fireflies.material).toBeInstanceOf(THREE.ShaderMaterial);
    expect(fireflies.material.blending).toBe(THREE.AdditiveBlending);
    expect(fireflies.material.transparent).toBe(true);
    expect(fireflies.material.depthWrite).toBe(false);

    const posAttr = fireflies.mesh.geometry.getAttribute('position');
    expect(posAttr).toBeDefined();
    expect(posAttr.count).toBe(90);
  });

  it('places home positions within meadow bounds and strictly above terrain', () => {
    const posAttr = fireflies.mesh.geometry.getAttribute('position');
    const positions = posAttr.array as Float32Array;

    for (let i = 0; i < posAttr.count; i++) {
      const x = positions[i * 3]!;
      const y = positions[i * 3 + 1]!;
      const z = positions[i * 3 + 2]!;

      expect(x).toBeGreaterThanOrEqual(-36);
      expect(x).toBeLessThanOrEqual(36);
      expect(z).toBeGreaterThanOrEqual(-31);
      expect(z).toBeLessThanOrEqual(16);

      const groundY = terrainHeight(x, z);
      expect(y).toBeGreaterThanOrEqual(groundY + 0.19);
      expect(y).toBeLessThanOrEqual(groundY + 2.3);
    }
  });

  it('controls active count via tier switching', () => {
    // Default is high (90)
    expect(fireflies.getTierCount()).toBe(90);
    expect(fireflies.mesh.geometry.drawRange.count).toBe(90);

    // Switch to medium (60)
    fireflies.setTier('medium');
    expect(fireflies.getTierCount()).toBe(60);
    expect(fireflies.mesh.geometry.drawRange.count).toBe(60);

    // Switch to low (30)
    fireflies.setTier('low');
    expect(fireflies.getTierCount()).toBe(30);
    expect(fireflies.mesh.geometry.drawRange.count).toBe(30);
  });

  it('toggles mesh visibility and updates uniform based on mood fireflies amount', () => {
    // Day mood: amount = 0 -> mesh.visible must be false (saving draw call)
    fireflies.update(1.0, 0.0, 1.0);
    expect(fireflies.mesh.visible).toBe(false);
    expect(fireflies.uAmount.value).toBe(0.0);

    // Night mood: amount = 1.0 -> mesh.visible must be true
    fireflies.update(2.0, 1.0, 1.0);
    expect(fireflies.mesh.visible).toBe(true);
    expect(fireflies.uAmount.value).toBe(1.0);
    expect(fireflies.uTime.value).toBe(2.0);

    // Crossfade: amount = 0.4 -> mesh.visible must be true
    fireflies.update(2.5, 0.4, 1.5);
    expect(fireflies.mesh.visible).toBe(true);
    expect(fireflies.uAmount.value).toBe(0.4);
    expect(fireflies.uPixelRatio.value).toBe(1.5);
  });

  it('disposes geometry and material without leaks', () => {
    const geomDispose = vi.spyOn(fireflies.mesh.geometry, 'dispose');
    const matDispose = vi.spyOn(fireflies.material, 'dispose');

    fireflies.dispose();

    expect(geomDispose).toHaveBeenCalled();
    expect(matDispose).toHaveBeenCalled();
  });
});
