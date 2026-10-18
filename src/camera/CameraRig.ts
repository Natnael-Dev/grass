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

  // State flags & offsets
  private isLying = false;
  private lyingFactor = 0; // 0 = standing, 1 = lying
  private parallaxTargetX = 0; // -1 to 1
  private parallaxTargetY = 0; // -1 to 1
  private currentParallaxX = 0;
  private currentParallaxY = 0;

  // Entry animation
  private isEntering = false;
  private entryElapsed = 0;
  private readonly entryDuration = 1.4; // 1.4 seconds per vision doc

  // Base FOV
  private targetFov = 48;
  private baseFov = 48;

  constructor(options: CameraRigOptions = {}) {
    const initialAspect =
      options.aspect ??
      (typeof window !== 'undefined' ? window.innerWidth / window.innerHeight : 16 / 9);
    this.targetFov = initialAspect < 1.0 ? 55 : 48;
    this.baseFov = this.targetFov;

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
    this.camera.fov = this.baseFov + this.lyingFactor * 4;
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
    this.isLying = lying;
  }

  public getIsLying(): boolean {
    return this.isLying;
  }

  public getLyingFactor(): number {
    return this.lyingFactor;
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

    // 1. Smooth parallax spring
    this.currentParallaxX = damp(this.currentParallaxX, this.parallaxTargetX, 4, dt);
    this.currentParallaxY = damp(this.currentParallaxY, this.parallaxTargetY, 4, dt);

    // 2. Smooth lie-down transition (dips camera, increases pitch and fov)
    const targetLying = this.isLying ? 1 : 0;
    this.lyingFactor = damp(this.lyingFactor, targetLying, 3.5, dt);

    // 3. Entry ease-out
    if (this.isEntering) {
      this.entryElapsed += dt;
      const progress = Math.min(1, this.entryElapsed / this.entryDuration);
      // Cubic ease-out: 1 - (1 - t)^3
      const ease = 1 - (1 - progress) ** 3;
      const startY = this.basePosition.y + 0.9;
      const startZ = this.basePosition.z + 3.5;

      this.camera.position.y = startY + (this.basePosition.y - startY) * ease;
      this.camera.position.z = startZ + (this.basePosition.z - startZ) * ease;

      if (progress >= 1) {
        this.isEntering = false;
      }
    } else {
      // Normal standing/lying pose calculation
      const groundAtCam = terrainHeight(this.basePosition.x, this.basePosition.z);
      const standingY = groundAtCam + 1.65;
      const lyingY = groundAtCam + 0.38; // Dip pose height
      const targetY = standingY + (lyingY - standingY) * this.lyingFactor;

      // Parallax slight sway in XZ (±0.15 m)
      const swayX = this.currentParallaxX * 0.15;
      const swayZ = this.currentParallaxY * 0.08;

      this.camera.position.x = this.basePosition.x + swayX;
      this.camera.position.y = damp(this.camera.position.y, targetY, 6, dt);
      this.camera.position.z = damp(this.camera.position.z, this.basePosition.z + swayZ, 6, dt);
    }

    // 4. Ground clamp: camera NEVER clips terrain under any circumstances
    const groundClearance = terrainHeight(this.camera.position.x, this.camera.position.z) + 0.25;
    if (this.camera.position.y < groundClearance) {
      this.camera.position.y = groundClearance;
    }

    // 5. Look-at target with parallax offset & lie-down tilt (+14° upward pitch when lying)
    const targetLookAtY = this.baseLookAt.y + this.lyingFactor * 2.8 + this.currentParallaxY * 0.8;
    const targetLookAtX = this.baseLookAt.x + this.currentParallaxX * 1.5;

    this.currentLookAt.x = damp(this.currentLookAt.x, targetLookAtX, 4, dt);
    this.currentLookAt.y = damp(this.currentLookAt.y, targetLookAtY, 4, dt);
    this.currentLookAt.z = this.baseLookAt.z;

    this.camera.lookAt(this.currentLookAt);

    // 6. FOV adjustment: base + 4° when lying down
    const targetFov = this.baseFov + this.lyingFactor * 4;
    if (Math.abs(this.camera.fov - targetFov) > 0.01) {
      this.camera.fov = damp(this.camera.fov, targetFov, 4, dt);
      this.camera.updateProjectionMatrix();
    }
  }

  public dispose(): void {
    // No persistent DOM listeners; camera matrices cleaned by garbage collection
  }
}
