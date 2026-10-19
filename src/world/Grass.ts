import * as THREE from 'three';
import { createBladeGeometry } from './grassGeometry';
import { createWindNoiseTexture } from './noise';
import { generateGrassInstances, type GrassInstanceData } from './grassGenerator';
import type { QualityTier } from '../core/types';
import grassVert from './shaders/grass.vert.glsl?raw';
import grassFrag from './shaders/grass.frag.glsl?raw';

export interface GrassOptions {
  seed?: number;
  tier?: QualityTier;
}

export class Grass {
  public readonly mesh: THREE.Mesh;
  public readonly material: THREE.ShaderMaterial;
  private readonly noiseTexture: THREE.DataTexture;
  private readonly instanceData: GrassInstanceData;

  private readonly geometries: Record<QualityTier, THREE.InstancedBufferGeometry>;
  private currentTier: QualityTier = 'high';

  // Direct typed uniform references for zero allocation updates
  public readonly uTime = { value: 0.0 };
  public readonly uWindStrength = { value: 0.9 };
  public readonly uDensityComp = { value: 1.0 };
  public readonly uReduced = { value: 0.0 };
  public readonly uWindDir = { value: new THREE.Vector2(1.0, 0.2).normalize() };
  public readonly uNoise: { value: THREE.Texture };
  public readonly uTrail: { value: THREE.Vector4[] };
  public readonly uTrailCount = { value: 0 };
  public readonly uCamPos = { value: new THREE.Vector3() };

  // Mood uniforms (Golden preset defaults)
  public readonly uGrassBase = { value: new THREE.Color('#3d7a3a') };
  public readonly uGrassTip = { value: new THREE.Color('#d4e36a') };
  public readonly uLightColor = { value: new THREE.Color('#ffcf8a') };
  public readonly uLightIntensity = { value: 1.1 };
  public readonly uAmbientColor = { value: new THREE.Color('#a8a0b0') };
  public readonly uAmbientIntensity = { value: 0.6 };
  public readonly uSunDir = { value: new THREE.Vector3(0.485, 0.242, -0.84).normalize() };
  public readonly uFogColor = { value: new THREE.Color('#f3cf9f') };
  public readonly uFogDensity = { value: 0.016 };

  // Blade counts per tier from design-system.md:
  // high: 90,000, medium: 45,000, low: 18,000
  public static readonly TIER_COUNTS: Record<QualityTier, number> = {
    high: 90000,
    medium: 45000,
    low: 18000,
  };

  constructor(options: GrassOptions = {}) {
    const seed = options.seed ?? 1337;
    const initialTier = options.tier ?? 'high';

    this.noiseTexture = createWindNoiseTexture(256, seed);
    this.uNoise = { value: this.noiseTexture };

    // Initialize trail buffer of 16 Vector4s
    const trailVectors: THREE.Vector4[] = [];
    for (let i = 0; i < 16; i++) {
      trailVectors.push(new THREE.Vector4(0, 0, 0, 0));
    }
    this.uTrail = { value: trailVectors };

    // Generate full capacity (90k) seeded instances
    this.instanceData = generateGrassInstances({ totalBlades: 90000, seed });

    const offsetAttr = new THREE.InstancedBufferAttribute(this.instanceData.offset, 3);
    const paramsAttr = new THREE.InstancedBufferAttribute(this.instanceData.params, 4);
    const randAttr = new THREE.InstancedBufferAttribute(this.instanceData.rand, 2);

    // Pre-create instanced LOD geometries sharing instance buffers
    const baseGeomHigh = createBladeGeometry(4);
    const baseGeomMed = createBladeGeometry(3);
    const baseGeomLow = createBladeGeometry(2);

    this.geometries = {
      high: this.buildInstancedGeometry(baseGeomHigh, offsetAttr, paramsAttr, randAttr, 90000),
      medium: this.buildInstancedGeometry(baseGeomMed, offsetAttr, paramsAttr, randAttr, 45000),
      low: this.buildInstancedGeometry(baseGeomLow, offsetAttr, paramsAttr, randAttr, 18000),
    };

    this.material = new THREE.ShaderMaterial({
      vertexShader: grassVert,
      fragmentShader: grassFrag,
      side: THREE.DoubleSide,
      depthWrite: true,
      depthTest: true,
      uniforms: {
        uTime: this.uTime,
        uWindStrength: this.uWindStrength,
        uDensityComp: this.uDensityComp,
        uReduced: this.uReduced,
        uWindDir: this.uWindDir,
        uNoise: this.uNoise,
        uTrail: this.uTrail,
        uTrailCount: this.uTrailCount,
        uCamPos: this.uCamPos,
        uGrassBase: this.uGrassBase,
        uGrassTip: this.uGrassTip,
        uLightColor: this.uLightColor,
        uLightIntensity: this.uLightIntensity,
        uAmbientColor: this.uAmbientColor,
        uAmbientIntensity: this.uAmbientIntensity,
        uSunDir: this.uSunDir,
        uFogColor: this.uFogColor,
        uFogDensity: this.uFogDensity,
      },
    });

    this.mesh = new THREE.Mesh(this.geometries[initialTier], this.material);
    this.mesh.frustumCulled = false; // Manual bounds, always visible in vista
    this.setTier(initialTier);
  }

