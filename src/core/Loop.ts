/**
 * Animation and render loop runner.
 * Implements frame-rate independent updates, dt clamping (max 0.1s),
 * and automatic tab visibility suspension to prevent delta spikes.
 */

export type TickCallback = (dt: number, elapsed: number) => void;

export interface LoopOptions {
  freeze?: boolean;
  fixedDt?: number;
}

export class Loop {
  private running = false;
  private animFrameId: number | null = null;
  private lastTime = 0;
  private elapsed = 0;
  private subscribers: TickCallback[] = [];
  private readonly maxDt = 0.1; // 100ms clamp
  private isFrozen: boolean;
  private fixedDt: number;
  private framesCount = 0;

  constructor(options: LoopOptions = {}) {
    this.isFrozen = options.freeze ?? false;
    this.fixedDt = options.fixedDt ?? 1 / 60;

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  public subscribe(fn: TickCallback): () => void {
    this.subscribers.push(fn);
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== fn);
    };
  }

  public start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now() / 1000;
    this.scheduleNextFrame();
  }

  public stop(): void {
    this.running = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  public isRunning(): boolean {
    return this.running;
  }

  public getElapsed(): number {
    return this.elapsed;
  }

  public getFrameCount(): number {
    return this.framesCount;
  }

  public setFrozen(frozen: boolean): void {
    this.isFrozen = frozen;
  }

  /**
   * Performs a single manual step (useful for tests or deterministic renders).
   */
  public step(dt: number): void {
    const clampedDt = Math.min(Math.max(0, dt), this.maxDt);
    this.elapsed += clampedDt;
    this.framesCount++;
    for (const sub of this.subscribers) {
      sub(clampedDt, this.elapsed);
    }
  }

  private scheduleNextFrame(): void {
    if (!this.running) return;
    this.animFrameId = requestAnimationFrame(this.tick);
  }

  private tick = (timestampMs: number): void => {
    if (!this.running) return;

    const now = timestampMs / 1000;
    let dt = now - this.lastTime;
    this.lastTime = now;

    if (this.isFrozen) {
      dt = this.fixedDt;
    } else {
      // Clamp dt to prevent physics/animation explosions after frame drops
      dt = Math.min(Math.max(0, dt), this.maxDt);
    }

    this.elapsed += dt;
    this.framesCount++;

    for (const sub of this.subscribers) {
      sub(dt, this.elapsed);
    }

    this.scheduleNextFrame();
  };

  private handleVisibilityChange = (): void => {
    if (document.hidden) {
      // Tab hidden: pause loop execution to save GPU/CPU cycles
      if (this.running) {
        if (this.animFrameId !== null) {
          cancelAnimationFrame(this.animFrameId);
          this.animFrameId = null;
        }
      }
    } else {
      // Tab restored: resume loop and reset lastTime so no elapsed time jump occurs
      if (this.running) {
        this.lastTime = performance.now() / 1000;
        this.scheduleNextFrame();
      }
    }
  };

  public dispose(): void {
    this.stop();
    this.subscribers = [];
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }
}
