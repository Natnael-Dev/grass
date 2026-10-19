import { COPY } from './copy';

export interface EntryOptions {
  overlayElement?: HTMLElement;
  enterButton?: HTMLButtonElement;
  onEnter?: (meta: { viaKeyboard: boolean }) => void;
}

export class Entry {
  public readonly overlay: HTMLElement | null;
  public readonly button: HTMLButtonElement | null;
  private onEnter?: (meta: { viaKeyboard: boolean }) => void;
  private clickHandler: ((e: MouseEvent) => void) | null = null;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;
  private loadingTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private isEntered = false;

  constructor(options: EntryOptions = {}) {
    this.onEnter = options.onEnter;

    if (options.overlayElement) {
      this.overlay = options.overlayElement;
    } else if (typeof document !== 'undefined') {
      this.overlay = document.getElementById('entry-overlay');
    } else {
      this.overlay = null;
    }

    if (options.enterButton) {
      this.button = options.enterButton;
    } else if (typeof document !== 'undefined') {
      this.button = document.getElementById('btn-enter') as HTMLButtonElement | null;
    } else {
      this.button = null;
    }

    this.setupListeners();
  }

  private setupListeners(): void {
    if (!this.button) return;

    this.clickHandler = () => {
      this.triggerEnter(false);
    };

    this.keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.triggerEnter(true);
      }
    };

    this.button.addEventListener('click', this.clickHandler);
    this.button.addEventListener('keydown', this.keyHandler);
  }

  public setLoading(): void {
    if (this.isEntered) return;
    this.loadingTimeoutId = setTimeout(() => {
      if (this.button && !this.isEntered) {
        this.button.disabled = true;
        this.button.textContent = COPY.entry.buttonLoading;
      }
    }, 300);
  }

  public setReady(): void {
    if (this.loadingTimeoutId !== null) {
      clearTimeout(this.loadingTimeoutId);
      this.loadingTimeoutId = null;
    }

    if (this.button && !this.isEntered) {
      this.button.disabled = false;
      this.button.textContent = COPY.entry.button;
      this.button.focus();
    }
  }

  public triggerEnter(viaKeyboard = false): void {
    if (this.isEntered) return;
    this.isEntered = true;

    if (this.overlay) {
      this.overlay.style.transition = 'opacity 900ms var(--ease-out)';
      this.overlay.style.opacity = '0';
      this.overlay.style.pointerEvents = 'none';

      setTimeout(() => {
        if (this.overlay) {
          this.overlay.style.display = 'none';
          this.overlay.classList.add('hidden');
        }
      }, 900);
    }

    this.onEnter?.({ viaKeyboard });
  }

  public getIsEntered(): boolean {
    return this.isEntered;
  }

  public dispose(): void {
    if (this.loadingTimeoutId !== null) {
      clearTimeout(this.loadingTimeoutId);
      this.loadingTimeoutId = null;
    }
    if (this.button && this.clickHandler) {
      this.button.removeEventListener('click', this.clickHandler);
      this.clickHandler = null;
    }
    if (this.button && this.keyHandler) {
      this.button.removeEventListener('keydown', this.keyHandler);
      this.keyHandler = null;
    }
  }
}
