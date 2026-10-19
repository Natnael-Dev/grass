import * as THREE from 'three';
import { Renderer } from '../core/Renderer';
import { Loop } from '../core/Loop';
import { CameraRig } from '../camera/CameraRig';
import { Sky } from '../world/Sky';
import { Ridges } from '../world/Ridges';
import { TerrainMesh } from '../world/TerrainMesh';
import { Tree } from '../world/Tree';
import { Grass } from '../world/Grass';
import { parseFlags, type AppFlags, type QualityTier } from './flags';
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

  // Debug overlay
  public readonly statsOverlay: StatsOverlay | null = null;
  private currentFps = 60;

  constructor(options: AppOptions = {}) {
    this.flags = options.flags ?? parseFlags();
    this.capabilities = detectCapabilities(this.flags.quality);

    this.store = new Store({
      quality: this.capabilities.tier,
      reducedMotion: this.capabilities.reducedMotion,
      isTouch: this.capabilities.isTouch,
      mood: this.flags.mood ?? 'golden',
      targetMood: this.flags.mood ?? 'golden',
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
      }
    });

    this.loop.subscribe((dt, elapsed) => {
      this.currentFps = dt > 0 ? 1 / dt : 60;

      this.cameraRig.update(dt);
      this.sky.update(elapsed, this.cameraRig.camera.position);
      this.tree.update(elapsed);
      this.grass.update(elapsed, this.cameraRig.camera.position);

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
