import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { TerrainMesh } from '../../src/world/TerrainMesh';
import { Ridges } from '../../src/world/Ridges';
import { terrainHeight } from '../../src/world/terrain';

describe('TerrainMesh', () => {
  it('constructs a 160x160 plane geometry with 128x128 subdivisions', () => {
    const terrain = new TerrainMesh();
    expect(terrain.mesh).toBeInstanceOf(THREE.Mesh);
    expect(terrain.geometry).toBeInstanceOf(THREE.PlaneGeometry);

    const pos = terrain.geometry.attributes.position;
    expect(pos).toBeDefined();
    if (!pos) throw new Error('Missing position attribute');
    // 129 * 129 vertices
    expect(pos.count).toBe(129 * 129);

    // Verify elevations correspond to terrainHeight
    for (let i = 0; i < 100; i += 10) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = pos.getY(i);
      expect(y).toBeCloseTo(terrainHeight(x, z), 4);
    }

    terrain.dispose();
  });

  it('exposes mood uniforms and disposes cleanly', () => {
    const terrain = new TerrainMesh();
    expect(terrain.uTerrainColor.value.getHexString()).toBe('4a7a3a');
    expect(terrain.uFogColor.value.getHexString()).toBe('f3cf9f');
    expect(terrain.uFogDensity.value).toBe(0.016);

    const testDir = new THREE.Vector3(0, 1, 0);
    terrain.setSunDirection(testDir);
    expect(terrain.uSunDir.value.y).toBe(1);

    expect(() => terrain.dispose()).not.toThrow();
  });
});

describe('Ridges', () => {
  it('constructs 3 mountain silhouette ribbons at distinct depths', () => {
    const ridges = new Ridges();
    expect(ridges.group.children.length).toBe(3);

    const expectedZ = [-160, -230, -310];
    ridges.group.children.forEach((child, idx) => {
      expect(child).toBeInstanceOf(THREE.Mesh);
      const mesh = child as THREE.Mesh;
      const pos = mesh.geometry.attributes.position;
      expect(pos).toBeDefined();
      if (!pos) throw new Error('Missing position attribute');
      expect(pos.getZ(0)).toBe(expectedZ[idx]);
    });

    expect(() => ridges.dispose()).not.toThrow();
  });
});
