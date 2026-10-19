import { describe, it, expect } from 'vitest';
import { MoodController } from '../../src/world/MoodController';
import { MOOD_PRESETS } from '../../src/world/moods';

describe('MoodController', () => {
  it('initializes with requested preset values and accurate disc vectors', () => {
    const controller = new MoodController('golden');
    expect(controller.state.currentMood).toBe('golden');
    expect(controller.state.targetMood).toBe('golden');
    expect(controller.state.progress).toBe(1);
    expect(controller.state.isFading).toBe(false);

    expect(controller.state.discElevationDeg).toBe(MOOD_PRESETS.golden.discElevationDeg);
    expect(controller.state.discAzimuthDeg).toBe(MOOD_PRESETS.golden.discAzimuthDeg);
    expect(controller.state.lightIntensity).toBe(MOOD_PRESETS.golden.lightIntensity);

    // Vector length is normalized
    expect(controller.state.discDir.length()).toBeCloseTo(1.0, 5);
    expect(controller.state.sunDir.length()).toBeCloseTo(1.0, 5);
    expect(controller.state.discDir.y).toBeCloseTo(Math.sin((14 * Math.PI) / 180), 3);
  });

  it('samples 10-frame crossfade monotonically without jumps', () => {
    const controller = new MoodController('dawn');
    controller.setMood('night');

    expect(controller.state.isFading).toBe(true);
    expect(controller.state.currentMood).toBe('dawn');
    expect(controller.state.targetMood).toBe('night');

    const dt = MoodController.FADE_DURATION / 10;
    let prevElevation = controller.state.discElevationDeg; // Dawn 6 -> Night 38 (monotonically increases)
    let prevProgress = controller.state.progress;

    for (let frame = 1; frame <= 10; frame++) {
      controller.update(dt);

      expect(controller.state.progress).toBeGreaterThanOrEqual(prevProgress);
      expect(controller.state.discElevationDeg).toBeGreaterThanOrEqual(prevElevation);

      prevProgress = controller.state.progress;
      prevElevation = controller.state.discElevationDeg;
    }

    // After 10 frames (2.5s total), transition must be complete
    expect(controller.state.isFading).toBe(false);
    expect(controller.state.currentMood).toBe('night');
    expect(controller.state.progress).toBe(1);
    expect(controller.state.discElevationDeg).toBe(MOOD_PRESETS.night.discElevationDeg);
    expect(controller.state.lightIntensity).toBe(MOOD_PRESETS.night.lightIntensity);
    expect(controller.state.skyTop.getHexString()).toBe('060b24');
  });

  it('handles mid-fade retargeting smoothly without pops or discontinuities', () => {
    const controller = new MoodController('dawn');
    controller.setMood('golden');

    // Advance 1.0 second into the 2.5s crossfade
    controller.update(1.0);
    const midElevation = controller.state.discElevationDeg;
    const midLight = controller.state.lightIntensity;
    expect(controller.state.isFading).toBe(true);

    // Retarget to 'night' mid-flight
    controller.setMood('night');
    expect(controller.state.targetMood).toBe('night');
    expect(controller.state.isFading).toBe(true);

    // Next micro-step (16ms) must be continuous with mid state (no pop)
    controller.update(0.016);
    expect(Math.abs(controller.state.discElevationDeg - midElevation)).toBeLessThan(0.5);
    expect(Math.abs(controller.state.lightIntensity - midLight)).toBeLessThan(0.05);

    // Run until completion
    controller.update(2.5);
    expect(controller.state.isFading).toBe(false);
    expect(controller.state.currentMood).toBe('night');
    expect(controller.state.discElevationDeg).toBe(MOOD_PRESETS.night.discElevationDeg);
    expect(controller.state.skyTop.getHexString()).toBe('060b24');
  });

  it('supports immediate mode for instant transitions', () => {
    const controller = new MoodController('dawn');
    controller.setMood('night', true);

    expect(controller.state.isFading).toBe(false);
    expect(controller.state.currentMood).toBe('night');
    expect(controller.state.targetMood).toBe('night');
    expect(controller.state.progress).toBe(1);
    expect(controller.state.discElevationDeg).toBe(MOOD_PRESETS.night.discElevationDeg);
    expect(controller.state.skyTop.getHexString()).toBe('060b24');
  });
});
