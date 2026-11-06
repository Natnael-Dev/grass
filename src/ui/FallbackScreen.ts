import { COPY } from './copy';

export interface FallbackScreenOptions {
  container?: HTMLElement;
  onReload?: () => void;
}

export class FallbackScreen {
  public toastElement: HTMLElement | null = null;
  public overlayElement: HTMLElement | null = null;
  private onReload?: () => void;
  private container: HTMLElement;

  constructor(options: FallbackScreenOptions = {}) {
    this.onReload = options.onReload;
    this.container =
      options.container ?? (typeof document !== 'undefined' ? document.body : ({} as HTMLElement));
  }

  public showRecoveryToast(text = COPY.states.contextLost): void {
    if (this.toastElement || typeof document === 'undefined') return;

    this.toastElement = document.createElement('div');
    this.toastElement.className = 'recovery-toast glass-panel';
    this.toastElement.setAttribute('role', 'status');
    this.toastElement.setAttribute('aria-live', 'polite');
    this.toastElement.textContent = text;
    this.container.appendChild(this.toastElement);
  }

  public hideRecoveryToast(): void {
    if (this.toastElement && this.toastElement.parentElement) {
      this.toastElement.parentElement.removeChild(this.toastElement);
      this.toastElement = null;
    }
  }

  public showFallback(
    title = COPY.states.fallbackTitle,
    body = COPY.states.fallbackBody,
    buttonText = COPY.states.fallbackButton,
  ): void {
    this.hideRecoveryToast();
    if (this.overlayElement || typeof document === 'undefined') return;

    this.overlayElement = document.createElement('div');
    this.overlayElement.className = 'fallback-overlay';
    this.overlayElement.setAttribute('role', 'alertdialog');
    this.overlayElement.setAttribute('aria-modal', 'true');

    const content = document.createElement('div');
    content.className = 'fallback-content glass-panel';
    content.style.padding = '32px';

    const h1 = document.createElement('h1');
    h1.className = 'fallback-title';
    h1.textContent = title;

    const p = document.createElement('p');
    p.className = 'fallback-body';
    p.textContent = body;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn-reload';
    btn.textContent = buttonText;
    btn.addEventListener('click', () => {
      if (this.onReload) {
        this.onReload();
      } else if (typeof window !== 'undefined' && window.location) {
        window.location.reload();
      }
    });

    content.appendChild(h1);
    content.appendChild(p);
    content.appendChild(btn);
    this.overlayElement.appendChild(content);
    this.container.appendChild(this.overlayElement);
    btn.focus();
  }

  public hideFallback(): void {
    if (this.overlayElement && this.overlayElement.parentElement) {
      this.overlayElement.parentElement.removeChild(this.overlayElement);
      this.overlayElement = null;
    }
  }

  public dispose(): void {
    this.hideRecoveryToast();
    this.hideFallback();
  }
}
