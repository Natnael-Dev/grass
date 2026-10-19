import * as THREE from 'three';
import { Renderer } from '../core/Renderer';
import { Loop } from '../core/Loop';
import { CameraRig } from '../camera/CameraRig';
import { Sky } from '../world/Sky';
import { Ridges } from '../world/Ridges';
import { TerrainMesh } from '../world/TerrainMesh';
import { Tree } from '../world/Tree';
import { Grass } from '../world/Grass';
import { Seeds } from '../world/Seeds';
import { Fireflies } from '../world/Fireflies';
import { MoodController } from '../world/MoodController';
import { getDefaultMood } from '../world/moods';
import { terrainHeight } from '../world/terrain';
import { BrushTrail } from '../world/BrushTrail';
import { GroundRaycaster } from '../input/GroundRaycaster';
import { Pointer } from '../input/Pointer';
import { KeyboardBrush } from '../input/KeyboardBrush';
import { GestureClassifier } from '../input/GestureClassifier';
import { HandCursor } from '../ui/HandCursor';
import { Vignette } from '../ui/Vignette';
import { HintLine } from '../ui/HintLine';
import { HintSequencer } from '../ui/HintSequencer';
import { Hud } from '../ui/Hud';
import { HowItWorks } from '../ui/HowItWorks';
import { ExitScreen } from '../ui/ExitScreen';
import { EasterEggs } from '../easter/eggs';
import { Entry } from '../ui/Entry';
import { safeStorage } from '../core/storage';
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
  public readonly seeds: Seeds;
  public readonly fireflies: Fireflies;
  public readonly moodController: MoodController;

  // Interaction & input systems
  public readonly pointer: Pointer;
  public readonly groundRaycaster: GroundRaycaster;
  public readonly brushTrail: BrushTrail;
  public readonly keyboardBrush: KeyboardBrush;
  public readonly gestureClassifier: GestureClassifier;
  public readonly handCursor: HandCursor;
  public readonly vignette: Vignette;

  // UI & Easter egg systems
  public readonly hintLine: HintLine;
  public readonly hintSequencer: HintSequencer;
  public readonly hud: Hud;
  public readonly howItWorks: HowItWorks;
  public readonly exitScreen: ExitScreen;
  public readonly easterEggs: EasterEggs;
  public readonly entryScreen: Entry;

  // Idle tracking
  private idleInactivityTimer = 0;
  public ee2Triggered = false;

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
  private keyupHandler: ((e: KeyboardEvent) => void) | null = null;
  private blurHandler: (() => void) | null = null;
  private visibilityHandler: (() => void) | null = null;

  constructor(options: AppOptions = {}) {
    this.flags = options.flags ?? parseFlags();
    this.capabilities = detectCapabilities(this.flags.quality);

    const savedMood = safeStorage.getSavedMood();
    const initialMood = this.flags.mood ?? savedMood ?? getDefaultMood();
    const savedMuted = safeStorage.getSavedMuted();
    const hintsSeen = safeStorage.getHintsSeen();

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
      muted: savedMuted,
      hintsSeen,
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
    this.cameraRig.setReducedMotion(this.capabilities.reducedMotion);

    this.sky = new Sky();
    this.ridges = new Ridges();
    this.terrain = new TerrainMesh();
    this.tree = new Tree();
    this.grass = new Grass({
      tier: this.store.getState().quality,
      seed: this.flags.seed,
    });
    this.seeds = new Seeds({ seed: this.flags.seed });
    this.fireflies = new Fireflies({
      seed: this.flags.seed,
      tier: this.store.getState().quality,
    });

    this.scene.add(this.sky.mesh);
    this.scene.add(this.ridges.group);
    this.scene.add(this.terrain.mesh);
    this.scene.add(this.grass.mesh);
    this.scene.add(this.tree.mesh);
    this.scene.add(this.seeds.mesh);
    this.scene.add(this.fireflies.mesh);

    // Vignette overlay
    this.vignette = new Vignette(undefined, {
      baseIntensity: this.moodController.state.vignette,
      reducedMotion: this.capabilities.reducedMotion,
    });

    // UI & Easter eggs initialization
    this.hintLine = new HintLine({
      reducedMotion: this.capabilities.reducedMotion,
    });

    this.hintSequencer = new HintSequencer({
      hintLine: this.hintLine,
      isTouch: this.capabilities.isTouch,
      hintsSeen,
      onComplete: () => {
        this.store.setState({ hintsSeen: true });
      },
    });

    this.howItWorks = new HowItWorks({
      onClose: () => {
        this.store.setState({ helpOpen: false });
      },
    });

    this.exitScreen = new ExitScreen({
      onRerun: () => {
        this.store.setState({ phase: 'running' });
      },
    });

    this.easterEggs = new EasterEggs({
      hintLine: this.hintLine,
      onExitTriggered: () => {
        this.triggerExit();
      },
      isHelpOpen: () => this.howItWorks.getIsOpen(),
    });
    EasterEggs.logConsoleGreeting();

    this.hud = new Hud({
      initialMood,
      initialMuted: savedMuted,
      onMoodChange: (m) => {
        this.setMood(m);
        safeStorage.setSavedMood(m);
      },
      onMuteToggle: (muted) => {
        this.setMuted(muted);
        safeStorage.setSavedMuted(muted);
      },
      onOpenHelp: () => {
        this.openHelp();
      },
      onUptimeMilestone3: () => {
        this.easterEggs.onUptime3Min();
      },
      onUptimeMilestone10: () => {
        this.easterEggs.onUptime10Min();
      },
    });

    this.entryScreen = new Entry({
      onEnter: ({ viaKeyboard }) => {
        this.enter(viaKeyboard);
      },
    });

    // Initial mood setup across all world systems
    this.applyCurrentMood();

    // Interaction systems
    this.pointer = new Pointer(this.canvas);
    this.groundRaycaster = new GroundRaycaster();
    this.brushTrail = new BrushTrail(this.store.getState().quality);
    this.keyboardBrush = new KeyboardBrush();
    this.handCursor = new HandCursor();
    this.gestureClassifier = new GestureClassifier();

    // Wire GestureClassifier events
    this.gestureClassifier.on('tap', (e) => {
      this.onTap(e.clientX, e.clientY);
    });

    this.gestureClassifier.on('holdStart', () => {
      this.setLying(true);
    });

    this.gestureClassifier.on('holdEnd', () => {
      this.setLying(false);
      this.hintSequencer.onLieDownEnd();
    });

    this.gestureClassifier.on('ee2Trigger', () => {
      this.ee2Triggered = true;
      this.easterEggs.onHold10s();
    });

    // Wire Pointer events into GestureClassifier, HUD activity and idle tracker
    this.pointer.onDown = (x, y) => {
      this.resetIdle();
      this.gestureClassifier.onPointerDown(x, y);
      this.hud.onPointerSceneActivity();
    };

    this.pointer.onMove = (x, y) => {
      this.resetIdle();
      this.gestureClassifier.onPointerMove(x, y);
      this.hud.onPointerSceneActivity();
    };

    this.pointer.onUp = (x, y) => {
      this.gestureClassifier.onPointerUp(x, y);
    };

    this.pointer.onCancel = () => {
      this.gestureClassifier.onPointerCancel();
    };

    this.canvas.addEventListener('pointerleave', () => {
      this.hud.onPointerLeaveScene();
    });

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
        this.fireflies.setTier(state.quality);
      }
      if (state.targetMood !== prev.targetMood) {
        this.moodController.setMood(state.targetMood);
      }
      if (state.reducedMotion !== prev.reducedMotion) {
        this.cameraRig.setReducedMotion(state.reducedMotion);
        this.vignette.setReducedMotion(state.reducedMotion);
      }
    });

    if (typeof window !== 'undefined') {
      this.keydownHandler = (e: KeyboardEvent) => {
        this.resetIdle();

        if (
          (typeof HTMLInputElement !== 'undefined' && e.target instanceof HTMLInputElement) ||
          (typeof HTMLTextAreaElement !== 'undefined' && e.target instanceof HTMLTextAreaElement) ||
          (typeof HTMLSelectElement !== 'undefined' && e.target instanceof HTMLSelectElement)
        ) {
          return;
        }

        if (this.easterEggs.onKeyDown(e)) {
          return;
        }

        if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
          if (this.howItWorks.getIsOpen()) {
            this.closeHelp();
          } else {
            this.openHelp();
          }
          return;
        }

        if (e.key === 'Escape') {
          if (this.howItWorks.getIsOpen()) {
            this.closeHelp();
            return;
          }
          if (this.exitScreen.getIsOpen()) {
            this.exitScreen.hide();
            this.store.setState({ phase: 'running' });
            return;
          }
        }

        if (e.key.toLowerCase() === 'm') {
          this.toggleMute();
          return;
        }

        this.gestureClassifier.onKeyDown(e);

        if (e.key === '1') {
          this.setMood('dawn');
          safeStorage.setSavedMood('dawn');
          this.hud.moodSwitch.setMood('dawn');
        } else if (e.key === '2') {
          this.setMood('golden');
          safeStorage.setSavedMood('golden');
          this.hud.moodSwitch.setMood('golden');
        } else if (e.key === '3') {
          this.setMood('night');
          safeStorage.setSavedMood('night');
          this.hud.moodSwitch.setMood('night');
        } else if (e.key === 'Enter') {
          this.spawnSeeds();
        }
      };

      this.keyupHandler = (e: KeyboardEvent) => {
        this.gestureClassifier.onKeyUp(e);
      };

      this.blurHandler = () => {
        this.gestureClassifier.reset();
      };

      this.visibilityHandler = () => {
        if (typeof document !== 'undefined' && document.hidden) {
          this.gestureClassifier.reset();
          this.hud.uptime.pause();
        } else if (typeof document !== 'undefined' && !document.hidden) {
          this.hud.uptime.resume();
        }
      };

      window.addEventListener('keydown', this.keydownHandler);
      window.addEventListener('keyup', this.keyupHandler);
      window.addEventListener('blur', this.blurHandler);
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', this.visibilityHandler);
      }
    }

    this.loop.subscribe((dt, elapsed) => {
      this.currentFps = dt > 0 ? 1 / dt : 60;

      this.moodController.update(dt);
      if (this.moodController.state.isFading) {
        this.applyCurrentMood();
      } else if (this.store.getState().mood !== this.moodController.state.currentMood) {
        this.store.setState({ mood: this.moodController.state.currentMood });
      }

      // 1. Gesture and Idle timers
      this.gestureClassifier.update();
      this.idleInactivityTimer += dt;
      if (this.idleInactivityTimer >= 25.0) {
        this.cameraRig.setIdle(true);
      }
      if (this.idleInactivityTimer >= 40.0) {
        this.hintSequencer.onIdle40s();
      }

      // 2. Parallax Target from Pointer NDC
      this.cameraRig.setParallaxTarget(this.pointer.state.ndcX, this.pointer.state.ndcY);

      // 3. Camera and World System updates
      this.cameraRig.update(dt);
      this.vignette.update(dt);
      this.sky.update(elapsed, this.cameraRig.camera.position);
      this.tree.update(elapsed);

      // Wind gust factor during idle
      const idleGustFactor = this.cameraRig.getIdleGustFactor();
      const effectiveWindStrength = this.moodController.state.windStrength * idleGustFactor;
      this.grass.uWindStrength.value = effectiveWindStrength;
      this.grass.update(elapsed, this.cameraRig.camera.position);

      // Fireflies and Seeds simulation updates
      this.fireflies.update(
        elapsed,
        this.moodController.state.firefliesAmount,
        this.renderer.gl.getPixelRatio(),
      );
      this.seeds.update(
        dt,
        this.grass.uWindDir.value,
        effectiveWindStrength,
        this.moodController.state.lightColor,
        this.renderer.gl.getPixelRatio(),
      );

      // 4. Process Virtual Keyboard Brush or Pointer
      this.keyboardBrush.update(dt);
      let groundHit: THREE.Vector3 | null = null;
      let groundSpeed = 0;
      let hasVirtualScreenPos = false;

      if (this.keyboardBrush.isActive) {
        this.resetIdle();
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
          const distPx = Math.hypot(this.pointer.state.deltaX, this.pointer.state.deltaY);
          if (distPx > 0) {
            this.hintSequencer.onBrush(distPx);
          }
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

      // 5. Brush Interaction: push into trail if hit ground and not in lie-down mode
      if (groundHit && !this.cameraRig.getIsLying()) {
        this.brushTrail.maybePush(groundHit, groundSpeed, this.cameraRig.camera.position);
      }

      // 6. Update brush trail spring response & pack into grass uniforms
      this.brushTrail.update(dt);
      this.brushTrail.writeUniforms(this.grass.uTrail.value, this.grass.uTrailCount);

      // 7. Update Hand Cursor
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
    this.vignette.setBaseIntensity(s.vignette);
  }

  public boot(): void {
    this.loop.start();
    this.store.setState({ phase: 'ready' });
    this.entryScreen.setReady();
  }

  public enter(viaKeyboard = false): void {
    this.cameraRig.startEntry();
    this.store.setState({ phase: 'running' });
    this.hintSequencer.start();
    this.hud.uptime.start();
    this.entryScreen.triggerEnter(viaKeyboard);
    if (viaKeyboard) {
      setTimeout(() => {
        this.hud.helpButton.focus();
      }, 950);
    }
  }

  public setQuality(tier: QualityTier): void {
    this.store.setState({ quality: tier });
    this.grass.setTier(tier);
    this.brushTrail.setTier(tier);
    this.fireflies.setTier(tier);
  }

  public setMood(mood: MoodName, immediate = false): void {
    this.store.setState({ targetMood: mood });
    this.moodController.setMood(mood, immediate);
    this.hud.moodSwitch.setMood(mood);
    safeStorage.setSavedMood(mood);
    if (immediate) {
      this.store.setState({ mood });
      this.applyCurrentMood();
    }
  }

  public setMuted(muted: boolean): void {
    this.store.setState({ muted });
    this.hud.soundToggle.setMuted(muted);
    safeStorage.setSavedMuted(muted);
  }

  public toggleMute(): void {
    const next = !this.store.getState().muted;
    this.setMuted(next);
  }

  public openHelp(): void {
    this.store.setState({ helpOpen: true });
    this.howItWorks.open(this.hud.helpButton);
  }

  public closeHelp(): void {
    this.store.setState({ helpOpen: false });
    this.howItWorks.close();
  }

  public triggerExit(): void {
    this.store.setState({ phase: 'exited' });
    this.exitScreen.show();
  }

  public onTap(clientX: number, clientY: number): void {
    this.resetIdle();
    this.hintSequencer.onTap();
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const ndcX = ((clientX - rect.left) / rect.width) * 2 - 1;
    const ndcY = -(((clientY - rect.top) / rect.height) * 2 - 1);

    const groundHit = this.groundRaycaster.intersect(
      this.cameraRig.camera,
      ndcX,
      ndcY,
      this.loop.getFrameCount(),
    );

    if (groundHit) {
      this.seeds.spawn(groundHit.x, groundHit.y, groundHit.z, this.store.getState().quality);

      // Tap brush impulse: radius x1.3, strength 1.0
      const distFromCam = groundHit.distanceTo(this.cameraRig.camera.position);
      const baseRadius = Math.min(3.0, Math.max(1.4, 1.4 + 0.05 * distFromCam));
      this.brushTrail.pushImpulse(groundHit.x, groundHit.z, baseRadius * 1.3, 1.0);
    }
  }

  public spawnSeeds(x?: number, z?: number): void {
    const spawnX = x ?? 0;
    const spawnZ = z ?? 0;
    const spawnY = terrainHeight(spawnX, spawnZ);
    this.seeds.spawn(spawnX, spawnY, spawnZ, this.store.getState().quality);
    const distFromCam = Math.hypot(
      spawnX - this.cameraRig.camera.position.x,
      spawnZ - this.cameraRig.camera.position.z,
    );
    const baseRadius = Math.min(3.0, Math.max(1.4, 1.4 + 0.05 * distFromCam));
    this.brushTrail.pushImpulse(spawnX, spawnZ, baseRadius * 1.3, 1.0);
  }

  public getSeedsCount(): number {
    return this.seeds.getActiveCount();
  }

  public getFirefliesCount(): number {
    return this.fireflies.getTierCount();
  }

  public setLying(lying: boolean): void {
    this.store.setState({ lying });
    this.cameraRig.setLying(lying);
    this.vignette.setLying(lying);
    this.handCursor.setHolding(lying);
    if (typeof document !== 'undefined') {
      if (lying) {
        document.body.classList.add('lying');
      } else {
        document.body.classList.remove('lying');
      }
    }
  }

  public setIdle(idle: boolean): void {
    this.cameraRig.setIdle(idle);
    if (!idle) {
      this.idleInactivityTimer = 0;
    }
  }

  public advanceIdle(seconds: number): void {
    this.idleInactivityTimer += seconds;
    if (this.idleInactivityTimer >= 25.0) {
      this.cameraRig.setIdle(true);
    }
  }

  public resetIdle(): void {
    this.idleInactivityTimer = 0;
    if (this.cameraRig.getIsIdle()) {
      this.cameraRig.setIdle(false);
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
    if (this.keyupHandler && typeof window !== 'undefined') {
      window.removeEventListener('keyup', this.keyupHandler);
      this.keyupHandler = null;
    }
    if (this.blurHandler && typeof window !== 'undefined') {
      window.removeEventListener('blur', this.blurHandler);
      this.blurHandler = null;
    }
    if (this.visibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
      this.visibilityHandler = null;
    }
    this.pointer.dispose();
    this.keyboardBrush.dispose();
    this.gestureClassifier.dispose();
    this.handCursor.dispose();
    this.vignette.dispose();
    this.hintLine.dispose();
    this.hintSequencer.dispose();
    this.hud.dispose();
    this.howItWorks.dispose();
    this.exitScreen.dispose();
    this.easterEggs.dispose();
    this.entryScreen.dispose();
    this.loop.dispose();
    this.sky.dispose();
    this.ridges.dispose();
    this.terrain.dispose();
    this.tree.dispose();
    this.grass.dispose();
    this.seeds.dispose();
    this.fireflies.dispose();
    this.statsOverlay?.dispose();
    this.renderer.dispose();
  }
}
