import { describe, it, expect } from 'vitest';
import { CameraRig } from '../../src/camera/CameraRig';
import { terrainHeight } from '../../src/world/terrain';

describe('CameraRig', () => {
  it('initializes at base vista position', () => {
    const rig = new CameraRig({ aspect: 16 / 9 });
    const ground = terrainHeight(0, 10);

    expect(rig.camera.position.x).toBe(0);
    expect(rig.camera.position.y).toBeCloseTo(ground + 1.65, 2);
    expect(rig.camera.position.z).toBe(10);
    expect(rig.camera.fov).toBe(48);
  });

  it('adjusts FOV for portrait aspect ratios (< 1.0)', () => {
    const rig = new CameraRig({ aspect: 9 / 16 });
    expect(rig.camera.fov).toBe(55);

    rig.setAspect(16 / 9);
    expect(rig.camera.fov).toBe(48);
  });

  it('enforces ground clamp so camera never clips terrain', () => {
    const rig = new CameraRig();
    // Simulate low camera position
    rig.camera.position.set(0, -100, 10);
    rig.update(0.1);

    const ground = terrainHeight(rig.camera.position.x, rig.camera.position.z);
    expect(rig.camera.position.y).toBeGreaterThanOrEqual(ground + 0.25);
  });

  it('transitions to dip pose when lying down', () => {
    const rig = new CameraRig();
    const standingY = rig.camera.position.y;

    rig.setLying(true);
    expect(rig.getIsLying()).toBe(true);

    // Step forward 1.5 seconds of simulation
    for (let i = 0; i < 30; i++) {
      rig.update(0.05);
    }

    expect(rig.getLyingFactor()).toBeGreaterThan(0.9);
    expect(rig.camera.position.y).toBeLessThan(standingY - 0.8);
    expect(rig.camera.fov).toBeGreaterThan(48);
  });

  it('starts from higher entry pose and settles to base pose', () => {
    const rig = new CameraRig();
    rig.startEntry();

    const entryY = rig.camera.position.y;
    const entryZ = rig.camera.position.z;

    expect(entryY).toBeGreaterThan(terrainHeight(0, 10) + 1.65);
    expect(entryZ).toBe(13.5); // 10 + 3.5

    // Run 1.5 seconds (past 1.4s entry duration)
    for (let i = 0; i < 30; i++) {
      rig.update(0.05);
    }

    const ground = terrainHeight(0, 10);
    expect(rig.camera.position.y).toBeCloseTo(ground + 1.65, 1);
    expect(rig.camera.position.z).toBeCloseTo(10, 1);
  });
});
