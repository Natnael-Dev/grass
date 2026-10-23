import type { QualityTier } from './types';

export interface AdaptiveQualityOptions {
  initialTier?: QualityTier;
  manualOverride?: boolean;
  windowSize?: number;
  warmupDurationSec?: number;
  cooldownDurationSec?: number;
  downgradeFpsThreshold?: number;
  upgradeFpsThreshold?: number;
  maxDowngrades?: number;
  allowAutoUpgrade?: boolean;
  onTierChange?: (newTier: QualityTier, prevTier: QualityTier, reason: string) => void;
}

export interface FrameMetrics {
  averageFps: number;
  averageFrameTimeMs: number;
  p95FrameTimeMs: number;
  varianceMs2: number;
  stdDevMs: number;
  sampleCount: number;
  currentTier: QualityTier;
  isLocked: boolean;
  warmupRemainingSec: number;
  cooldownRemainingSec: number;
}

export class AdaptiveQuality {
  private currentTier: QualityTier;
  private isLocked: boolean;
  private readonly windowSize: number;
  private readonly warmupDurationSec: number;
  private readonly cooldownDurationSec: number;
  private readonly downgradeFpsThreshold: number;
  private readonly upgradeFpsThreshold: number;
  private readonly maxDowngrades: number;
  private readonly allowAutoUpgrade: boolean;
  private readonly onTierChange?: (
    newTier: QualityTier,
    prevTier: QualityTier,
    reason: string,
  ) => void;

  // Circular buffer for frame times in milliseconds
  private readonly frameTimesMs: Float32Array;
  private headIndex = 0;
  private sampleCount = 0;
  private runningSumMs = 0;

  // Timers and counters
  private warmupElapsedSec = 0;
  private cooldownTimerSec = 0;
  private evalTimerSec = 0;
  private downgradeCount = 0;

  // Scratch buffer for on-demand p95 calculation (only for metrics/infrequent eval)
  private readonly scratchSortBuffer: Float32Array;

  constructor(options: AdaptiveQualityOptions = {}) {
    this.currentTier = options.initialTier ?? 'high';
    this.isLocked = options.manualOverride ?? false;
    this.windowSize = Math.max(10, options.windowSize ?? 120);
    this.warmupDurationSec = Math.max(0, options.warmupDurationSec ?? 3.0);
    this.cooldownDurationSec = Math.max(0, options.cooldownDurationSec ?? 4.0);
    this.downgradeFpsThreshold = options.downgradeFpsThreshold ?? 45.0;
    this.upgradeFpsThreshold = options.upgradeFpsThreshold ?? 58.0;
    this.maxDowngrades = options.maxDowngrades ?? 2;
    // Default to false (no auto-upgrade per performance spec), but respect option if explicitly passed
    this.allowAutoUpgrade = options.allowAutoUpgrade ?? false;
    this.onTierChange = options.onTierChange;

    this.frameTimesMs = new Float32Array(this.windowSize);
    this.scratchSortBuffer = new Float32Array(this.windowSize);
  }

  public getTier(): QualityTier {
    return this.currentTier;
  }

  public getIsLocked(): boolean {
    return this.isLocked;
  }

  public setLocked(locked: boolean): void {
    this.isLocked = locked;
  }

  public isWarmupComplete(): boolean {
    return this.warmupElapsedSec >= this.warmupDurationSec;
  }

  public recordFrame(dtSeconds: number): QualityTier {
    if (dtSeconds <= 0 || dtSeconds > 0.5) {
      return this.currentTier;
    }

    const frameTimeMs = dtSeconds * 1000.0;

    // Moving average update
    if (this.sampleCount < this.windowSize) {
      this.runningSumMs += frameTimeMs;
      this.sampleCount++;
    } else {
      const oldVal = this.frameTimesMs[this.headIndex] ?? 0;
      this.runningSumMs = Math.max(0, this.runningSumMs - oldVal + frameTimeMs);
    }

    this.frameTimesMs[this.headIndex] = frameTimeMs;
    this.headIndex = (this.headIndex + 1) % this.windowSize;

    if (this.warmupElapsedSec < this.warmupDurationSec) {
      this.warmupElapsedSec += dtSeconds;
      return this.currentTier;
    }

    if (this.cooldownTimerSec > 0) {
      this.cooldownTimerSec = Math.max(0, this.cooldownTimerSec - dtSeconds);
      if (this.cooldownTimerSec > 0) {
        return this.currentTier;
      }
      this.evalTimerSec = 1.0;
    }

    if (this.isLocked) {
      return this.currentTier;
    }

    // Rate-limit evaluation to ~1 Hz (or after collecting enough samples in fast loops)
    this.evalTimerSec += dtSeconds;
    if (this.evalTimerSec >= 1.0 || (this.sampleCount >= 30 && this.evalTimerSec >= 0.5)) {
      this.evalTimerSec = 0;
      this.evaluateAdaptation();
    }

    return this.currentTier;
  }

