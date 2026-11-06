import * as THREE from 'three';
import { parseFlags, type AppFlags, type MoodName, type QualityTier } from './flags';
import { detectCapabilities, type Capabilities } from './capabilities';
import { Store } from './store';
import { safeStorage } from '../core/storage';
import { Renderer } from '../core/Renderer';
import { AdaptiveQuality } from '../core/AdaptiveQuality';
import { Loop } from '../core/Loop';
import { CameraRig } from '../camera/CameraRig';
import { Vignette } from '../ui/Vignette';
import { HintLine } from '../ui/HintLine';
import { HintSequencer } from '../ui/HintSequencer';
import { HowItWorks } from '../ui/HowItWorks';
import { EasterEggs } from '../easter/eggs';
import { Hud } from '../ui/Hud';
import { Entry } from '../ui/Entry';
import { FallbackScreen } from '../ui/FallbackScreen';
import { StatsOverlay } from '../debug/StatsOverlay';
import { WorldScene } from '../world/WorldScene';
import { AudioCoordinator } from '../audio/AudioCoordinator';
import { InputCoordinator } from '../input/InputCoordinator';

export interface AppOptions {
  canvas?: HTMLCanvasElement;
  search?: string;
}

export class App {
  public static readonly TIER_DPR_CAPS: Record<QualityTier, number> = {
    high: 2.0,
    medium: 1.5,
    low: 1.25,
  };

  public readonly flags: AppFlags;
  public readonly capabilities: Capabilities;
  public readonly store: Store;

  public readonly canvas: HTMLCanvasElement;
  public readonly renderer: Renderer;
  public readonly adaptiveQuality: AdaptiveQuality;
  public readonly cameraRig: CameraRig;
  public readonly loop: Loop;

  // Subsystem coordinators
  public readonly world: WorldScene;
  public readonly audio: AudioCoordinator;
  public readonly input: InputCoordinator;

  // UI systems
  public readonly vignette: Vignette;
  public readonly hintLine: HintLine;
  public readonly hintSequencer: HintSequencer;
  public readonly howItWorks: HowItWorks;
  public readonly easterEggs: EasterEggs;
  public readonly hud: Hud;
  public readonly entryScreen: Entry;
  public readonly fallbackScreen: FallbackScreen;
  public readonly statsOverlay: StatsOverlay | null = null;

  // Backward-compatibility references for debug bridge and tests
  public get scene(): THREE.Scene {
    return this.world.scene;
  }
  public get sky() {
    return this.world.sky;
  }
  public get ridges() {
    return this.world.ridges;
  }
  public get terrain() {
    return this.world.terrain;
  }
  public get tree() {
    return this.world.tree;
  }
  public get grass() {
    return this.world.grass;
  }
  public get seeds() {
    return this.world.seeds;
  }
  public get fireflies() {
    return this.world.fireflies;
  }
  public get moodController() {
    return this.world.moodController;
  }
  public get audioEngine() {
    return this.audio.engine;
  }
  public get wind() {
    return this.audio.wind;
  }
  public get rustle() {
    return this.audio.rustle;
  }
  public get crickets() {
    return this.audio.crickets;
  }
  public get birds() {
    return this.audio.birds;
  }
  public get sfx() {
    return this.audio.sfx;
  }
  public get pointer() {
    return this.input.pointer;
  }
  public get groundRaycaster() {
    return this.input.groundRaycaster;
  }
  public get brushTrail() {
    return this.input.brushTrail;
  }
  public get keyboardBrush() {
    return this.input.keyboardBrush;
  }
  public get handCursor() {
    return {
      isLying: () => false,
      setHolding: () => {},
      dispose: () => {},
    };
  }
  public get gestureClassifier() {
    return {
      getState: () => 'idle',
      isHolding: () => this.store.getState().lying,
      on: () => () => {},
      dispose: () => {},
    };
  }

