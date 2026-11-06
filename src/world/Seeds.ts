import * as THREE from 'three';
import { mulberry32 } from '../core/prng';
import { terrainHeight } from './terrain';
import type { QualityTier } from '../core/types';
import seedsVert from './shaders/seeds.vert.glsl?raw';
import seedsFrag from './shaders/seeds.frag.glsl?raw';

export interface SeedState {
  active: boolean;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  age: number;
  lifetime: number;
  baseSize: number;
  alpha: number;
}

export interface SeedsOptions {
  seed?: number;
  maxSeeds?: number;
}

const TIER_SPAWN_COUNTS: Record<QualityTier, number> = {
  high: 18,
  medium: 14,
  low: 10,
};

/**
 * Creates a procedural 64x64 6-spoke fluffy dandelion seed texture.
 */
export function createSeedTexture(): THREE.DataTexture {
  const size = 64;
  const data = new Uint8Array(size * size * 4);
  const half = size / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dx = (x + 0.5 - half) / (half - 2);
      const dy = (y + 0.5 - half) / (half - 2);
      const r = Math.sqrt(dx * dx + dy * dy);

      if (r > 1.0) {
        data[idx] = 255;
        data[idx + 1] = 255;
        data[idx + 2] = 255;
        data[idx + 3] = 0;
        continue;
      }

      const angle = Math.atan2(dy, dx);
      // 6-spoke symmetry: cos(6 * theta)
      const spokeVal = Math.cos(6.0 * angle);
      const spokeMask = Math.max(0, spokeVal);

      // Center core seed nut
      const core = Math.max(0, 1.0 - r / 0.18);

      // Radial primary filaments/spokes
      const filaments = Math.pow(spokeMask, 16.0) * Math.max(0, 1.0 - r * 0.9);

      // Fluffy outer feathering / parachute bristles between r=0.4 and r=0.95
      const featherR = Math.max(0, 1.0 - Math.abs(r - 0.72) / 0.28);
      const microBristles = 0.5 + 0.5 * Math.sin(36.0 * angle);
      const fluff = featherR * microBristles * (0.35 + 0.65 * spokeMask);

      // Combined alpha with smooth soft edge
      const edge = Math.max(0, 1.0 - r);
      const combined = Math.min(1.0, core * 1.5 + filaments * 1.2 + fluff * 0.85) * edge;

      const alphaByte = Math.round(Math.min(255, combined * 255));
      data[idx] = 255;
      data[idx + 1] = 255;
      data[idx + 2] = 255;
      data[idx + 3] = alphaByte;
    }
  }

  const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export class Seeds {
  public readonly mesh: THREE.Points;
  public readonly material: THREE.ShaderMaterial;
  private readonly texture: THREE.DataTexture;
  private readonly rng: () => number;

  public readonly uColor: { value: THREE.Color };
  public readonly uPixelRatio: { value: number };

  private readonly maxSeeds: number;
  private readonly seeds: SeedState[];
  private readonly positionsArray: Float32Array;
  private readonly alphasArray: Float32Array;
  private readonly sizesArray: Float32Array;

  private readonly positionAttr: THREE.BufferAttribute;
  private readonly alphaAttr: THREE.BufferAttribute;
  private readonly sizeAttr: THREE.BufferAttribute;

  private activeCount = 0;

  constructor(options: SeedsOptions = {}) {
    this.rng = mulberry32(options.seed ?? 1337);
    this.maxSeeds = options.maxSeeds ?? 64;

    this.seeds = [];
    for (let i = 0; i < this.maxSeeds; i++) {
      this.seeds.push({
        active: false,
        x: 0,
        y: 0,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        age: 0,
        lifetime: 0,
        baseSize: 14,
        alpha: 0,
      });
    }

    this.positionsArray = new Float32Array(this.maxSeeds * 3);
    this.alphasArray = new Float32Array(this.maxSeeds);
    this.sizesArray = new Float32Array(this.maxSeeds);

    const geometry = new THREE.BufferGeometry();
    this.positionAttr = new THREE.BufferAttribute(this.positionsArray, 3);
    this.alphaAttr = new THREE.BufferAttribute(this.alphasArray, 1);
    this.sizeAttr = new THREE.BufferAttribute(this.sizesArray, 1);

    geometry.setAttribute('position', this.positionAttr);
    geometry.setAttribute('aAlpha', this.alphaAttr);
    geometry.setAttribute('aSize', this.sizeAttr);

    this.texture = createSeedTexture();
    this.uColor = { value: new THREE.Color(1, 1, 1) };
    this.uPixelRatio = { value: 1.0 };

    this.material = new THREE.ShaderMaterial({
      vertexShader: seedsVert,
      fragmentShader: seedsFrag,
      uniforms: {
        uTexture: { value: this.texture },
        uColor: this.uColor,
        uPixelRatio: this.uPixelRatio,
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    this.mesh = new THREE.Points(geometry, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
  }

  /**
   * Spawns a cluster of dandelion seeds at the given ground location.
   */
  public spawn(x: number, y: number, z: number, tier: QualityTier): void {
    const count = TIER_SPAWN_COUNTS[tier] ?? 18;

    for (let c = 0; c < count; c++) {
      // Find inactive seed slot or displace the oldest
      let slot = this.seeds.findIndex((s) => !s.active);
      if (slot === -1) {
        // Displace oldest active seed
        let oldestIdx = 0;
        let maxAge = -1;
        for (let i = 0; i < this.seeds.length; i++) {
          const s = this.seeds[i];
          if (s && s.age > maxAge) {
            maxAge = s.age;
            oldestIdx = i;
          }
        }
        slot = oldestIdx;
      }

      const seed = this.seeds[slot];
      if (!seed) continue;
      const jitterX = (this.rng() - 0.5) * 0.2;
      const jitterZ = (this.rng() - 0.5) * 0.2;

      // Velocity: upward 1.2–2.4 m/s, horizontal 0.3–0.8 m/s in random direction
      const vy = 1.2 + this.rng() * 1.2;
      const hSpeed = 0.3 + this.rng() * 0.5;
      const angle = this.rng() * Math.PI * 2;
      const vx = Math.cos(angle) * hSpeed;
      const vz = Math.sin(angle) * hSpeed;

      seed.active = true;
      seed.x = x + jitterX;
      seed.y = y + 0.05;
      seed.z = z + jitterZ;
      seed.vx = vx;
      seed.vy = vy;
      seed.vz = vz;
      seed.age = 0;
      seed.lifetime = 3.5 + this.rng() * 2.0; // 3.5–5.5 s
      seed.baseSize = 10.0 + this.rng() * 8.0; // 10–18 px
      seed.alpha = 0;
    }

    this.rebuildBuffer();
    this.mesh.visible = true;
  }

  /**
   * Advance particle physics simulation.
   */
  public update(
    dt: number,
    windDir: THREE.Vector2,
    windStrength: number,
    lightColor: THREE.Color,
    pixelRatio: number,
  ): void {
    if (this.activeCount === 0 && !this.seeds.some((s) => s.active)) {
      this.mesh.visible = false;
      return;
    }

    this.uPixelRatio.value = pixelRatio;
    this.uColor.value.copy(lightColor);

    // Substep integration for numerical stability and large dt tolerance
    let remaining = dt;
    while (remaining > 0) {
      const stepDt = Math.min(remaining, 0.05);

      for (let i = 0; i < this.maxSeeds; i++) {
        const seed = this.seeds[i];
        if (!seed || !seed.active) continue;

        seed.age += stepDt;
        if (seed.age >= seed.lifetime) {
          seed.active = false;
          continue;
        }

        // Vertical physics: upward decelerates towards apex, then sinks at -0.25 m/s
        if (seed.vy > 0) {
          seed.vy = Math.max(0, seed.vy - 1.8 * stepDt);
        } else {
          // Sinks at 0.25 m/s after apex
          seed.vy = Math.max(-0.25, seed.vy - 1.2 * stepDt);
        }

        // Horizontal wind acceleration: 0.6 * windStrength along windDir
        const ax = windDir.x * (0.6 * windStrength);
        const az = windDir.y * (0.6 * windStrength);
        seed.vx += ax * stepDt;
        seed.vz += az * stepDt;

        // Linear horizontal drag: 0.8/s
        const dragFactor = Math.max(0, 1.0 - 0.8 * stepDt);
        seed.vx *= dragFactor;
        seed.vz *= dragFactor;

        // Update position
        seed.x += seed.vx * stepDt;
        seed.y += seed.vy * stepDt;
        seed.z += seed.vz * stepDt;

        // Ground settling check
        const groundY = terrainHeight(seed.x, seed.z);
        if (seed.y <= groundY) {
          seed.y = groundY;
          seed.vx = 0;
          seed.vy = 0;
          seed.vz = 0;
        }

        // Alpha calculation: fade in 0.15s, fade out last 1.0s
        let alpha = 1.0;
        if (seed.age < 0.15) {
          alpha = seed.age / 0.15;
        }
        const rem = seed.lifetime - seed.age;
        if (rem < 1.0) {
          alpha = Math.min(alpha, Math.max(0, rem / 1.0));
        }
        seed.alpha = alpha;
      }

      remaining -= stepDt;
    }

    let active = 0;
    for (let i = 0; i < this.maxSeeds; i++) {
      const s = this.seeds[i];
      if (s?.active) active++;
    }
    this.activeCount = active;

    if (active > 0) {
      this.rebuildBuffer();
      this.mesh.visible = true;
    } else {
      this.mesh.visible = false;
    }
  }

  private rebuildBuffer(): void {
    let count = 0;
    for (let i = 0; i < this.maxSeeds; i++) {
      const seed = this.seeds[i];
      if (!seed || !seed.active) {
        this.alphasArray[i] = 0;
        continue;
      }

      const pIdx = i * 3;
      this.positionsArray[pIdx] = seed.x;
      this.positionsArray[pIdx + 1] = seed.y;
      this.positionsArray[pIdx + 2] = seed.z;

      this.alphasArray[i] = seed.alpha;
      this.sizesArray[i] = seed.baseSize;
      count++;
    }

    this.activeCount = count;
    this.positionAttr.needsUpdate = true;
    this.alphaAttr.needsUpdate = true;
    this.sizeAttr.needsUpdate = true;
  }

  public getActiveCount(): number {
    return this.activeCount;
  }

  public getSeedStates(): readonly SeedState[] {
    return this.seeds;
  }

  public clear(): void {
    for (let i = 0; i < this.maxSeeds; i++) {
      const s = this.seeds[i];
      if (s) s.active = false;
      this.alphasArray[i] = 0;
    }
    this.activeCount = 0;
    this.mesh.visible = false;
    this.alphaAttr.needsUpdate = true;
  }

  public dispose(): void {
    this.mesh.geometry.dispose();
    this.material.dispose();
    this.texture.dispose();
  }
}
