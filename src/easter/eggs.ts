import { COPY } from '../ui/copy';
import type { HintLine } from '../ui/HintLine';

export interface EasterEggsOptions {
  hintLine?: HintLine;
  onExitTriggered?: () => void;
  isHelpOpen?: () => boolean;
}

export class EasterEggs {
  private hintLine?: HintLine;
  private ee2Triggered = false;

  constructor(options: EasterEggsOptions = {}) {
    this.hintLine = options.hintLine;
  }

  public setHintLine(hintLine: HintLine): void {
    this.hintLine = hintLine;
  }

  public onKeyDown(_e: KeyboardEvent): boolean {
    return false;
  }

  public onHold10s(): void {
    if (this.ee2Triggered) return;
    this.ee2Triggered = true;
    this.hintLine?.show(COPY.eggs.ee2);
  }

  public onUptime3Min(): void {}
  public onUptime10Min(): void {}

  public static logConsoleGreeting(): void {
    console.info(
      `%c  \\|/\n  \\|/\n~~~~~\n${COPY.eggs.ee4Devtools}`,
      'color: #a8d878; font-family: monospace; font-size: 12px; font-weight: bold;',
    );
  }

  public isEE2Triggered(): boolean {
    return this.ee2Triggered;
  }

  public dispose(): void {}
}
