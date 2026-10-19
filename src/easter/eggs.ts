import { COPY } from '../ui/copy';
import type { HintLine } from '../ui/HintLine';

export interface EasterEggsOptions {
  hintLine?: HintLine;
  onExitTriggered?: () => void;
  isHelpOpen?: () => boolean;
}

export class EasterEggs {
  private hintLine?: HintLine;
  private onExitTriggered?: () => void;
  private isHelpOpen: () => boolean;

  private keyBuffer: string[] = [];
  private bufferTimerId: ReturnType<typeof setTimeout> | null = null;
  private ee2Triggered = false;
  private ee3_3MinTriggered = false;
  private ee3_10MinTriggered = false;

  constructor(options: EasterEggsOptions = {}) {
    this.hintLine = options.hintLine;
    this.onExitTriggered = options.onExitTriggered;
    this.isHelpOpen = options.isHelpOpen ?? (() => false);
  }

  public setHintLine(hintLine: HintLine): void {
    this.hintLine = hintLine;
  }

  /**
   * Handle keydown event for EE-1 ('exit' sequence detection).
   */
  public onKeyDown(e: KeyboardEvent): boolean {
    if (this.isHelpOpen()) {
      this.clearBuffer();
      return false;
    }

    const target = e.target;
    if (
      target &&
      typeof HTMLElement !== 'undefined' &&
      target instanceof HTMLElement &&
      (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
    ) {
      this.clearBuffer();
      return false;
    }

    if (e.key && e.key.length === 1) {
      const char = e.key.toLowerCase();
      this.keyBuffer.push(char);
      if (this.keyBuffer.length > 4) {
        this.keyBuffer.shift();
      }

      this.resetBufferTimer();

      if (this.keyBuffer.join('') === 'exit') {
        this.clearBuffer();
        this.onExitTriggered?.();
        return true;
      }
    }

    return false;
  }

  /**
   * EE-2: Triggered when lie-down hold reaches 10.0 seconds.
   */
  public onHold10s(): void {
    if (this.ee2Triggered) return;
    this.ee2Triggered = true;
    this.hintLine?.show(COPY.eggs.ee2);
  }

  /**
   * EE-3: Triggered when uptime reaches 3 minutes (180 s).
   */
  public onUptime3Min(): void {
    if (this.ee3_3MinTriggered) return;
    this.ee3_3MinTriggered = true;
    this.hintLine?.show(COPY.eggs.ee3_3min);
  }

  /**
   * EE-3: Triggered when uptime reaches 10 minutes (600 s).
   */
  public onUptime10Min(): void {
    if (this.ee3_10MinTriggered) return;
    this.ee3_10MinTriggered = true;
    this.hintLine?.show(COPY.eggs.ee3_10min);
  }

  /**
   * EE-4: Developer tools console greeting.
   */
  public static logConsoleGreeting(): void {
    console.info(
      `%c  \\|/\n  \\|/\n~~~~~\n${COPY.eggs.ee4Devtools}`,
      'color: #a8d878; font-family: monospace; font-size: 12px; font-weight: bold;',
    );
  }

  public getBuffer(): string {
    return this.keyBuffer.join('');
  }

  public isEE2Triggered(): boolean {
    return this.ee2Triggered;
  }

  private resetBufferTimer(): void {
    if (this.bufferTimerId !== null) {
      clearTimeout(this.bufferTimerId);
    }
    this.bufferTimerId = setTimeout(() => {
      this.clearBuffer();
    }, 2000);
  }

  public clearBuffer(): void {
    this.keyBuffer = [];
    if (this.bufferTimerId !== null) {
      clearTimeout(this.bufferTimerId);
      this.bufferTimerId = null;
    }
  }

  public dispose(): void {
    this.clearBuffer();
  }
}
