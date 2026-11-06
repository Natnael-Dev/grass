import * as THREE from 'three';
import { PRNG } from '../core/prng';

/**
 * Creates a seamlessly tiling 256x256 DataTexture for shader wind simulation.
 * Red channel: Low-frequency traveling gusts (M = 8 periods)
 * Green channel: High-frequency rapid flutter (M = 24 periods)
 * Blue & Alpha: 255
 */
export function createWindNoiseTexture(size = 256, seed = 1337): THREE.DataTexture {
  const prng = new PRNG(seed);
  const data = new Uint8Array(size * size * 4);

  // Periodic grid gradient tables for seamless tiling
  const mGust = 8;
  const mFlut = 24;

  const gustTable = new Float32Array(mGust * mGust);
  for (let i = 0; i < gustTable.length; i++) {
    gustTable[i] = prng.random();
  }

  const flutTable = new Float32Array(mFlut * mFlut);
  for (let i = 0; i < flutTable.length; i++) {
    flutTable[i] = prng.random();
  }

  function samplePeriodic(u: number, v: number, m: number, table: Float32Array): number {
    const x = u * m;
    const y = v * m;

    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const fx = x - x0;
    const fy = y - y0;

    // Hermite smoothstep
    const sx = fx * fx * (3.0 - 2.0 * fx);
    const sy = fy * fy * (3.0 - 2.0 * fy);

    const i0 = ((x0 % m) + m) % m;
    const i1 = (((x0 + 1) % m) + m) % m;
    const j0 = ((y0 % m) + m) % m;
    const j1 = (((y0 + 1) % m) + m) % m;

    const v00 = table[j0 * m + i0]!;
    const v10 = table[j0 * m + i1]!;
    const v01 = table[j1 * m + i0]!;
    const v11 = table[j1 * m + i1]!;

    const top = v00 * (1.0 - sx) + v10 * sx;
    const bot = v01 * (1.0 - sx) + v11 * sx;

    return top * (1.0 - sy) + bot * sy;
  }

  for (let y = 0; y < size; y++) {
    const v = y / size;
    for (let x = 0; x < size; x++) {
      const u = x / size;

      // Dual octave sampling
      const gust = samplePeriodic(u, v, mGust, gustTable);
      const flut = samplePeriodic(u, v, mFlut, flutTable);

      const idx = (y * size + x) * 4;
      data[idx] = Math.round(gust * 255); // R = gusts
      data[idx + 1] = Math.round(flut * 255); // G = flutter
      data[idx + 2] = 128; // B = neutral
      data[idx + 3] = 255; // A = full opacity
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat, THREE.UnsignedByteType);

  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;

  return texture;
}
