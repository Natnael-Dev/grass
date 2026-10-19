import * as THREE from 'three';
import { Renderer } from '../core/Renderer';
import { Loop } from '../core/Loop';
import { CameraRig } from '../camera/CameraRig';
import { Sky } from '../world/Sky';
import { Ridges } from '../world/Ridges';
import { TerrainMesh } from '../world/TerrainMesh';
import { Tree } from '../world/Tree';
import { Grass } from '../world/Grass';
import { MoodController } from '../world/MoodController';
import { getDefaultMood } from '../world/moods';
import { terrainHeight } from '../world/terrain';
import { BrushTrail } from '../world/BrushTrail';
import { GroundRaycaster } from '../input/GroundRaycaster';
import { Pointer } from '../input/Pointer';
import { KeyboardBrush } from '../input/KeyboardBrush';
import { HandCursor } from '../ui/HandCursor';
import { parseFlags, type AppFlags, type QualityTier, type MoodName } from './flags';
import { detectCapabilities, type Capabilities } from './capabilities';
import { Store } from './store';
import { StatsOverlay } from '../debug/StatsOverlay';

export interface AppOptions {
  canvas?: HTMLCanvasElement;
  flags?: AppFlags;
}

export class App {
  public readonly canvas: HTMLCanvasElement;
  public readonly flags: AppFlags;
  public readonly capabilities: Capabilities;
  public readonly store: Store;
  public readonly scene: THREE.Scene;
  public readonly renderer: Renderer;
  public readonly cameraRig: CameraRig;
  public readonly loop: Loop;

  // World systems
  public readonly sky: Sky;
  public readonly ridges: Ridges;
  public readonly terrain: TerrainMesh;
  public readonly tree: Tree;
  public readonly grass: Grass;
  public readonly moodController: MoodController;

  // Interaction & input systems
  public readonly pointer: Pointer;
  public readonly groundRaycaster: GroundRaycaster;
  public readonly brushTrail: BrushTrail;
  public readonly keyboardBrush: KeyboardBrush;
  public readonly handCursor: HandCursor;

  // Pre-allocated scratch vectors to prevent per-frame GC allocations
  private readonly prevGroundHit = new THREE.Vector3();
  private hasPrevGroundHit = false;
  private readonly scratchGroundHit = new THREE.Vector3();
  private readonly scratchProjected = new THREE.Vector3();
  private readonly virtualScreenPos = { x: 0, y: 0 };

  // Debug overlay
  public readonly statsOverlay: StatsOverlay | null = null;
  private currentFps = 60;
  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;

