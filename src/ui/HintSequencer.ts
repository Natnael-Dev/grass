import { COPY } from './copy';
import { safeStorage } from '../core/storage';
import type { HintLine } from './HintLine';

export interface HintSequencerOptions {
  hintLine: HintLine;
  isTouch?: boolean;
  hintsSeen?: boolean;
  onComplete?: () => void;
}

export class HintSequencer {
  private hintLine: HintLine;
  private isTouch: boolean;
  private hintsSeen: boolean;
  private onComplete?: () => void;

  private currentStep = 0; // 0 = not started, 1..4 = active hint steps, 5 = completed
  private cumulativeBrushPx = 0;
  private fallbackTimerId: ReturnType<typeof setTimeout> | null = null;
  private entryTimerId: ReturnType<typeof setTimeout> | null = null;

  constructor(options: HintSequencerOptions) {
    this.hintLine = options.hintLine;
    this.isTouch = options.isTouch ?? false;
    this.hintsSeen = options.hintsSeen ?? safeStorage.getHintsSeen();
    this.onComplete = options.onComplete;
  }

  public setIsTouch(isTouch: boolean): void {
    this.isTouch = isTouch;
  }

  public start(): void {
    if (this.hintsSeen || this.currentStep > 0) return;

    // Hint 1 triggers at +1.5 s after entry
    this.entryTimerId = setTimeout(() => {
      this.triggerStep1();
    }, 1500);
  }

  private triggerStep1(): void {
    if (this.hintsSeen || this.currentStep >= 1) return;
    this.currentStep = 1;
    this.cumulativeBrushPx = 0;

    const copyList = this.isTouch ? COPY.hints.touch : COPY.hints.desktop;
    this.hintLine.show(copyList[0]);

    // Fallback timer: +8 s since hint 1 -> trigger hint 2
    this.clearFallbackTimer();
    this.fallbackTimerId = setTimeout(() => {
      this.triggerStep2();
    }, 8000);
  }

  public onBrush(distancePx: number): void {
    if (this.hintsSeen || this.currentStep !== 1) return;

    this.cumulativeBrushPx += distancePx;
    if (this.cumulativeBrushPx >= 600) {
      this.triggerStep2();
    }
  }

  private triggerStep2(): void {
    if (this.hintsSeen || this.currentStep !== 1) return;
    this.clearFallbackTimer();
    this.currentStep = 2;

    const copyList = this.isTouch ? COPY.hints.touch : COPY.hints.desktop;
    this.hintLine.show(copyList[1]);

    // Fallback timer: +8 s since hint 2 -> trigger hint 3
    this.fallbackTimerId = setTimeout(() => {
      this.triggerStep3();
    }, 8000);
  }

  public onTap(): void {
    if (this.hintsSeen || this.currentStep !== 2) return;
    this.triggerStep3();
  }

  private triggerStep3(): void {
    if (this.hintsSeen || this.currentStep !== 2) return;
    this.clearFallbackTimer();
    this.currentStep = 3;

    const copyList = this.isTouch ? COPY.hints.touch : COPY.hints.desktop;
    this.hintLine.show(copyList[2]);

    // Fallback timer: +12 s since hint 3 -> trigger hint 4
    this.fallbackTimerId = setTimeout(() => {
      this.triggerStep4();
    }, 12000);
  }

  public onLieDownEnd(): void {
    if (this.hintsSeen || this.currentStep !== 3) return;
    this.triggerStep4();
  }

  private triggerStep4(): void {
    if (this.hintsSeen || this.currentStep !== 3) return;
    this.clearFallbackTimer();
    this.currentStep = 4;

    const copyList = this.isTouch ? COPY.hints.touch : COPY.hints.desktop;
    this.hintLine.show(copyList[3]);

    this.hintsSeen = true;
    safeStorage.setHintsSeen(true);
    this.currentStep = 5;
    this.onComplete?.();
  }

  public onIdle40s(): void {
    // Only show idle hint if not currently showing another essential hint
    if (!this.hintLine.getIsVisible()) {
      this.hintLine.show(COPY.hints.idle);
    }
  }

  public getCurrentStep(): number {
    return this.currentStep;
  }

  public isCompleted(): boolean {
    return this.hintsSeen || this.currentStep === 5;
  }

  private clearFallbackTimer(): void {
    if (this.fallbackTimerId !== null) {
      clearTimeout(this.fallbackTimerId);
      this.fallbackTimerId = null;
    }
  }

  public dispose(): void {
    if (this.entryTimerId !== null) {
      clearTimeout(this.entryTimerId);
      this.entryTimerId = null;
    }
    this.clearFallbackTimer();
  }
}
