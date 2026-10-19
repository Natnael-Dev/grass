import * as THREE from 'three';
import type { QualityTier } from '../core/types';

export interface TrailPoint {
  x: number;
  z: number;
  radius: number;
  strength: number;
  age: number;
}

export class BrushTrail {
  public static readonly TIER_CAPACITIES: Record<QualityTier, number> = {
    high: 16,
    medium: 12,
    low: 8,
  };

  public static readonly MAX_LIFE = 2.4; // 2.4 seconds response life

  private readonly pool: TrailPoint[];
  private activeCount = 0;
  private currentTier: QualityTier = 'high';
  private timeSinceLast = 999.0;

  constructor(tier: QualityTier = 'high') {
    this.currentTier = tier;
    // Pre-allocate 16 point objects in pool to guarantee ZERO runtime GC allocations
    this.pool = [];
    for (let i = 0; i < 16; i++) {
      this.pool.push({
        x: 0,
        z: 0,
        radius: 1.4,
        strength: 0.15,
        age: 0,
      });
    }
  }

  public get count(): number {
    return this.activeCount;
  }

  public get maxCapacity(): number {
    return BrushTrail.TIER_CAPACITIES[this.currentTier];
  }

  public getActivePoints(): readonly TrailPoint[] {
    return this.pool.slice(0, this.activeCount);
  }

  public setTier(tier: QualityTier): void {
    this.currentTier = tier;
    const max = this.maxCapacity;
    if (this.activeCount > max) {
      // Drop the oldest points by shifting newer ones forward
      const excess = this.activeCount - max;
      for (let i = 0; i < max; i++) {
        const src = this.pool[i + excess]!;
        const dst = this.pool[i]!;
        dst.x = src.x;
        dst.z = src.z;
        dst.radius = src.radius;
        dst.strength = src.strength;
        dst.age = src.age;
      }
      this.activeCount = max;
    }
  }

  public clear(): void {
    this.activeCount = 0;
    this.timeSinceLast = 999.0;
  }

  /**
   * Evaluates the spring response curve r(age) = exp(-2.4*age) * cos(6.0*age).
   * First overshoot (age < 1.0) is clamped to >= -0.12 (-12% overshoot).
   * Subsequent oscillations (age >= 1.0) are clamped to >= 0.0 to decay smoothly.
   */
  public static computeResponse(age: number): number {
    const raw = Math.exp(-2.4 * age) * Math.cos(6.0 * age);
    if (age < 1.0) {
      return Math.max(-0.12, raw);
    }
    return Math.max(0.0, raw);
  }

  /**
   * Attempts to push a new ground hit point into the trail ring buffer.
   * Pushes if moved >= 0.25m or >= 40ms since last push, with speed > 0.4 m/s.
   */
  public maybePush(
    hitPoint: { x: number; y: number; z: number },
    speed: number,
    cameraPos: { x: number; y: number; z: number },
  ): boolean {
    if (speed <= 0.4) {
      return false;
    }

    if (this.activeCount > 0) {
      const last = this.pool[this.activeCount - 1]!;
      const dist = Math.hypot(hitPoint.x - last.x, hitPoint.z - last.z);
      if (dist < 0.05) {
        return false;
      }
      if (dist < 0.25 && this.timeSinceLast < 0.04) {
        return false;
      }
    }

    const distFromCam = Math.hypot(
      hitPoint.x - cameraPos.x,
      hitPoint.y - cameraPos.y,
      hitPoint.z - cameraPos.z,
    );

    const radius = Math.min(3.0, Math.max(1.4, 1.4 + 0.05 * distFromCam));
    const strength = Math.min(1.0, Math.max(0.15, speed / 6.0));

    const max = this.maxCapacity;
    let targetIndex: number;

    if (this.activeCount < max) {
      targetIndex = this.activeCount;
      this.activeCount++;
    } else {
      // Ring buffer overflow: cycle oldest point object (index 0) to the end
      const oldest = this.pool[0]!;
      for (let i = 0; i < max - 1; i++) {
        this.pool[i] = this.pool[i + 1]!;
      }
      this.pool[max - 1] = oldest;
      targetIndex = max - 1;
    }

    const pt = this.pool[targetIndex]!;
    pt.x = hitPoint.x;
    pt.z = hitPoint.z;
    pt.radius = radius;
    pt.strength = strength;
    pt.age = 0.0;

    this.timeSinceLast = 0.0;
    return true;
  }

  /**
   * Updates all active points' age by dt and removes points that exceeded MAX_LIFE (2.4s).
   */
  public update(dt: number): void {
    this.timeSinceLast += dt;

    let writeIdx = 0;
    for (let readIdx = 0; readIdx < this.activeCount; readIdx++) {
      const p = this.pool[readIdx]!;
      p.age += dt;

      if (p.age <= BrushTrail.MAX_LIFE) {
        if (writeIdx !== readIdx) {
          // Swap references in pool array without allocating
          const temp = this.pool[writeIdx]!;
          this.pool[writeIdx] = this.pool[readIdx]!;
          this.pool[readIdx] = temp;
        }
        writeIdx++;
      }
    }

    this.activeCount = writeIdx;
  }

  /**
   * Writes active trail points into Grass shader uniform array uTrail[16].
   * Vector4 packing: (x, z, radius, strength * response(age))
   */
  public writeUniforms(targetVectors: THREE.Vector4[], countRef: { value: number }): void {
    for (let i = 0; i < this.activeCount; i++) {
      const p = this.pool[i]!;
      const r = BrushTrail.computeResponse(p.age);
      const vec = targetVectors[i];
      if (vec) {
        vec.set(p.x, p.z, p.radius, p.strength * r);
      }
    }

    for (let i = this.activeCount; i < targetVectors.length; i++) {
      const vec = targetVectors[i];
      if (vec) {
        vec.set(0, 0, 0, 0);
      }
    }

    countRef.value = this.activeCount;
  }
}