  private buildInstancedGeometry(
    base: THREE.BufferGeometry,
    offsetAttr: THREE.InstancedBufferAttribute,
    paramsAttr: THREE.InstancedBufferAttribute,
    randAttr: THREE.InstancedBufferAttribute,
    instanceCount: number,
  ): THREE.InstancedBufferGeometry {
    const instGeom = new THREE.InstancedBufferGeometry();
    instGeom.index = base.index;
    instGeom.setAttribute('position', base.getAttribute('position'));
    instGeom.setAttribute('normal', base.getAttribute('normal'));
    instGeom.setAttribute('uv', base.getAttribute('uv'));

    instGeom.setAttribute('offset', offsetAttr);
    instGeom.setAttribute('params', paramsAttr);
    instGeom.setAttribute('rand', randAttr);
    instGeom.instanceCount = instanceCount;

    return instGeom;
  }

  public setTier(tier: QualityTier): void {
    this.currentTier = tier;
    const targetCount = Grass.TIER_COUNTS[tier];

    this.mesh.geometry = this.geometries[tier];
    (this.mesh.geometry as THREE.InstancedBufferGeometry).instanceCount = targetCount;

    // Density compensation: widen blades when blade count is thinned (clamped 1.0 - 1.8)
    const ratio = Grass.TIER_COUNTS.high / targetCount;
    this.uDensityComp.value = Math.min(1.8, Math.max(1.0, Math.sqrt(ratio)));
  }

  public getTier(): QualityTier {
    return this.currentTier;
  }

  public get instanceCount(): number {
    return (
      (this.mesh.geometry as THREE.InstancedBufferGeometry).instanceCount ??
      Grass.TIER_COUNTS[this.currentTier]
    );
  }

  public update(time: number, camPos?: THREE.Vector3): void {
    this.uTime.value = time;
    if (camPos) {
      this.uCamPos.value.copy(camPos);
    }
  }

  public setSunDirection(sunDir: THREE.Vector3): void {
    this.uSunDir.value.copy(sunDir);
  }

  public applyMood(mood: {
    grassBase: THREE.Color;
    grassTip: THREE.Color;
    lightColor: THREE.Color;
    lightIntensity: number;
    ambientColor: THREE.Color;
    ambientIntensity: number;
    sunDir: THREE.Vector3;
    fogColor: THREE.Color;
    fogDensity: number;
    windStrength: number;
  }): void {
    this.uGrassBase.value.copy(mood.grassBase);
    this.uGrassTip.value.copy(mood.grassTip);
    this.uLightColor.value.copy(mood.lightColor);
    this.uLightIntensity.value = mood.lightIntensity;
    this.uAmbientColor.value.copy(mood.ambientColor);
    this.uAmbientIntensity.value = mood.ambientIntensity;
    this.uSunDir.value.copy(mood.sunDir);
    this.uFogColor.value.copy(mood.fogColor);
    this.uFogDensity.value = mood.fogDensity;
    this.uWindStrength.value = mood.windStrength;
  }

  public dispose(): void {
    this.noiseTexture.dispose();
    this.material.dispose();
    for (const key of Object.keys(this.geometries) as QualityTier[]) {
      this.geometries[key].dispose();
    }
  }
}
