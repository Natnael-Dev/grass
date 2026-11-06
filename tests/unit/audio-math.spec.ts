import { describe, it, expect } from 'vitest';
import {
  calculateWindGain,
  calculateRustleParams,
  generatePinkNoiseData,
  applyLoopCrossfade,
} from '../../src/audio/math';

describe('Audio Math & Synthesis Utilities', () => {
  describe('calculateWindGain', () => {
    it('applies the exact spec formula: mood.audioWind * (0.6 + 0.4 * windStrength)', () => {
      // Dawn mood: audio.wind = 0.7, windStrength = 0.75
      const dawnGain = calculateWindGain(0.7, 0.75);
      expect(dawnGain).toBeCloseTo(0.7 * (0.6 + 0.4 * 0.75), 5); // 0.7 * 0.9 = 0.63

      // Golden mood: audio.wind = 0.8, windStrength = 0.9
      const goldenGain = calculateWindGain(0.8, 0.9);
      expect(goldenGain).toBeCloseTo(0.8 * (0.6 + 0.4 * 0.9), 5); // 0.8 * 0.96 = 0.768

      // Night mood: audio.wind = 0.5, windStrength = 0.55
      const nightGain = calculateWindGain(0.5, 0.55);
      expect(nightGain).toBeCloseTo(0.5 * (0.6 + 0.4 * 0.55), 5); // 0.5 * 0.82 = 0.41

      // Zero wind
      expect(calculateWindGain(0, 1.0)).toBe(0);
      expect(calculateWindGain(0.8, 0)).toBeCloseTo(0.8 * 0.6, 5);
    });
  });

  describe('calculateRustleParams', () => {
    it('returns zero grains and zero gain when speed is 0', () => {
      const res = calculateRustleParams(0, 0, 0.016);
      expect(res.grainProbability).toBe(0);
      expect(res.grainGain).toBe(0);
    });

    it('caps grain rate at 12 grains/second at high speed', () => {
      // 12 grains/sec * 0.1s = 1.2 expected grains
      const resHigh = calculateRustleParams(2000, 1.0, 0.1);
      expect(resHigh.grainProbability).toBeCloseTo(1.2, 5);
      expect(resHigh.grainGain).toBeCloseTo(1.0, 2);
    });

    it('scales gain with brush strength', () => {
      const resHalf = calculateRustleParams(500, 0.5, 0.05);
      expect(resHalf.grainGain).toBeCloseTo(0.5, 2);
    });
  });

  describe('generatePinkNoiseData', () => {
    it('generates non-zero normalized audio samples within [-1.0, 1.0]', () => {
      const sampleRate = 44100;
      const length = 44100 * 2; // 2 seconds
      const data = generatePinkNoiseData(sampleRate, length);

      expect(data.length).toBe(length);

      let maxVal = 0;
      let sumSq = 0;
      for (let i = 0; i < length; i++) {
        const sample = data[i] ?? 0;
        const abs = Math.abs(sample);
        if (abs > maxVal) maxVal = abs;
        sumSq += sample * sample;
      }

      // Should be bounded within [-1, 1]
      expect(maxVal).toBeLessThanOrEqual(1.0);
      expect(maxVal).toBeGreaterThan(0.2);

      // RMS should be characteristic of pink noise (~0.1 to 0.4)
      const rms = Math.sqrt(sumSq / length);
      expect(rms).toBeGreaterThan(0.05);
      expect(rms).toBeLessThan(0.5);
    });

    it('seamlessly blends boundaries when loop crossfade is applied', () => {
      const length = 1000;
      const crossfadeLen = 100;
      const data = new Float32Array(length);
      for (let i = 0; i < length; i++) {
        data[i] = (i / length) * 2 - 1; // linear ramp
      }

      applyLoopCrossfade(data, crossfadeLen);

      // Start and end values should be close to eliminate audible clicks
      const first = data[0] ?? 0;
      const last = data[length - 1] ?? 0;
      const diff = Math.abs(first - last);
      expect(diff).toBeLessThan(0.05);
    });
  });
});