  constructor(options: AppOptions = {}) {
    this.flags = options.flags ?? parseFlags();
    this.capabilities = detectCapabilities(this.flags.quality);

    const initialMood = this.flags.mood ?? getDefaultMood();
    this.moodController = new MoodController(initialMood);
    this.moodController.onMoodChange = (mood) => {
      this.store.setState({ mood, targetMood: mood });
      this.applyCurrentMood();
    };

    this.store = new Store({
      quality: this.capabilities.tier,
      reducedMotion: this.capabilities.reducedMotion,
      isTouch: this.capabilities.isTouch,
      mood: initialMood,
      targetMood: initialMood,
    });

    if (options.canvas) {
      this.canvas = options.canvas;
    } else {
      const foundCanvas = document.getElementById('scene') as HTMLCanvasElement | null;
      if (!foundCanvas) {
        throw new Error('Canvas element with id #scene not found in document.');
      }
      this.canvas = foundCanvas;
    }

    this.scene = new THREE.Scene();

    this.renderer = new Renderer({
      canvas: this.canvas,
      dprCap: this.capabilities.dprCap,
      antialias: true,
    });

    const initialAspect = (this.canvas.clientWidth || 800) / (this.canvas.clientHeight || 600);
    this.cameraRig = new CameraRig({ aspect: initialAspect });

    this.sky = new Sky();
    this.ridges = new Ridges();
    this.terrain = new TerrainMesh();
    this.tree = new Tree();
    this.grass = new Grass({
      tier: this.store.getState().quality,
      seed: this.flags.seed,
    });

    this.scene.add(this.sky.mesh);
    this.scene.add(this.ridges.group);
    this.scene.add(this.terrain.mesh);
    this.scene.add(this.grass.mesh);
    this.scene.add(this.tree.mesh);

    // Initial mood setup across all world systems
    this.applyCurrentMood();

    // Interaction systems
    this.pointer = new Pointer(this.canvas);
    this.groundRaycaster = new GroundRaycaster();
    this.brushTrail = new BrushTrail(this.store.getState().quality);
    this.keyboardBrush = new KeyboardBrush();
    this.handCursor = new HandCursor();

    if (this.flags.debug) {
      this.statsOverlay = new StatsOverlay();
    }

    this.loop = new Loop({ freeze: this.flags.freeze });

    this.renderer.setOnResize((width, height) => {
      const aspect = width / height;
      this.cameraRig.onResize(aspect);
    });

    this.store.subscribe((state, prev) => {
      if (state.quality !== prev.quality) {
        this.grass.setTier(state.quality);
        this.brushTrail.setTier(state.quality);
      }
      if (state.targetMood !== prev.targetMood) {
        this.moodController.setMood(state.targetMood);
      }
    });

    if (typeof window !== 'undefined') {
      this.keydownHandler = (e: KeyboardEvent) => {
        if (
          (typeof HTMLInputElement !== 'undefined' && e.target instanceof HTMLInputElement) ||
          (typeof HTMLTextAreaElement !== 'undefined' && e.target instanceof HTMLTextAreaElement) ||
          (typeof HTMLSelectElement !== 'undefined' && e.target instanceof HTMLSelectElement)
        ) {
          return;
        }

        if (e.key === '1') {
          this.setMood('dawn');
        } else if (e.key === '2') {
          this.setMood('golden');
        } else if (e.key === '3') {
          this.setMood('night');
        }
      };
      window.addEventListener('keydown', this.keydownHandler);
    }

    this.loop.subscribe((dt, elapsed) => {
      this.currentFps = dt > 0 ? 1 / dt : 60;

      this.moodController.update(dt);
      if (this.moodController.state.isFading) {
        this.applyCurrentMood();
      } else if (this.store.getState().mood !== this.moodController.state.currentMood) {
        this.store.setState({ mood: this.moodController.state.currentMood });
      }

      this.cameraRig.update(dt);
      this.sky.update(elapsed, this.cameraRig.camera.position);
      this.tree.update(elapsed);
      this.grass.update(elapsed, this.cameraRig.camera.position);

      // 1. Process Virtual Keyboard Brush or Pointer
      this.keyboardBrush.update(dt);
      let groundHit: THREE.Vector3 | null = null;
      let groundSpeed = 0;
      let hasVirtualScreenPos = false;

      if (this.keyboardBrush.isActive) {
        const kx = this.keyboardBrush.groundPos.x;
        const kz = this.keyboardBrush.groundPos.z;
        this.scratchGroundHit.set(kx, terrainHeight(kx, kz), kz);
        groundHit = this.scratchGroundHit;
        groundSpeed = this.keyboardBrush.speed;

        this.scratchProjected.copy(groundHit).project(this.cameraRig.camera);
        const canvasWidth = this.canvas.clientWidth || 800;
        const canvasHeight = this.canvas.clientHeight || 600;
        this.virtualScreenPos.x = (this.scratchProjected.x * 0.5 + 0.5) * canvasWidth;
        this.virtualScreenPos.y = (-this.scratchProjected.y * 0.5 + 0.5) * canvasHeight;
        hasVirtualScreenPos = true;
      } else {
        if (this.pointer.state.deltaX !== 0 || this.pointer.state.deltaY !== 0) {
          this.keyboardBrush.deactivate();
        }

        groundHit = this.groundRaycaster.intersect(
          this.cameraRig.camera,
          this.pointer.state.ndcX,
          this.pointer.state.ndcY,
          this.loop.getFrameCount(),
        );

        if (groundHit && this.hasPrevGroundHit) {
          const dist = Math.hypot(
            groundHit.x - this.prevGroundHit.x,
            groundHit.z - this.prevGroundHit.z,
          );
          const instSpeed = dt > 0 ? dist / dt : 0;
          this.pointer.recordGroundSpeed(instSpeed);
          this.prevGroundHit.copy(groundHit);
        } else if (groundHit) {
          this.pointer.recordGroundSpeed(0);
          this.prevGroundHit.copy(groundHit);
          this.hasPrevGroundHit = true;
        } else {
          this.pointer.recordGroundSpeed(0);
          this.hasPrevGroundHit = false;
        }

        groundSpeed = this.pointer.getSmoothedGroundSpeed();
      }

      // 2. Brush Interaction: push into trail if hit ground and not in lie-down mode
      if (groundHit && !this.cameraRig.getIsLying()) {
        this.brushTrail.maybePush(groundHit, groundSpeed, this.cameraRig.camera.position);
      }

      // 3. Update brush trail spring response & pack into grass uniforms
      this.brushTrail.update(dt);
      this.brushTrail.writeUniforms(this.grass.uTrail.value, this.grass.uTrailCount);

      // 4. Update Hand Cursor
      this.handCursor.update(
        dt,
        this.pointer.state,
        groundHit !== null,
        hasVirtualScreenPos ? this.virtualScreenPos : null,
        groundSpeed,
      );

      // Reset pointer deltas for the frame when advancing simulation
      if (dt > 0) {
        this.pointer.resetDelta();
      }

      this.renderer.render(this.scene, this.cameraRig.camera);

      if (this.statsOverlay) {
        const info = this.renderer.getDrawCallInfo();
        this.statsOverlay.update({
          fps: this.currentFps,
          tier: this.store.getState().quality,
          drawCalls: info.drawCalls,
          triangles: info.triangles,
          blades: this.grass.instanceCount,
        });
      }
    });
  }

