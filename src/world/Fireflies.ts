import * as THREE from 'three';
import { mulberry32 } from '../core/prng';
import { terrainHeight } from './terrain';
import type { QualityTier } from '../core/types';
import firefliesVert from './shaders/fireflies.vert.glsl?raw';
import firefliesFrag from './shaders/fireflies.frag.glsl?raw';

export interface FirefliesOptions {
  seed?: number;
  tier?: QualityTier;
}

const TIER_FIREFLY_COUNTS: Record<QualityTier, number> = {
  high: 90,
  medium: 60,
  low: 30,
};

const MAX_FIREFLIES = 90;

export class Fireflies {
  public readonly mesh: THREE.Points;
  public readonly material: THREE.ShaderMaterial;
  private currentTier: QualityTier = 'high';

  // Direct typed uniform references for zero allocation updates
  public readonly uTime = { value: 0.0 };
  public readonly uPixelRatio = { value: 1.0 };
  public readonly uAmount = { value: 0.0 };
  public readonly uColor = { value: new THREE.Color(0xd9ff7a) };

  constructor(options: FirefliesOptions = {}) {
    const rng = mulberry32(options.seed ?? 1337);
    this.currentTier = options.tier ?? 'high';

    const positions = new Float32Array(MAX_FIREFLIES * 3);
    const phases = new Float32Array(MAX_FIREFLIES * 4);
    const sizes = new Float32Array(MAX_FIREFLIES);
    const blinkParams = new Float32Array(MAX_FIREFLIES * 2);

    for (let i = 0; i < MAX_FIREFLIES; i++) {
      // Meadow volume in front of camera
      const x = -35 + rng() * 70; // [-35, 35]
      const z = -30 + rng() * 45; // [-30, 15]
      const groundY = terrainHeight(x, z);
      const h = 0.25 + rng() * 1.95; // [0.25, 2.2] m above ground
      const y = groundY + h;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      // Lissajous phase and frequency variations
      phases[i * 4] = rng() * Math.PI * 2;
      phases[i * 4 + 1] = rng() * Math.PI * 2;
      phases[i * 4 + 2] = rng() * Math.PI * 2;
      phases[i * 4 + 3] = 0.7 + rng() * 0.6; // Speed multiplier

      // Point size: 6–14 px
      sizes[i] = 6.0 + rng() * 8.0;

      // Blink frequency (0.8–2.2 Hz) and random phase
      blinkParams[i * 2] = 0.8 + rng() * 1.4;
      blinkParams[i * 2 + 1] = rng() * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 4));
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aBlinkParams', new THREE.BufferAttribute(blinkParams, 2));

    const count = TIER_FIREFLY_COUNTS[this.currentTier];
    geometry.setDrawRange(0, count);

    this.material = new THREE.ShaderMaterial({
      vertexShader: firefliesVert,
      fragmentShader: firefliesFrag,
      uniforms: {
        uTime: this.uTime,
        uPixelRatio: this.uPixelRatio,
        uAmount: this.uAmount,
        uColor: this.uColor,
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.mesh = new THREE.Points(geometry, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
  }

  public setTier(tier: QualityTier): void {
    this.currentTier = tier;
    const count = TIER_FIREFLY_COUNTS[tier];
    this.mesh.geometry.setDrawRange(0, count);
  }

  public getTierCount(): number {
    return TIER_FIREFLY_COUNTS[this.currentTier];
  }

  public update(time: number, firefliesAmount: number, pixelRatio: number): void {
    this.uTime.value = time;
    this.uAmount.value = firefliesAmount;
    this.uPixelRatio.value = pixelRatio;

    // Save draw call entirely during daytime
    this.mesh.visible = firefliesAmount > 0.001;
  }

  public dispose(): void {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}
