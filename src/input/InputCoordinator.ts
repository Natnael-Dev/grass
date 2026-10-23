import * as THREE from 'three';
import { Pointer } from './Pointer';
import { GroundRaycaster } from './GroundRaycaster';
import { BrushTrail } from '../world/BrushTrail';
import { KeyboardBrush } from './KeyboardBrush';
import { HandCursor } from '../ui/HandCursor';
import { terrainHeight } from '../world/terrain';
import type { QualityTier } from '../core/types';

export interface InputCoordinatorOptions {
  canvas: HTMLCanvasElement;
  quality: QualityTier;
  reducedMotion: boolean;
  onTap?: (x: number, y: number) => void;
  onHoldStart?: () => void;
  onHoldEnd?: () => void;
  onEe2Trigger?: () => void;
  onPointerLeave?: () => void;
  onActivity?: () => void;
  onBrushDist?: (distPx: number) => void;
  onRustleSpeed?: (speed: number) => void;
}

export class InputCoordinator {
  public readonly pointer: Pointer;
  public readonly groundRaycaster: GroundRaycaster;
  public readonly brushTrail: BrushTrail;
  public readonly keyboardBrush: KeyboardBrush;
  public readonly handCursor: HandCursor;

  private prevGroundHit = new THREE.Vector3();
  private hasPrevGroundHit = false;
  private scratchGroundHit = new THREE.Vector3();
  private scratchProjected = new THREE.Vector3();
  private virtualScreenPos = new THREE.Vector2();

  private readonly canvas: HTMLCanvasElement;
  private readonly options: InputCoordinatorOptions;

  constructor(options: InputCoordinatorOptions) {
    this.options = options;
    this.canvas = options.canvas;

    this.pointer = new Pointer(this.canvas);
    this.groundRaycaster = new GroundRaycaster();
    this.brushTrail = new BrushTrail(options.quality);
    this.keyboardBrush = new KeyboardBrush();
    this.handCursor = new HandCursor();
    this.handCursor.setReducedMotion(options.reducedMotion);

    this.pointer.onDown = () => {
      this.options.onActivity?.();
    };

    this.pointer.onMove = () => {
      this.options.onActivity?.();
    };

    this.pointer.onLeave = () => {
      this.options.onPointerLeave?.();
    };

    this.pointer.onTap = (x, y) => {
      this.options.onTap?.(x, y);
    };

    this.pointer.onHoldStart = () => {
      this.options.onHoldStart?.();
    };

    this.pointer.onHoldEnd = () => {
      this.options.onHoldEnd?.();
    };

    this.pointer.onEe2Trigger = () => {
      this.options.onEe2Trigger?.();
    };
  }

  public update(
    dt: number,
    camera: THREE.Camera,
    frameCount: number,
  ): {
    ndcX: number;
    ndcY: number;
    groundHit: THREE.Vector3 | null;
  } {
    this.keyboardBrush.update(dt);
    let groundHit: THREE.Vector3 | null = null;
    let groundSpeed = 0;
    let rustleSpeed = 0;
    let hasVirtualScreenPos = false;

    if (this.keyboardBrush.isActive) {
      this.options.onActivity?.();
      const kx = this.keyboardBrush.groundPos.x;
      const kz = this.keyboardBrush.groundPos.z;
      this.scratchGroundHit.set(kx, terrainHeight(kx, kz), kz);
      groundHit = this.scratchGroundHit;
      groundSpeed = this.keyboardBrush.speed;
      rustleSpeed = this.keyboardBrush.speed > 0 ? 450 : 0;

      this.scratchProjected.copy(groundHit).project(camera);
      const canvasWidth = this.canvas.clientWidth || 800;
      const canvasHeight = this.canvas.clientHeight || 600;
      this.virtualScreenPos.x = (this.scratchProjected.x * 0.5 + 0.5) * canvasWidth;
      this.virtualScreenPos.y = (-this.scratchProjected.y * 0.5 + 0.5) * canvasHeight;
      hasVirtualScreenPos = true;
    } else {
      if (this.pointer.state.deltaX !== 0 || this.pointer.state.deltaY !== 0) {
        this.keyboardBrush.deactivate();
        const distPx = Math.hypot(this.pointer.state.deltaX, this.pointer.state.deltaY);
        if (distPx > 0) {
          this.options.onBrushDist?.(distPx);
          rustleSpeed = dt > 0 ? distPx / dt : 0;
        }
      }

      groundHit = this.groundRaycaster.intersect(
        camera,
        this.pointer.state.ndcX,
        this.pointer.state.ndcY,
        frameCount,
      );

      if (groundHit && this.hasPrevGroundHit) {
        const dist = Math.hypot(
          groundHit.x - this.prevGroundHit.x,
          groundHit.z - this.prevGroundHit.z,
        );
        const instSpeed = dt > 0 ? dist / dt : 0;
        this.pointer.recordGroundSpeed(instSpeed);
        groundSpeed = this.pointer.getSmoothedGroundSpeed();
      }
    }

    if (groundHit) {
      this.prevGroundHit.copy(groundHit);
      this.hasPrevGroundHit = true;
    } else {
      this.hasPrevGroundHit = false;
    }

    // Brush trail impulse
    if (groundHit && groundSpeed > 0.05) {
      const radius = Math.min(2.5, Math.max(0.6, groundSpeed * 0.15));
      const strength = Math.min(1.0, groundSpeed * 0.2);
      this.brushTrail.pushImpulse(groundHit.x, groundHit.z, radius, strength);
    }

    this.brushTrail.update(dt);
    this.options.onRustleSpeed?.(rustleSpeed);

    // Hand cursor update
    this.handCursor.update(
      dt,
      this.pointer.state,
      Boolean(groundHit),
      hasVirtualScreenPos ? this.virtualScreenPos : null,
      groundSpeed,
    );

    this.pointer.resetDelta();

    return {
      ndcX: this.pointer.state.ndcX,
      ndcY: this.pointer.state.ndcY,
      groundHit,
    };
  }

  public setTier(tier: QualityTier): void {
    this.brushTrail.setTier(tier);
  }

  public setReducedMotion(reduced: boolean): void {
    this.handCursor.setReducedMotion(reduced);
  }

  public setHolding(holding: boolean): void {
    this.handCursor.setHolding(holding);
  }

  public dispose(): void {
    this.pointer.dispose();
    this.keyboardBrush.dispose();
    this.handCursor.dispose();
  }
}
