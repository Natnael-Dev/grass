import * as THREE from 'three';
import { terrainHeight } from '../world/terrain';
import { damp } from '../core/math';

export interface CameraRigOptions {
  aspect?: number;
}

export class CameraRig {
  public readonly camera: THREE.PerspectiveCamera;
  private readonly baseLookAt = new THREE.Vector3(0, 2.4, -22);
  private readonly currentLookAt = new THREE.Vector3();
  private basePosition = new THREE.Vector3();

  // Lie-down state & transitions
  private isLying = false;
  private lyingFactor = 0; // 0 = standing, 1 = lying
  private lyingTransitionActive = false;
  private lyingTransitionElapsed = 0;
  private lyingTransitionDuration = 1.1;
  private lyingTransitionStartFactor = 0;
  private lyingTransitionTargetFactor = 0;

  // Parallax state
  private parallaxTargetX = 0; // -1 to 1
  private parallaxTargetY = 0; // -1 to 1
  private currentParallaxX = 0;
  private currentParallaxY = 0;

  // Idle state
  private isIdle = false;
  private idleElapsed = 0;
  private idleWeight = 0;
  private idleGustElapsed = 0;
  private idleGustFactor = 1.0;

  // Reduced motion
  private reducedMotion = false;

  // Entry animation
  private isEntering = false;
  private entryElapsed = 0;
  private readonly entryDuration = 1.4; // 1.4 seconds per vision doc

  // Base FOV
  private baseFov = 48;

  constructor(options: CameraRigOptions = {}) {
    const initialAspect =
      options.aspect ??
      (typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 16 / 9);
    this.baseFov = initialAspect < 1.0 ? 55 : 48;

    this.camera = new THREE.PerspectiveCamera(this.baseFov, initialAspect, 0.1, 900);
    this.computeBasePosition();
    this.camera.position.copy(this.basePosition);
    this.currentLookAt.copy(this.baseLookAt);
    this.camera.lookAt(this.currentLookAt);
  }

  private computeBasePosition(): void {
    const groundY = terrainHeight(0, 10);
    this.basePosition.set(0, groundY + 1.65, 10);
  }

  public setAspect(aspect: number): void {
    this.camera.aspect = aspect;
    this.baseFov = aspect < 1.0 ? 55 : 48;
    const fovOffset = this.reducedMotion ? 0 : this.lyingFactor * 4;
    this.camera.fov = this.baseFov + fovOffset;
    this.camera.updateProjectionMatrix();
  }

  public onResize(aspect: number): void {
    this.setAspect(aspect);
  }

  public setParallaxTarget(x: number, y: number): void {
    this.parallaxTargetX = Math.max(-1, Math.min(1, x));
    this.parallaxTargetY = Math.max(-1, Math.min(1, y));
  }

  public setLying(lying: boolean): void {
    if (this.isLying === lying) return;
    this.isLying = lying;
    this.lyingTransitionActive = true;
    this.lyingTransitionElapsed = 0;
    this.lyingTransitionStartFactor = this.lyingFactor;
    this.lyingTransitionTargetFactor = lying ? 1.0 : 0.0;

    if (this.reducedMotion) {
      this.lyingTransitionDuration = 0.3; // 300 ms linear in reduced motion
    } else {
      this.lyingTransitionDuration = lying ? 1.1 : 0.9; // 1.1s entering, 0.9s releasing
    }
  }

  public getIsLying(): boolean {
    return this.isLying;
  }

  public getLyingFactor(): number {
    return this.lyingFactor;
  }

