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
  it('settles to exact dip pose height (terrainHeight + 0.38m) < 0.6m when lying', () => {
    const rig = new CameraRig();
    rig.setLying(true);

    // Step 2.0s to allow full 1.1s ease-out to complete
    for (let i = 0; i < 40; i++) {
      rig.update(0.05);
    }

    const ground = terrainHeight(rig.camera.position.x, rig.camera.position.z);
    const heightAboveGround = rig.camera.position.y - ground;
    expect(heightAboveGround).toBeCloseTo(0.38, 2);
    expect(heightAboveGround).toBeLessThan(0.6); // Gate G5 requirement: <0.6 m above ground
    expect(rig.camera.fov).toBeCloseTo(52, 1); // 48 + 4
  });

  it('doubles parallax response when fully lying down', () => {
    const rigStanding = new CameraRig();
    rigStanding.setParallaxTarget(1.0, 1.0);
    for (let i = 0; i < 40; i++) {
      rigStanding.update(0.05);
    }
    const standingLookAtXOffset = rigStanding.getLookAt().x;

    const rigLying = new CameraRig();
    rigLying.setLying(true);
    for (let i = 0; i < 40; i++) {
      rigLying.update(0.05);
    }
    rigLying.setParallaxTarget(1.0, 1.0);
    for (let i = 0; i < 40; i++) {
      rigLying.update(0.05);
    }
    const lyingLookAtXOffset = rigLying.getLookAt().x;

    // Lying parallax response on look-at should be approximately double standing parallax
    expect(lyingLookAtXOffset).toBeGreaterThan(standingLookAtXOffset * 1.5);
  });

  it('supports reduced motion (300 ms linear transition without FOV change)', () => {
    const rig = new CameraRig();
    rig.setReducedMotion(true);
    rig.setLying(true);

    // After 0.35 s, should be fully lying
    for (let i = 0; i < 7; i++) {
      rig.update(0.05);
    }

    expect(rig.getLyingFactor()).toBe(1.0);
    // In reduced motion, FOV must remain at baseFov (48), no +4 change
    expect(rig.camera.fov).toBe(48);
  });

  it('triggers idle drift and returns to center within 0.4s when input resumes', () => {
    const rig = new CameraRig();
    rig.setIdle(true);

    // Step 2 seconds in idle
    for (let i = 0; i < 40; i++) {
      rig.update(0.05);
    }

    expect(rig.getIdleWeight()).toBeGreaterThan(0.8);
    expect(rig.getIdleGustFactor()).toBeGreaterThan(1.0);

    // End idle
    rig.setIdle(false);
    for (let i = 0; i < 10; i++) {
      rig.update(0.05); // 0.5s total (>= 0.4s)
    }

    expect(rig.getIdleWeight()).toBeCloseTo(0.0, 2);
  });

  it('verifies ground clearance clamp at 5 distinct sampled terrain positions', () => {
    const rig = new CameraRig();
    const sampleCoords = [
      { x: 0, z: 10 },
      { x: 10, z: 5 },
      { x: -15, z: 0 },
      { x: 5, z: -10 },
      { x: -20, z: -20 },
    ];

    for (const coord of sampleCoords) {
      // Force camera position to ground level or below
      rig.camera.position.set(coord.x, -50, coord.z);
      rig.update(0.016);

      const groundY = terrainHeight(rig.camera.position.x, rig.camera.position.z);
      expect(rig.camera.position.y).toBeGreaterThanOrEqual(groundY + 0.25);
    }
  });
});
