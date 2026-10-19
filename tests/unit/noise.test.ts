import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { createWindNoiseTexture } from '../../src/world/noise';

describe('createWindNoiseTexture', () => {
  it('generates a 256x256 RGBA DataTexture with repeat wrapping and linear filtering', () => {
    const tex = createWindNoiseTexture(256, 1337);
    expect(tex).toBeInstanceOf(THREE.DataTexture);
    expect(tex.image.width).toBe(256);
    expect(tex.image.height).toBe(256);
    expect(tex.format).toBe(THREE.RGBAFormat);
    expect(tex.wrapS).toBe(THREE.RepeatWrapping);
    expect(tex.wrapT).toBe(THREE.RepeatWrapping);
    expect(tex.minFilter).toBe(THREE.LinearFilter);
    expect(tex.magFilter).toBe(THREE.LinearFilter);

    const data = tex.image.data;
    expect(data).toBeDefined();
    if (!data) throw new Error('Missing image data');
    expect(data.length).toBe(256 * 256 * 4);

    // Alpha channel should be 255
    expect(data[3]).toBe(255);
    expect(data[7]).toBe(255);
  });

  it('is deterministic for the same seed', () => {
    const tex1 = createWindNoiseTexture(64, 42);
    const tex2 = createWindNoiseTexture(64, 42);
    const data1 = tex1.image.data;
    const data2 = tex2.image.data;
    expect(data1).toBeDefined();
    expect(data2).toBeDefined();
    if (!data1 || !data2) throw new Error('Missing image data');

    let identical = true;
    for (let i = 0; i < data1.length; i++) {
      if (data1[i] !== data2[i]) {
        identical = false;
        break;
      }
    }
    expect(identical).toBe(true);
  });

  it('exhibits seamless continuity across texture edges', () => {
    const size = 128;
    const tex = createWindNoiseTexture(size, 1337);
    const data = tex.image.data;
    expect(data).toBeDefined();
    if (!data) throw new Error('Missing image data');

    // Compare left column (x = 0) and right column (x = size - 1)
    let maxDiffR = 0;
    for (let y = 0; y < size; y++) {
      const leftIdx = (y * size + 0) * 4;
      const rightIdx = (y * size + (size - 1)) * 4;
      const diffR = Math.abs(data[leftIdx]! - data[rightIdx]!);
      if (diffR > maxDiffR) maxDiffR = diffR;
    }

    // Because grid wraps seamlessly, adjacent boundary step is small (< 15 out of 255)
    expect(maxDiffR).toBeLessThan(15);
  });
});
