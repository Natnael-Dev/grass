import { PRNG } from '../core/prng';
import { terrainHeight } from './terrain';

export interface GrassInstanceData {
  count: number;
  offset: Float32Array; // (x, y, z) per instance
  params: Float32Array; // (height, width, yaw, bend) per instance
  rand: Float32Array; // (r1, r2) per instance
}

export interface GrassGeneratorOptions {
  seed?: number;
  totalBlades?: number;
}

const CAM_BASE_X = 0;
const CAM_BASE_Z = 10;

const AREA_MIN_X = -60;
const AREA_MAX_X = 60;
const AREA_MIN_Z = -70;
const AREA_MAX_Z = 22;

const NEAR_RADIUS = 14;
const MID_RADIUS = 32;
const FAR_RADIUS = 70;

const NEAR_WEIGHT = 0.55;
const MID_WEIGHT = 0.35;
const _FAR_WEIGHT = 0.1;

/**
 * Generates deterministic grass blade instances distributed across distance rings.
 * Instances are Fisher-Yates shuffled so reducing instanceCount thins uniformly.
 */
export function generateGrassInstances(options: GrassGeneratorOptions = {}): GrassInstanceData {
  const seed = options.seed ?? 1337;
  const total = options.totalBlades ?? 90000;
  const prng = new PRNG(seed);

  const nearTarget = Math.round(total * NEAR_WEIGHT);
  const midTarget = Math.round(total * MID_WEIGHT);
  const farTarget = total - nearTarget - midTarget;

  const offset = new Float32Array(total * 3);
  const params = new Float32Array(total * 4);
  const rand = new Float32Array(total * 2);

  let nearCount = 0;
  let midCount = 0;
  let farCount = 0;
  let totalGenerated = 0;

  // Generate instances into rings
  while (totalGenerated < total) {
    const x = prng.range(AREA_MIN_X, AREA_MAX_X);
    const z = prng.range(AREA_MIN_Z, AREA_MAX_Z);
    const dist = Math.hypot(x - CAM_BASE_X, z - CAM_BASE_Z);

    let ring: 'near' | 'mid' | 'far' | null = null;
    let heightScale = 1.0;
    let widthScale = 1.0;

    if (dist < NEAR_RADIUS && nearCount < nearTarget) {
      ring = 'near';
      heightScale = 1.0;
      widthScale = 1.0;
      nearCount++;
    } else if (dist >= NEAR_RADIUS && dist < MID_RADIUS && midCount < midTarget) {
      ring = 'mid';
      heightScale = 1.15;
      widthScale = 1.6;
      midCount++;
    } else if (dist >= MID_RADIUS && dist <= FAR_RADIUS && farCount < farTarget) {
      ring = 'far';
      heightScale = 1.5;
      widthScale = 2.6;
      farCount++;
    }

    if (ring !== null) {
      const idx = totalGenerated;
      const y = terrainHeight(x, z);

      // Offset (x, y, z)
      offset[idx * 3] = x;
      offset[idx * 3 + 1] = y;
      offset[idx * 3 + 2] = z;

      // Params (height, width, yaw, bend)
      const h = prng.range(0.35, 0.9) * heightScale;
      const w = 0.045 * widthScale;
      const yaw = prng.range(0, Math.PI * 2);
      const bend = prng.range(-0.35, 0.35);

      params[idx * 4] = h;
      params[idx * 4 + 1] = w;
      params[idx * 4 + 2] = yaw;
      params[idx * 4 + 3] = bend;

      // Rand (r1, r2)
      rand[idx * 2] = prng.random();
      rand[idx * 2 + 1] = prng.random();

      totalGenerated++;
    }
  }

  // Seeded Fisher-Yates shuffle across instances
  for (let i = total - 1; i > 0; i--) {
    const j = Math.floor(prng.random() * (i + 1));

    // Swap offset (3 floats)
    const oX = offset[i * 3]!;
    const oY = offset[i * 3 + 1]!;
    const oZ = offset[i * 3 + 2]!;
    offset[i * 3] = offset[j * 3]!;
    offset[i * 3 + 1] = offset[j * 3 + 1]!;
    offset[i * 3 + 2] = offset[j * 3 + 2]!;
    offset[j * 3] = oX;
    offset[j * 3 + 1] = oY;
    offset[j * 3 + 2] = oZ;

    // Swap params (4 floats)
    const pH = params[i * 4]!;
    const pW = params[i * 4 + 1]!;
    const pY = params[i * 4 + 2]!;
    const pB = params[i * 4 + 3]!;
    params[i * 4] = params[j * 4]!;
    params[i * 4 + 1] = params[j * 4 + 1]!;
    params[i * 4 + 2] = params[j * 4 + 2]!;
    params[i * 4 + 3] = params[j * 4 + 3]!;
    params[j * 4] = pH;
    params[j * 4 + 1] = pW;
    params[j * 4 + 2] = pY;
    params[j * 4 + 3] = pB;

    // Swap rand (2 floats)
    const r1 = rand[i * 2]!;
    const r2 = rand[i * 2 + 1]!;
    rand[i * 2] = rand[j * 2]!;
    rand[i * 2 + 1] = rand[j * 2 + 1]!;
    rand[j * 2] = r1;
    rand[j * 2 + 1] = r2;
  }

  return {
    count: total,
    offset,
    params,
    rand,
  };
}
