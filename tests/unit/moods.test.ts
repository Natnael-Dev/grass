import { describe, it, expect } from 'vitest';
import { MOOD_PRESETS, getDefaultMood } from '../../src/world/moods';

describe('Mood Presets (design-system table compliance)', () => {
  it('defines dawn preset exactly per design-system table', () => {
    const dawn = MOOD_PRESETS.dawn;
    expect(dawn.skyTop).toBe('#4a5a9c');
    expect(dawn.skyMid).toBe('#c88fb0');
    expect(dawn.skyHorizon).toBe('#ffc9a3');
    expect(dawn.discColor).toBe('#fff0d0');
    expect(dawn.discElevationDeg).toBe(6);
    expect(dawn.discAzimuthDeg).toBe(35);
    expect(dawn.discSize).toBe(0.03);
    expect(dawn.discHalo).toBe(0.35);
    expect(dawn.lightColor).toBe('#ffd9b8');
    expect(dawn.lightIntensity).toBe(0.9);
    expect(dawn.ambientColor).toBe('#8e86b8');
    expect(dawn.ambientIntensity).toBe(0.55);
    expect(dawn.grassBase).toBe('#2f6b4a');
    expect(dawn.grassTip).toBe('#a8d878');
    expect(dawn.terrainColor).toBe('#355f3d');
    expect(dawn.ridge).toEqual(['#7a6f9c', '#9a86a8', '#c09aac']);
    expect(dawn.fogColor).toBe('#e8b9a8');
    expect(dawn.fogDensity).toBe(0.02);
    expect(dawn.cloudColor).toBe('#ffd2c0');
    expect(dawn.cloudCover).toBe(0.45);
    expect(dawn.starsAmount).toBe(0);
    expect(dawn.firefliesAmount).toBe(0);
    expect(dawn.windStrength).toBe(0.75);
    expect(dawn.vignette).toBe(0.3);
    expect(dawn.audio).toEqual({ wind: 0.7, birds: 0.9, crickets: 0 });
  });

  it('defines golden preset exactly per design-system table', () => {
    const golden = MOOD_PRESETS.golden;
    expect(golden.skyTop).toBe('#5b8fd0');
    expect(golden.skyMid).toBe('#f0b27a');
    expect(golden.skyHorizon).toBe('#ffd89a');
    expect(golden.discColor).toBe('#fff3c4');
    expect(golden.discElevationDeg).toBe(14);
    expect(golden.discAzimuthDeg).toBe(30);
    expect(golden.discSize).toBe(0.036);
    expect(golden.discHalo).toBe(0.45);
    expect(golden.lightColor).toBe('#ffcf8a');
    expect(golden.lightIntensity).toBe(1.1);
    expect(golden.ambientColor).toBe('#a8a0b0');
    expect(golden.ambientIntensity).toBe(0.6);
    expect(golden.grassBase).toBe('#3d7a3a');
    expect(golden.grassTip).toBe('#d4e36a');
    expect(golden.terrainColor).toBe('#4a7a3a');
    expect(golden.ridge).toEqual(['#8a9a7a', '#b0a890', '#d6bf9a']);
    expect(golden.fogColor).toBe('#f3cf9f');
    expect(golden.fogDensity).toBe(0.016);
    expect(golden.cloudColor).toBe('#fff0d8');
    expect(golden.cloudCover).toBe(0.4);
    expect(golden.starsAmount).toBe(0);
    expect(golden.firefliesAmount).toBe(0);
    expect(golden.windStrength).toBe(0.9);
    expect(golden.vignette).toBe(0.22);
    expect(golden.audio).toEqual({ wind: 0.8, birds: 0.6, crickets: 0 });
  });

  it('defines night preset exactly per design-system table', () => {
    const night = MOOD_PRESETS.night;
    expect(night.skyTop).toBe('#060b24');
    expect(night.skyMid).toBe('#101b4a');
    expect(night.skyHorizon).toBe('#24366e');
    expect(night.discColor).toBe('#f4f1e0');
    expect(night.discElevationDeg).toBe(38);
    expect(night.discAzimuthDeg).toBe(25);
    expect(night.discSize).toBe(0.026);
    expect(night.discHalo).toBe(0.3);
    expect(night.lightColor).toBe('#8fa8ff');
    expect(night.lightIntensity).toBe(0.45);
    expect(night.ambientColor).toBe('#1c2a5c');
    expect(night.ambientIntensity).toBe(0.5);
    expect(night.grassBase).toBe('#0c2a2a');
    expect(night.grassTip).toBe('#2f6f5a');
    expect(night.terrainColor).toBe('#0d2a28');
    expect(night.ridge).toEqual(['#101a3c', '#16254f', '#1d2f62']);
    expect(night.fogColor).toBe('#0f1a3a');
    expect(night.fogDensity).toBe(0.02);
    expect(night.cloudColor).toBe('#3a4a8a');
    expect(night.cloudCover).toBe(0.35);
    expect(night.starsAmount).toBe(1);
    expect(night.firefliesAmount).toBe(1);
    expect(night.windStrength).toBe(0.55);
    expect(night.vignette).toBe(0.38);
    expect(night.audio).toEqual({ wind: 0.5, birds: 0, crickets: 0.9 });
  });
});

describe('getDefaultMood', () => {
  function makeDate(hour: number, minute = 0): Date {
    const d = new Date(2026, 9, 19, hour, minute);
    return d;
  }

  it('resolves dawn between 05:00 and 09:59', () => {
    expect(getDefaultMood(makeDate(5, 0))).toBe('dawn');
    expect(getDefaultMood(makeDate(7, 30))).toBe('dawn');
    expect(getDefaultMood(makeDate(9, 59))).toBe('dawn');
  });

  it('resolves golden between 10:00 and 18:59', () => {
    expect(getDefaultMood(makeDate(10, 0))).toBe('golden');
    expect(getDefaultMood(makeDate(14, 0))).toBe('golden');
    expect(getDefaultMood(makeDate(18, 59))).toBe('golden');
  });

  it('resolves night from 19:00 to 04:59', () => {
    expect(getDefaultMood(makeDate(19, 0))).toBe('night');
    expect(getDefaultMood(makeDate(23, 30))).toBe('night');
    expect(getDefaultMood(makeDate(0, 0))).toBe('night');
    expect(getDefaultMood(makeDate(4, 59))).toBe('night');
  });

  it('prioritizes stored mood preference over local time', () => {
    expect(getDefaultMood(makeDate(12, 0), 'night')).toBe('night');
    expect(getDefaultMood(makeDate(2, 0), 'dawn')).toBe('dawn');
    expect(getDefaultMood(makeDate(6, 0), 'golden')).toBe('golden');
  });
});
