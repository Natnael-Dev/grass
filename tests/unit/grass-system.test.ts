import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { Grass } from '../../src/world/Grass';

describe('Grass System', () => {
  it('constructs a single instanced mesh with full 90,000 blade capacity on high tier', () => {
    const grass = new Grass({ tier: 'high', seed: 1337 });
    expect(grass.mesh).toBeInstanceOf(THREE.Mesh);
    expect(grass.instanceCount).toBe(90000);
    expect(grass.uDensityComp.value).toBe(1.0);

    // Verify instanced attributes
    const geom = grass.mesh.geometry as THREE.InstancedBufferGeometry;
    const offsetAttr = geom.getAttribute('offset');
    expect(offsetAttr).toBeDefined();
    expect(geom.getAttribute('params')).toBeDefined();
    expect(geom.getAttribute('rand')).toBeDefined();
    expect(offsetAttr.count).toBe(90000);

    grass.dispose();
  });

  it('switches tiers updating instanceCount and density compensation', () => {
    const grass = new Grass({ tier: 'high', seed: 1337 });

    // Switch to medium tier (45k blades, density comp = sqrt(2) ≈ 1.414)
    grass.setTier('medium');
    expect(grass.instanceCount).toBe(45000);
    expect(grass.uDensityComp.value).toBeCloseTo(Math.sqrt(2), 2);

    // Switch to low tier (18k blades, density comp clamped to 1.8)
    grass.setTier('low');
    expect(grass.instanceCount).toBe(18000);
    expect(grass.uDensityComp.value).toBe(1.8);

    grass.dispose();
  });

  it('updates uniforms and cleans up resources', () => {
    const grass = new Grass({ tier: 'medium' });
    const camPos = new THREE.Vector3(0, 1.65, 10);

    grass.update(3.14, camPos);
    expect(grass.uTime.value).toBe(3.14);
    expect(grass.uCamPos.value.z).toBe(10);

    expect(() => grass.dispose()).not.toThrow();
  });
});
