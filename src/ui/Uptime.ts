import { COPY } from './copy';

export interface UptimeOptions {
  initialSeconds?: number;
  onMinute3?: () => void;
  onMinute10?: () => void;
}

export class Uptime {
  public readonly element: HTMLElement;
  private seconds = 0;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isPaused = false;
  private onMinute3?: () => void;
  private onMinute10?: () => void;
  private hasTriggered3Min = false;
  private hasTriggered10Min = false;

  constructor(options: UptimeOptions = {}) {
    this.seconds = options.initialSeconds ?? 0;
    this.onMinute3 = options.onMinute3;
    this.onMinute10 = options.onMinute10;

    this.element = document.createElement('div');
    this.element.className = 'uptime-counter';
    this.element.style.fontFamily = 'var(--font-mono)';
    this.element.style.fontSize = 'var(--size-text-s)';
    this.element.style.color = 'var(--text-muted)';
    this.element.style.userSelect = 'none';
    this.element.style.whiteSpace = 'nowrap';
    this.element.setAttribute('aria-label', 'session uptime');

    this.updateDisplay();
  }

  public start(): void {
    if (this.intervalId !== null) return;
    this.intervalId = setInterval(() => {
      if (!this.isPaused) {
        this.tick();
      }
    }, 1000);
  }

  public tick(): void {
    this.seconds++;
    this.updateDisplay();
    this.checkMilestones();
  }

  public advance(seconds: number): void {
    for (let i = 0; i < seconds; i++) {
      this.tick();
    }
  }

  public setSeconds(seconds: number): void {
    this.seconds = seconds;
    this.updateDisplay();
    this.checkMilestones();
  }

  public getSeconds(): number {
    return this.seconds;
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    this.isPaused = false;
  }

  private checkMilestones(): void {
    if (this.seconds >= 180 && !this.hasTriggered3Min) {
      this.hasTriggered3Min = true;
      this.onMinute3?.();
    }
    if (this.seconds >= 600 && !this.hasTriggered10Min) {
      this.hasTriggered10Min = true;
      this.onMinute10?.();
    }
  }

  private updateDisplay(): void {
    const mins = Math.floor(this.seconds / 60);
    const secs = this.seconds % 60;
    const paddedMins = mins.toString().padStart(2, '0');
    const paddedSecs = secs.toString().padStart(2, '0');
    this.element.textContent = `${COPY.hud.uptimePrefix}${paddedMins}:${paddedSecs}`;
  }

  public dispose(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
  }
}
