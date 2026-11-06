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
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private dismissed = false;

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
    if (this.hintsSeen || this.dismissed) return;

    this.timerId = setTimeout(() => {
      if (!this.dismissed && !this.hintsSeen) {
        const text = this.isTouch ? COPY.hints.touch[0] : COPY.hints.desktop[0];
        this.hintLine.show(text ?? '> brush the grass.');
      }
    }, 1200);
  }

  public onBrush(_distancePx?: number): void {
    this.dismiss();
  }

  public onTap(): void {
    this.dismiss();
  }

  public onLieDownEnd(): void {
    this.dismiss();
  }

  public onIdle40s(): void {}

  public dismiss(): void {
    if (this.dismissed) return;
    this.dismissed = true;
    this.hintsSeen = true;
    safeStorage.setHintsSeen(true);
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    this.hintLine.fadeOut();
    this.onComplete?.();
  }

  public isCompleted(): boolean {
    return this.hintsSeen || this.dismissed;
  }

  public dispose(): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
}