  private applyCurrentMood(): void {
    const s = this.moodController.state;
    this.sky.applyMood(s);
    this.terrain.applyMood(s);
    this.grass.applyMood(s);
    this.ridges.applyMood(s);
    this.tree.applyMood(s);
  }

  public boot(): void {
    this.loop.start();
    this.store.setState({ phase: 'ready' });
  }

  public enter(): void {
    this.cameraRig.startEntry();
    this.store.setState({ phase: 'running' });
  }

  public setQuality(tier: QualityTier): void {
    this.store.setState({ quality: tier });
    this.grass.setTier(tier);
    this.brushTrail.setTier(tier);
  }

  public setMood(mood: MoodName, immediate = false): void {
    this.store.setState({ targetMood: mood });
    this.moodController.setMood(mood, immediate);
    if (immediate) {
      this.store.setState({ mood });
      this.applyCurrentMood();
    }
  }

  public step(dt: number): void {
    this.loop.step(dt);
  }

  public getStats(): {
    fps: number;
    tier: string;
    drawCalls: number;
    triangles: number;
    blades: number;
  } {
    const info = this.renderer.getDrawCallInfo();
    return {
      fps: this.currentFps,
      tier: this.store.getState().quality,
      drawCalls: info.drawCalls,
      triangles: info.triangles,
      blades: this.grass.instanceCount,
    };
  }

  public dispose(): void {
    if (this.keydownHandler && typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.keydownHandler);
      this.keydownHandler = null;
    }
    this.pointer.dispose();
    this.keyboardBrush.dispose();
    this.handCursor.dispose();
    this.loop.dispose();
    this.sky.dispose();
    this.ridges.dispose();
    this.terrain.dispose();
    this.tree.dispose();
    this.grass.dispose();
    this.statsOverlay?.dispose();
    this.renderer.dispose();
  }
}