  private evaluateAdaptation(): void {
    if (this.sampleCount < Math.min(30, this.windowSize)) {
      return;
    }

    const avgFrameTimeMs = this.runningSumMs / this.sampleCount;
    const avgFps = avgFrameTimeMs > 0 ? 1000.0 / avgFrameTimeMs : 60.0;

    // 1. Check for Down-Tiering (< 45 FPS or average frame time > 22.2 ms)
    if (avgFps < this.downgradeFpsThreshold) {
      if (this.downgradeCount < this.maxDowngrades && this.currentTier !== 'low') {
        const nextTier = this.currentTier === 'high' ? 'medium' : 'low';
        this.applyTierChange(
          nextTier,
          `Rolling FPS (${avgFps.toFixed(1)}) below ${this.downgradeFpsThreshold} FPS`,
        );
        this.downgradeCount++;
        return;
      }
    }

    // 2. Check for Up-Tiering only if explicitly allowed by options (e.g. tests)
    if (this.allowAutoUpgrade && this.currentTier !== 'high') {
      if (this.sampleCount >= this.windowSize && avgFps >= this.upgradeFpsThreshold) {
        const p95 = this.getP95FrameTimeMs();
        const stdDev = this.getStdDevMs();

        if (p95 <= 18.0 && stdDev <= 3.0) {
          const nextTier = this.currentTier === 'low' ? 'medium' : 'high';
          this.applyTierChange(
            nextTier,
            `Stable 60 FPS (${avgFps.toFixed(1)}) with p95 ${p95.toFixed(1)} ms`,
          );
          if (this.downgradeCount > 0) {
            this.downgradeCount--;
          }
        }
      }
    }
  }

  private applyTierChange(newTier: QualityTier, reason: string): void {
    const prevTier = this.currentTier;
    this.currentTier = newTier;
    this.cooldownTimerSec = this.cooldownDurationSec;
    this.onTierChange?.(newTier, prevTier, reason);
  }

  public setTier(tier: QualityTier, lock = true): void {
    const prev = this.currentTier;
    this.currentTier = tier;
    if (lock) {
      this.isLocked = true;
    }
    if (prev !== tier) {
      this.onTierChange?.(tier, prev, lock ? 'Manual override' : 'API setTier');
    }
  }

  public getAverageFrameTimeMs(): number {
    return this.sampleCount > 0 ? this.runningSumMs / this.sampleCount : 16.67;
  }

  public getAverageFps(): number {
    const avgMs = this.getAverageFrameTimeMs();
    return avgMs > 0 ? 1000.0 / avgMs : 60.0;
  }

  public getVarianceMs2(): number {
    if (this.sampleCount < 2) return 0;
    const mean = this.getAverageFrameTimeMs();
    let sumSqDiff = 0;
    for (let i = 0; i < this.sampleCount; i++) {
      const diff = this.frameTimesMs[i]! - mean;
      sumSqDiff += diff * diff;
    }
    return sumSqDiff / this.sampleCount;
  }

  public getStdDevMs(): number {
    return Math.sqrt(this.getVarianceMs2());
  }

  public getP95FrameTimeMs(): number {
    if (this.sampleCount === 0) return 16.67;
    for (let i = 0; i < this.sampleCount; i++) {
      this.scratchSortBuffer[i] = this.frameTimesMs[i]!;
    }
    const activeSlice = this.scratchSortBuffer.subarray(0, this.sampleCount);
    activeSlice.sort();

    const p95Index = Math.min(
      this.sampleCount - 1,
      Math.max(0, Math.ceil(0.95 * this.sampleCount) - 1),
    );
    return activeSlice[p95Index] ?? 16.67;
  }

  public getMetrics(): FrameMetrics {
    return {
      averageFps: this.getAverageFps(),
      averageFrameTimeMs: this.getAverageFrameTimeMs(),
      p95FrameTimeMs: this.getP95FrameTimeMs(),
      varianceMs2: this.getVarianceMs2(),
      stdDevMs: this.getStdDevMs(),
      sampleCount: this.sampleCount,
      currentTier: this.currentTier,
      isLocked: this.isLocked,
      warmupRemainingSec: Math.max(0, this.warmupDurationSec - this.warmupElapsedSec),
      cooldownRemainingSec: this.cooldownTimerSec,
    };
  }

  public reset(): void {
    this.headIndex = 0;
    this.sampleCount = 0;
    this.runningSumMs = 0;
    this.warmupElapsedSec = 0;
    this.cooldownTimerSec = 0;
    this.evalTimerSec = 0;
    this.downgradeCount = 0;
    this.frameTimesMs.fill(0);
  }
}
