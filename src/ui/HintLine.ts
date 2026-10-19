/**
 * HintLine component:
 * Renders contextual single-line guidance at y ≈ 16%.
 * Uses typed text effect at 28 ms/char (instant under reduced motion).
 * Holds for 6 s, fades over 400 ms.
 * Accessible live region: role="status", aria-live="polite".
 */

export interface HintLineOptions {
  element?: HTMLElement;
  container?: HTMLElement;
  reducedMotion?: boolean;
}

export class HintLine {
  public readonly element: HTMLElement;
  private reducedMotion: boolean;
  private currentText = '';
  private typeIntervalId: ReturnType<typeof setInterval> | null = null;
  private holdTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private fadeTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private isVisible = false;

  constructor(options: HintLineOptions = {}) {
    this.reducedMotion = options.reducedMotion ?? false;

    if (options.element) {
      this.element = options.element;
    } else if (typeof document !== 'undefined') {
      this.element = document.createElement('div');
    } else {
      // Mock element for headless/node unit testing
      this.element = {
        style: {},
        setAttribute: () => {},
        parentElement: null,
      } as unknown as HTMLElement;
    }

    if (this.element.setAttribute) {
      this.element.className = 'hint-line glass-panel';
      this.element.setAttribute('role', 'status');
      this.element.setAttribute('aria-live', 'polite');
    }
    if (this.element.style) {
      this.element.style.position = 'fixed';
      this.element.style.top = '16%';
      this.element.style.left = '50%';
      this.element.style.transform = 'translateX(-50%)';
      this.element.style.zIndex = '50';
      this.element.style.padding = '8px 18px';
      this.element.style.borderRadius = 'var(--radius-pill)';
      this.element.style.fontFamily = 'var(--font-mono)';
      this.element.style.fontSize = 'var(--size-text-m)';
      this.element.style.color = 'var(--text)';
      this.element.style.pointerEvents = 'none';
      this.element.style.maxWidth = 'min(90vw, 560px)';
      this.element.style.textAlign = 'center';
      this.element.style.opacity = '0';
      this.element.style.transition = 'opacity 400ms var(--ease-out)';
      this.element.style.display = 'none';
    }

    if (!options.element && typeof document !== 'undefined') {
      const parent = options.container ?? document.body;
      parent.appendChild(this.element);
    }
  }

  public setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
  }

  public show(text: string, holdMs = 6000, immediate = false): void {
    this.clearTimers();
    this.currentText = text;

    this.element.style.display = 'block';
    // Trigger layout before animating opacity
    void this.element.offsetHeight;
    this.element.style.opacity = '1';
    this.isVisible = true;

    if (immediate || this.reducedMotion) {
      this.element.textContent = text;
      this.holdTimeoutId = setTimeout(() => {
        this.fadeOut();
      }, holdMs);
      return;
    }

    // Typed effect at 28 ms / char based on elapsed time to avoid headless timer clamping
    const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.element.textContent = '';

    const tick = () => {
      const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
      const elapsed = Math.max(0, now - startTime);
      const targetCharCount = Math.min(text.length, Math.max(1, Math.floor(elapsed / 28)));
      this.element.textContent = text.slice(0, targetCharCount);

      if (targetCharCount >= text.length) {
        if (this.typeIntervalId !== null) {
          clearInterval(this.typeIntervalId);
          this.typeIntervalId = null;
        }
        this.holdTimeoutId = setTimeout(() => {
          this.fadeOut();
        }, holdMs);
      }
    };

    if (text.length > 0) {
      this.typeIntervalId = setInterval(tick, 28);
    }
  }

  public skipTyping(): void {
    if (this.typeIntervalId !== null) {
      clearInterval(this.typeIntervalId);
      this.typeIntervalId = null;
    }
    if (this.currentText) {
      this.element.textContent = this.currentText;
    }
    if (this.holdTimeoutId === null && this.isVisible) {
      this.holdTimeoutId = setTimeout(() => {
        this.fadeOut();
      }, 6000);
    }
  }

  public fadeOut(): void {
    this.element.style.opacity = '0';
    this.fadeTimeoutId = setTimeout(() => {
      this.element.style.display = 'none';
      this.element.textContent = '';
      this.isVisible = false;
      this.fadeTimeoutId = null;
    }, 400);
  }

  public hideImmediately(): void {
    this.clearTimers();
    this.element.style.opacity = '0';
    this.element.style.display = 'none';
    this.element.textContent = '';
    this.isVisible = false;
  }

  public getIsVisible(): boolean {
    return this.isVisible;
  }

  private clearTimers(): void {
    if (this.typeIntervalId !== null) {
      clearInterval(this.typeIntervalId);
      this.typeIntervalId = null;
    }
    if (this.holdTimeoutId !== null) {
      clearTimeout(this.holdTimeoutId);
      this.holdTimeoutId = null;
    }
    if (this.fadeTimeoutId !== null) {
      clearTimeout(this.fadeTimeoutId);
      this.fadeTimeoutId = null;
    }
  }

  public dispose(): void {
    this.clearTimers();
    if (this.element.parentElement) {
      this.element.parentElement.removeChild(this.element);
    }
  }
}