  private currentFps = 60;
  private idleInactivityTimer = 0;
  private ee2Triggered = false;
  private contextLostTimeoutId: ReturnType<typeof setTimeout> | null = null;

  private keydownHandler: ((e: KeyboardEvent) => void) | null = null;
  private keyupHandler: ((e: KeyboardEvent) => void) | null = null;
  private blurHandler: (() => void) | null = null;
  private visibilityHandler: (() => void) | null = null;
  private motionMediaQuery: MediaQueryList | null = null;
  private motionMediaHandler: ((e: MediaQueryListEvent) => void) | null = null;

  constructor(options: AppOptions = {}) {
    this.flags = parseFlags(options.search);
    this.capabilities = detectCapabilities(this.flags.quality);

    const savedMood = safeStorage.getSavedMood();
    const savedMuted = safeStorage.getSavedMuted();
    const hintsSeen = safeStorage.getHintsSeen();

    const initialMood: MoodName = this.flags.mood ?? savedMood ?? 'golden';

    this.store = new Store({
      quality: this.capabilities.tier,
      mood: initialMood,
      targetMood: initialMood,
      muted: savedMuted,
      reducedMotion: this.capabilities.reducedMotion,
      isTouch: this.capabilities.isTouch,
      hintsSeen,
    });

    if (this.capabilities.isTouch && typeof document !== 'undefined') {
      document.body.classList.add('is-touch');
    }

    if (options.canvas) {
      this.canvas = options.canvas;
    } else {
      const foundCanvas = document.getElementById('scene') as HTMLCanvasElement | null;
      if (!foundCanvas) {
        throw new Error('Canvas element with id #scene not found in document.');
      }
      this.canvas = foundCanvas;
    }

    this.renderer = new Renderer({
      canvas: this.canvas,
      dprCap: App.TIER_DPR_CAPS[this.capabilities.tier],
      antialias: true,
      onContextLost: () => this.handleContextLost(),
      onContextRestored: () => this.handleContextRestored(),
    });

    const initialAspect = (this.canvas.clientWidth || 800) / (this.canvas.clientHeight || 600);
    this.adaptiveQuality = new AdaptiveQuality({
      initialTier: this.capabilities.tier,
      manualOverride: this.flags.quality !== null,
      onTierChange: (newTier, _prevTier, reason) => {
        this.applyTierChange(newTier, reason);
      },
    });

    this.cameraRig = new CameraRig({ aspect: initialAspect });
    this.cameraRig.setReducedMotion(this.capabilities.reducedMotion);

    // Initialize Subsystem Coordinators
    this.world = new WorldScene({
      tier: this.store.getState().quality,
      seed: this.flags.seed,
      reducedMotion: this.capabilities.reducedMotion,
      initialMood,
    });

    this.audio = new AudioCoordinator({ initialMuted: savedMuted });

    this.input = new InputCoordinator({
      canvas: this.canvas,
      quality: this.store.getState().quality,
      reducedMotion: this.capabilities.reducedMotion,
      onActivity: () => {
        if (!this.audio.isUnlocked()) {
          void this.audio.unlock();
        }
        this.resetIdle();
        this.hud.onPointerSceneActivity();
      },
      onPointerLeave: () => {
        this.hud.onPointerLeaveScene();
      },
      onTap: (x, y) => this.onTap(x, y),
      onHoldStart: () => this.setLying(true),
      onHoldEnd: () => {
        this.setLying(false);
        this.hintSequencer.onLieDownEnd();
      },
      onEe2Trigger: () => {
        this.ee2Triggered = true;
        this.easterEggs.onHold10s();
      },
      onBrushDist: (distPx) => {
        this.hintSequencer.onBrush(distPx);
      },
      onRustleSpeed: (speed) => {
        this.audio.onBrush(speed, 1.0, 0.016);
      },
    });

    // Vignette overlay
    this.vignette = new Vignette(undefined, {
      baseIntensity: this.world.moodController.state.vignette,
      reducedMotion: this.capabilities.reducedMotion,
    });

    // UI & Easter eggs
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

    this.easterEggs = new EasterEggs({
      hintLine: this.hintLine,
      onExitTriggered: () => this.triggerExit(),
      isHelpOpen: () => this.howItWorks.getIsOpen(),
    });
    EasterEggs.logConsoleGreeting();

    this.hud = new Hud({
      initialMood,
      initialMuted: savedMuted,
      onMoodChange: (m) => this.setMood(m),
      onMuteToggle: (muted) => this.setMuted(muted),
      onOpenHelp: () => this.openHelp(),
    });

    this.entryScreen = new Entry({
      onEnter: ({ viaKeyboard }) => this.enter(viaKeyboard),
    });
    this.entryScreen.setReducedMotion(this.capabilities.reducedMotion);

    this.fallbackScreen = new FallbackScreen();

    if (!this.audio.isSupported()) {
      this.hud.soundToggle.element.style.display = 'none';
    }

    if (this.flags.debug) {
      this.statsOverlay = new StatsOverlay();
    }

    this.loop = new Loop({ freeze: this.flags.freeze });

    this.renderer.setOnResize((width, height) => {
      this.cameraRig.onResize(width / height);
    });

    this.store.subscribe((state, prev) => {
      if (state.quality !== prev.quality) {
        this.world.setTier(state.quality);
        this.input.setTier(state.quality);
        this.renderer.setDprCap(App.TIER_DPR_CAPS[state.quality as QualityTier]);
      }
      if (state.targetMood !== prev.targetMood) {
        this.world.setMood(state.targetMood);
      }
      if (state.reducedMotion !== prev.reducedMotion) {
        this.cameraRig.setReducedMotion(state.reducedMotion);
        this.vignette.setReducedMotion(state.reducedMotion);
        this.world.setReducedMotion(state.reducedMotion);
        this.input.setReducedMotion(state.reducedMotion);
        this.hintLine.setReducedMotion(state.reducedMotion);
        this.entryScreen.setReducedMotion(state.reducedMotion);
      }
    });

    this.setupEventListeners();
    this.setupLoop();

    if (this.flags.compare) {
      this.renderer.setDprCap(1.0);
      if (this.flags.camera === 'lying') {
        this.setLying(true, true);
      }
    }

    if (!this.flags.ui) {
      if (this.hud?.element) this.hud.element.style.display = 'none';
      if (this.hintLine?.element) this.hintLine.element.style.display = 'none';
      if (this.entryScreen?.overlay) this.entryScreen.overlay.style.display = 'none';
      const overlay =
        typeof document !== 'undefined' ? document.getElementById('entry-overlay') : null;
      if (overlay) overlay.style.display = 'none';
      this.enter(false);
      if (this.flags.compare && this.flags.camera === 'lying') {
        this.setLying(true, true);
      }
    }
  }

