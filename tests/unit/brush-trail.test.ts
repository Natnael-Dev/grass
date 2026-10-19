import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { BrushTrail } from '../../src/world/BrushTrail';

describe('BrushTrail', () => {
  let trail: BrushTrail;
  const cameraPos = new THREE.Vector3(0, 2.5, 10);

  beforeEach(() => {
    trail = new BrushTrail('high');
  });

  describe('Spring response curve', () => {
    it('evaluates to 1.0 at age 0', () => {
      expect(BrushTrail.computeResponse(0)).toBeCloseTo(1.0, 4);
    });

    it('crosses zero near 0.26s', () => {
      // 6 * 0.2618 = pi/2 -> cos(pi/2) = 0
      const r = BrushTrail.computeResponse(Math.PI / 12);
      expect(Math.abs(r)).toBeLessThan(0.01);
    });

    it('clamps first overshoot to >= -0.12 at ~0.46s', () => {
      const r = BrushTrail.computeResponse(0.46);
      expect(r).toBeCloseTo(-0.12, 2);
      expect(r).toBeGreaterThanOrEqual(-0.12);
    });

    it('clamps to >= 0 for age >= 1.0s to avoid subsequent negative oscillations', () => {
      // Test several points past 1.0s
      for (let t = 1.0; t <= 2.4; t += 0.2) {
        expect(BrushTrail.computeResponse(t)).toBeGreaterThanOrEqual(0.0);
      }
    });

    it('decays towards 0 as age reaches 2.4s', () => {
      const r = BrushTrail.computeResponse(2.4);
      expect(r).toBeLessThan(0.01);
    });
  });

  describe('Point insertion and ring buffer', () => {
    it('does not push point if speed <= 0.4 m/s', () => {
      const hit = new THREE.Vector3(0, 0, 0);
      const pushed = trail.maybePush(hit, 0.3, cameraPos);
      expect(pushed).toBe(false);
      expect(trail.count).toBe(0);
    });

    it('pushes point when speed > 0.4 m/s', () => {
      const hit = new THREE.Vector3(0, 0, 0);
      const pushed = trail.maybePush(hit, 1.2, cameraPos);
      expect(pushed).toBe(true);
      expect(trail.count).toBe(1);
    });

    it('clamps radius between 1.4 and 3.0 based on distance from camera', () => {
      // Near camera: dist = 2.0 -> 1.4 + 0.05 * 2 = 1.5
      const hitNear = new THREE.Vector3(0, 0, 8);
      trail.maybePush(hitNear, 1.0, cameraPos);
      const pNear = trail.getActivePoints()[0]!;
      expect(pNear.radius).toBeGreaterThanOrEqual(1.4);
      expect(pNear.radius).toBeLessThanOrEqual(3.0);

      trail.clear();
      // Far from camera: dist = 100 -> 1.4 + 0.05 * 100 = 6.4 -> clamped to 3.0
      const hitFar = new THREE.Vector3(0, 0, -90);
      trail.maybePush(hitFar, 1.0, cameraPos);
      const pFar = trail.getActivePoints()[0]!;
      expect(pFar.radius).toBe(3.0);
    });

    it('clamps strength between 0.15 and 1.0 based on speed / 6', () => {
      // Speed 0.6 m/s -> 0.6 / 6 = 0.1 -> clamped to 0.15
      trail.maybePush(new THREE.Vector3(0, 0, 0), 0.6, cameraPos);
      expect(trail.getActivePoints()[0]!.strength).toBe(0.15);

      trail.clear();
      // Speed 9.0 m/s -> 9.0 / 6 = 1.5 -> clamped to 1.0
      trail.maybePush(new THREE.Vector3(0, 0, 0), 9.0, cameraPos);
      expect(trail.getActivePoints()[0]!.strength).toBe(1.0);
    });

    it('enforces tier capacity (16 high, 12 medium, 8 low) by overwriting oldest', () => {
      trail.setTier('low'); // max 8
      expect(trail.maxCapacity).toBe(8);

      for (let i = 0; i < 12; i++) {
        // Advance time and position so each push is valid
        trail.update(0.05);
        trail.maybePush(new THREE.Vector3(i, 0, 0), 2.0, cameraPos);
      }

      expect(trail.count).toBe(8);
      // The newest point (x=11) should be in the active list
      const points = trail.getActivePoints();
      expect(points[points.length - 1]!.x).toBe(11);
    });

    it('expires and removes points older than 2.4s', () => {
      trail.maybePush(new THREE.Vector3(0, 0, 0), 2.0, cameraPos);
      expect(trail.count).toBe(1);

      trail.update(1.0);
      expect(trail.count).toBe(1);

      trail.update(1.5); // Total age 2.5s > 2.4s
      expect(trail.count).toBe(0);
    });

    it('writes packed uniform vectors zero-allocating', () => {
      const uTrail: THREE.Vector4[] = [];
      for (let i = 0; i < 16; i++) {
        uTrail.push(new THREE.Vector4(0, 0, 0, 0));
      }
      const uCount = { value: 0 };

      trail.maybePush(new THREE.Vector3(5, 0, -10), 3.0, cameraPos);
      trail.writeUniforms(uTrail, uCount);

      expect(uCount.value).toBe(1);
      expect(uTrail[0]!.x).toBe(5);
      expect(uTrail[0]!.y).toBe(-10); // z coordinate packed into y
      expect(uTrail[0]!.z).toBeCloseTo(trail.getActivePoints()[0]!.radius, 3);
      expect(uTrail[0]!.w).toBeCloseTo(0.5, 2); // 3.0/6 = 0.5 * 1.0 (response at t=0)
      expect(uTrail[1]!.w).toBe(0); // inactive vector is zeroed
    });
  });
});