  public setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
  }

  public getReducedMotion(): boolean {
    return this.reducedMotion;
  }

  public setIdle(idle: boolean): void {
    if (this.isIdle !== idle) {
      this.isIdle = idle;
      if (idle) {
        this.idleElapsed = 0;
        this.idleGustElapsed = 0;
      }
    }
  }

  public getIsIdle(): boolean {
    return this.isIdle;
  }

  public getIdleWeight(): number {
    return this.idleWeight;
  }

  public getIdleGustFactor(): number {
    return this.idleGustFactor;
  }

  public getLookAt(): THREE.Vector3 {
    return this.currentLookAt.clone();
  }

  public startEntry(): void {
    this.isEntering = true;
    this.entryElapsed = 0;
    this.computeBasePosition();
    // Entry pose starts higher and further back: base + (0, 0.9, 3.5)
    this.camera.position.set(
      this.basePosition.x,
      this.basePosition.y + 0.9,
      this.basePosition.z + 3.5,
    );
  }

  public update(dt: number): void {
    this.computeBasePosition();

    // 1. Lie-down transition
    if (this.lyingTransitionActive) {
      this.lyingTransitionElapsed += dt;
      const progress = Math.min(1, this.lyingTransitionElapsed / this.lyingTransitionDuration);

      let eased = progress;
      if (!this.reducedMotion) {
        if (this.isLying) {
          // Entering: 1.1s cubic ease-out
          eased = 1 - (1 - progress) ** 3;
        } else {
          // Releasing: 0.9s cubic ease-in-out
          eased = progress < 0.5 ? 4 * progress ** 3 : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        }
      }

      this.lyingFactor =
        this.lyingTransitionStartFactor +
        (this.lyingTransitionTargetFactor - this.lyingTransitionStartFactor) * eased;

      if (progress >= 1) {
        this.lyingFactor = this.lyingTransitionTargetFactor;
        this.lyingTransitionActive = false;
      }
    }

    // 2. Parallax spring (critically damped spring with omega = 4)
    this.currentParallaxX = damp(this.currentParallaxX, this.parallaxTargetX, 4, dt);
    this.currentParallaxY = damp(this.currentParallaxY, this.parallaxTargetY, 4, dt);

    // 3. Idle drift & gust
    if (this.isIdle) {
      this.idleElapsed += dt;
      this.idleGustElapsed += dt;
      // Idle weight smoothly ramps in over 1.0s
      this.idleWeight = damp(this.idleWeight, 1.0, 3.0, dt);

      // 5s wind gust (strength x1.6)
      const gustT = Math.min(1, this.idleGustElapsed / 5.0);
      const gustBell = Math.sin(gustT * Math.PI);
      this.idleGustFactor = 1.0 + 0.6 * gustBell * this.idleWeight;
    } else {
      // Idle ends within 0.4s (exp(-12 * 0.4) < 0.01)
      this.idleWeight = damp(this.idleWeight, 0.0, 14.0, dt);
      if (this.idleWeight < 0.01) {
        this.idleWeight = 0;
      }
      this.idleGustFactor = damp(this.idleGustFactor, 1.0, 14.0, dt);
    }

    // 4. Entry ease-out vs normal camera positioning
    if (this.isEntering) {
      this.entryElapsed += dt;
      const progress = Math.min(1, this.entryElapsed / this.entryDuration);
      const ease = 1 - (1 - progress) ** 3;
      const startY = this.basePosition.y + 0.9;
      const startZ = this.basePosition.z + 3.5;

      this.camera.position.y = startY + (this.basePosition.y - startY) * ease;
      this.camera.position.z = startZ + (this.basePosition.z - startZ) * ease;

      if (progress >= 1) {
        this.isEntering = false;
      }
    } else {
      // Normal standing vs dip pose
      const groundAtCam = terrainHeight(this.basePosition.x, this.basePosition.z);
      const standingY = groundAtCam + 1.65;
      const lyingY = groundAtCam + 0.38; // Dip pose height
      const targetY = standingY + (lyingY - standingY) * this.lyingFactor;

      // Parallax slight sway in XZ (+-0.15 m)
      const swayX = this.currentParallaxX * 0.15;
      const swayZ = this.currentParallaxY * 0.08;

      this.camera.position.x = this.basePosition.x + swayX;
      this.camera.position.y = targetY;
      this.camera.position.z = this.basePosition.z + swayZ;
    }

    // 5. Ground clamp: camera NEVER clips terrain under any circumstances
    const groundClearance = terrainHeight(this.camera.position.x, this.camera.position.z) + 0.25;
    if (this.camera.position.y < groundClearance) {
      this.camera.position.y = groundClearance;
    }

    // 6. Look-at calculation with doubled parallax when lying & idle sinusoidal yaw drift
    // Parallax doubles when fully lying down
    const parallaxMultiplier = 1.0 + this.lyingFactor;
    let targetLookAtX = this.baseLookAt.x + this.currentParallaxX * 1.5 * parallaxMultiplier;
    const targetLookAtY =
      this.baseLookAt.y + this.lyingFactor * 2.8 + this.currentParallaxY * 0.8 * parallaxMultiplier;

    // Idle sinusoidal yaw drift: +-1.5 deg (0.026 rad) at 0.04 Hz
    if (this.idleWeight > 0) {
      const yawDriftRad =
        Math.sin(this.idleElapsed * 2.0 * Math.PI * 0.04) * (1.5 * (Math.PI / 180.0));
      // Over distance of 32m to look-at z
      targetLookAtX += Math.sin(yawDriftRad) * 32.0 * this.idleWeight;
    }

    this.currentLookAt.x = damp(this.currentLookAt.x, targetLookAtX, 4, dt);
    this.currentLookAt.y = damp(this.currentLookAt.y, targetLookAtY, 4, dt);
    this.currentLookAt.z = this.baseLookAt.z;

    this.camera.lookAt(this.currentLookAt);

    // 7. FOV adjustment: base + 4 deg when lying down (no change if reducedMotion)
    const fovOffset = this.reducedMotion ? 0 : this.lyingFactor * 4;
    const targetFov = this.baseFov + fovOffset;
    if (Math.abs(this.camera.fov - targetFov) > 0.01) {
      this.camera.fov = damp(this.camera.fov, targetFov, 4, dt);
      this.camera.updateProjectionMatrix();
    }
  }

  public dispose(): void {
    // No persistent DOM listeners
  }
}