  private setupEventListeners(): void {
    if (typeof window !== 'undefined' && window.matchMedia) {
      this.motionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.motionMediaHandler = (e: MediaQueryListEvent) => {
        this.store.setState({ reducedMotion: e.matches });
      };
      if (typeof this.motionMediaQuery.addEventListener === 'function') {
        this.motionMediaQuery.addEventListener('change', this.motionMediaHandler);
      } else {
        const legacyQuery = this.motionMediaQuery as unknown as {
          addListener?: (cb: (e: MediaQueryListEvent) => void) => void;
        };
        legacyQuery.addListener?.(this.motionMediaHandler);
      }
    }

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
        }

        if (e.key.toLowerCase() === 'm') {
          this.toggleMute();
          return;
        }

        if (e.key === '1') {
          this.setMood('dawn');
        } else if (e.key === '2') {
          this.setMood('golden');
        } else if (e.key === '3') {
          this.setMood('night');
        } else if (e.key === 'Enter') {
          this.spawnSeeds();
        }
      };

      this.blurHandler = () => {
        this.input.keyboardBrush.deactivate();
      };

      this.visibilityHandler = () => {
        if (typeof document !== 'undefined' && document.hidden) {
          this.audio.handleVisibilityChange(true);
        } else if (typeof document !== 'undefined' && !document.hidden) {
          this.audio.handleVisibilityChange(false);
        }
      };

      window.addEventListener('keydown', this.keydownHandler);
      window.addEventListener('blur', this.blurHandler);
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', this.visibilityHandler);
      }
    }
  }

  private setupLoop(): void {
    this.loop.subscribe((dt) => {
      this.currentFps = dt > 0 ? 1 / dt : 60;
      this.adaptiveQuality.recordFrame(dt);

      this.idleInactivityTimer += dt;
      if (this.idleInactivityTimer >= 25.0) {
        this.cameraRig.setIdle(true);
      }
      if (this.idleInactivityTimer >= 40.0) {
        this.hintSequencer.onIdle40s();
      }

      // Input coordination update
      const inputResult = this.input.update(dt, this.cameraRig.camera, this.loop.getFrameCount());

      // Parallax Target from Pointer NDC
      this.cameraRig.setParallaxTarget(inputResult.ndcX, inputResult.ndcY);

      const effectiveWindStrength = this.ee2Triggered ? 2.5 : 1.0;

      this.cameraRig.update(dt);
      this.vignette.update(dt);

      // World systems update
      this.world.update(
        dt,
        this.cameraRig.camera.position,
        effectiveWindStrength,
        this.renderer.gl.getPixelRatio(),
      );

      // Audio update
      this.audio.update(this.world.moodController.state.audio, effectiveWindStrength, dt);

      // Render 3D Scene
      this.renderer.render(this.world.scene, this.cameraRig.camera);

      if (this.statsOverlay) {
        const info = this.renderer.getDrawCallInfo();
        this.statsOverlay.update({
          fps: this.currentFps,
          tier: this.store.getState().quality,
          drawCalls: info.drawCalls,
          triangles: info.triangles,
          blades: this.world.grass.instanceCount,
        });
      }
    });
  }

  public handleContextLost(): void {
    this.loop.stop();
    this.fallbackScreen.showRecoveryToast();
    if (this.contextLostTimeoutId !== null) {
      clearTimeout(this.contextLostTimeoutId);
    }
    this.contextLostTimeoutId = setTimeout(() => {
      this.fallbackScreen.showFallback();
      this.contextLostTimeoutId = null;
    }, 5000);
  }

  public handleContextRestored(): void {
    if (this.contextLostTimeoutId !== null) {
      clearTimeout(this.contextLostTimeoutId);
      this.contextLostTimeoutId = null;
    }
    this.fallbackScreen.hideRecoveryToast();
    this.fallbackScreen.hideFallback();
    this.loop.start();
  }

  public boot(): void {
    this.loop.start();
    this.store.setState({ phase: 'ready' });
    this.entryScreen.setReady();
  }

  public enter(viaKeyboard = false): void {
    this.audio.startAmbience();
    this.cameraRig.startEntry();
    this.store.setState({ phase: 'running' });
    this.hintSequencer.start();
    this.entryScreen.triggerEnter(viaKeyboard);
    if (viaKeyboard) {
      const focusDelay = this.store.getState().reducedMotion ? 450 : 950;
      setTimeout(() => {
        this.hud.helpButton.focus();
      }, focusDelay);
    }
  }

  public setQuality(tier: QualityTier, lock = true): void {
    this.adaptiveQuality.setTier(tier, lock);
    this.applyTierChange(tier, lock ? 'Manual override' : 'API update');
  }

  private applyTierChange(tier: QualityTier, reason?: string): void {
    if (this.flags.debug && reason) {
      console.info(`[AdaptiveQuality] Switched tier to ${tier}: ${reason}`);
    }
    this.store.setState({ quality: tier });
  }

  public setMood(mood: MoodName, immediate = false): void {
    this.store.setState({ targetMood: mood });
    this.world.setMood(mood, immediate);
    this.hud.moodSwitch.setMood(mood);
    safeStorage.setSavedMood(mood);
    if (immediate) {
      this.store.setState({ mood });
    }
  }

  public setMuted(muted: boolean): void {
    this.store.setState({ muted });
    this.audio.setMuted(muted);
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
    this.howItWorks.close();
    this.store.setState({ helpOpen: false });
  }

  public triggerExit(): void {}

  public onTap(x: number, y: number): void {
    const hit = this.input.groundRaycaster.intersect(
      this.cameraRig.camera,
      (x / (this.canvas.clientWidth || 800)) * 2 - 1,
      -((y / (this.canvas.clientHeight || 600)) * 2 - 1),
      this.loop.getFrameCount(),
    );
    if (hit) {
      this.spawnSeeds(hit.x, hit.z);
    } else {
      this.spawnSeeds();
    }
  }

  public spawnSeeds(x?: number, z?: number): void {
    this.resetIdle();
    this.hintSequencer.onTap();
    const spawnX = x ?? 0;
    const spawnZ = z ?? -12;
    this.world.spawnSeeds(spawnX, spawnZ, this.store.getState().quality);
    this.audio.sfx.playSeedScatter();

    const distFromCam = Math.hypot(
      spawnX - this.cameraRig.camera.position.x,
      spawnZ - this.cameraRig.camera.position.z,
    );
    const baseRadius = Math.min(3.0, Math.max(1.4, 1.4 + 0.05 * distFromCam));
    this.input.brushTrail.pushImpulse(spawnX, spawnZ, baseRadius * 1.3, 1.0);
  }

  public getSeedsCount(): number {
    return this.world.getSeedsCount();
  }

  public getFirefliesCount(): number {
    return this.world.getFirefliesCount();
  }

  public setLying(lying: boolean, immediate = false): void {
    this.store.setState({ lying });
    this.cameraRig.setLying(lying, immediate);
    this.vignette.setLying(lying);
    this.input.setHolding(lying);
    this.audio.setLyingDown(lying);
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
    p95: number;
  } {
    const info = this.renderer.getDrawCallInfo();
    const metrics = this.adaptiveQuality.getMetrics();
    return {
      fps: this.currentFps,
      tier: this.store.getState().quality,
      drawCalls: info.drawCalls,
      triangles: info.triangles,
      blades: this.world.grass.instanceCount,
      p95: metrics.p95FrameTimeMs,
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
    if (this.motionMediaQuery && this.motionMediaHandler) {
      if (typeof this.motionMediaQuery.removeEventListener === 'function') {
        this.motionMediaQuery.removeEventListener('change', this.motionMediaHandler);
      } else {
        const legacyQuery = this.motionMediaQuery as unknown as {
          removeListener?: (cb: (e: MediaQueryListEvent) => void) => void;
        };
        legacyQuery.removeListener?.(this.motionMediaHandler);
      }
      this.motionMediaHandler = null;
      this.motionMediaQuery = null;
    }
    if (this.capabilities.isTouch && typeof document !== 'undefined') {
      document.body.classList.remove('is-touch');
    }
    this.input.dispose();
    this.vignette.dispose();
    this.hintLine.dispose();
    this.hintSequencer.dispose();
    this.hud.dispose();
    this.howItWorks.dispose();
    this.easterEggs.dispose();
    this.entryScreen.dispose();
    if (this.contextLostTimeoutId !== null) {
      clearTimeout(this.contextLostTimeoutId);
      this.contextLostTimeoutId = null;
    }
    this.fallbackScreen.dispose();
    this.audio.dispose();
    this.loop.dispose();
    this.world.dispose();
    this.statsOverlay?.dispose();
    this.renderer.dispose();
  }
}
