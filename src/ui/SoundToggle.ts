import { ICONS } from './icons';
import { COPY } from './copy';

export interface SoundToggleOptions {
  initialMuted?: boolean;
  onToggle?: (muted: boolean) => void;
}

export class SoundToggle {
  public readonly element: HTMLButtonElement;
  private muted: boolean;
  private onToggle?: (muted: boolean) => void;

  constructor(options: SoundToggleOptions = {}) {
    this.muted = options.initialMuted ?? false;
    this.onToggle = options.onToggle;

    this.element = document.createElement('button');
    this.element.type = 'button';
    this.element.className = 'glass-btn sound-toggle-btn';
    this.element.title = 'toggle sound (m)';

    this.render();

    this.element.addEventListener('click', () => {
      this.setMuted(!this.muted);
      this.onToggle?.(this.muted);
    });
  }

  public setMuted(muted: boolean): void {
    if (this.muted === muted) return;
    this.muted = muted;
    this.render();
  }

  public getMuted(): boolean {
    return this.muted;
  }

  private render(): void {
    const isSoundOn = !this.muted;
    this.element.setAttribute('aria-pressed', isSoundOn ? 'true' : 'false');
    this.element.setAttribute(
      'aria-label',
      isSoundOn ? COPY.hud.soundAriaLabel.on : COPY.hud.soundAriaLabel.off,
    );
    this.element.innerHTML = isSoundOn ? ICONS.soundOn : ICONS.soundOff;
  }

  public dispose(): void {
    if (this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
  }
}
