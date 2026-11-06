import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { GroundRaycaster } from '../../src/input/GroundRaycaster';
import { terrainHeight } from '../../src/world/terrain';

describe('GroundRaycaster', () => {
  let raycaster: GroundRaycaster;
  let camera: THREE.PerspectiveCamera;

  beforeEach(() => {
    raycaster = new GroundRaycaster();
    camera = new THREE.PerspectiveCamera(48, 16 / 9, 0.1, 900);
    const groundY = terrainHeight(0, 10);
    camera.position.set(0, groundY + 1.65, 10);
    camera.lookAt(0, 2.4, -22);
    camera.updateMatrixWorld(true);
  });

  it('intersects meadow ground for center-downward pointer', () => {
    // NDC (0, -0.5) points downwards towards foreground meadow
    const hit = raycaster.intersect(camera, 0, -0.5);
    expect(hit).not.toBeNull();
    if (hit) {
      expect(hit.z).toBeLessThan(10); // in front of camera
      expect(hit.z).toBeGreaterThan(-100);
      const expectedY = terrainHeight(hit.x, hit.z);
      // Binary refinement ensures accuracy within 1cm
      expect(Math.abs(hit.y - expectedY)).toBeLessThan(0.01);
    }
  });

  it('returns null when aiming at the high sky', () => {
    // NDC (0, 0.8) points into upper sky dome
    const hit = raycaster.intersect(camera, 0, 0.8);
    expect(hit).toBeNull();
  });

  it('supports direct ray intersection', () => {
    const ray = new THREE.Ray(
      new THREE.Vector3(0, 10, 0),
      new THREE.Vector3(0, -1, 0), // straight down
    );
    const hit = raycaster.intersectRay(ray);
    expect(hit).not.toBeNull();
    if (hit) {
      expect(hit.x).toBeCloseTo(0, 2);
      expect(hit.z).toBeCloseTo(0, 2);
      expect(hit.y).toBeCloseTo(terrainHeight(0, 0), 2);
    }
  });

  it('caches result for the same frameId and coordinates', () => {
    const hit1 = raycaster.intersect(camera, 0, -0.3, 101);
    const hit2 = raycaster.intersect(camera, 0, -0.3, 101);
    expect(hit1).toBe(hit2); // exact same object instance
  });

  it('recomputes when frameId changes or coordinates change', () => {
    const hit1 = raycaster.intersect(camera, 0, -0.3, 101)?.clone();
    const hit2 = raycaster.intersect(camera, 0.2, -0.3, 101);
    expect(hit1).toBeDefined();
    expect(hit2).not.toBeNull();
    if (hit1 && hit2) {
      expect(hit1.x).not.toEqual(hit2.x);
    }
  });
});
