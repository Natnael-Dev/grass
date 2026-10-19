export interface VignetteOptions {
  baseIntensity?: number;
  reducedMotion?: boolean;
}

export class Vignette {
  public readonly element: HTMLElement;
  private baseIntensity: number;
  private isLying = false;
  private reducedMotion = false;
  private currentExtra = 0;
  private targetExtra = 0;
  private transitionActive = false;
  private transitionElapsed = 0;
  private transitionDuration = 1.1;

  constructor(existingElement?: HTMLElement, options: VignetteOptions = {}) {
    this.baseIntensity = options.baseIntensity ?? 0.35;
    this.reducedMotion = options.reducedMotion ?? false;

    if (existingElement) {
      this.element = existingElement;
    } else if (typeof document !== 'undefined') {
      const el = document.createElement('div');
      el.id = 'vignette-overlay';
      el.className = 'vignette-overlay';
      el.setAttribute('aria-hidden', 'true');
      this.applyStyles(el);
      const parent = document.getElementById('app') ?? document.body;
      parent.appendChild(el);
      this.element = el;
    } else {
      this.element = {} as HTMLElement;
    }

    this.render();
  }

  private applyStyles(el: HTMLElement): void {
    if (!el.style) return;
    const s = el.style;
    s.position = 'absolute';
    s.top = '0';
    s.left = '0';
    s.width = '100%';
    s.height = '100%';
    s.pointerEvents = 'none';
    s.zIndex = '10';
  }

  public setBaseIntensity(intensity: number): void {
    this.baseIntensity = Math.max(0, Math.min(1, intensity));
    this.render();
  }

  public setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
    if (reduced) {
      this.currentExtra = 0;
      this.targetExtra = 0;
      this.transitionActive = false;
      this.render();
    }
  }

  public setLying(lying: boolean): void {
    if (this.isLying === lying) return;
    this.isLying = lying;

    if (this.reducedMotion) {
      // In reduced motion, no vignette change
      this.currentExtra = 0;
      this.targetExtra = 0;
      this.transitionActive = false;
      this.render();
      return;
    }

    this.targetExtra = lying ? 0.25 : 0.0;
    this.transitionActive = true;
    this.transitionElapsed = 0;
    this.transitionDuration = lying ? 1.1 : 0.9;
  }

  public update(dt: number): void {
    if (!this.transitionActive) return;
    this.transitionElapsed += dt;
    const progress = Math.min(1, this.transitionElapsed / this.transitionDuration);

    let eased = progress;
    if (this.isLying) {
      // Ease-out: 1 - (1 - progress)^3
      eased = 1 - (1 - progress) ** 3;
    } else {
      // Ease-in-out
      eased = progress < 0.5 ? 4 * progress ** 3 : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    }

    const start = this.isLying ? 0.0 : 0.25;
    const target = this.targetExtra;
    this.currentExtra = start + (target - start) * eased;

    if (progress >= 1) {
      this.currentExtra = this.targetExtra;
      this.transitionActive = false;
    }

    this.render();
  }

  public getEffectiveIntensity(): number {
    return Math.min(1, this.baseIntensity + this.currentExtra);
  }

  private render(): void {
    if (!this.element.style) return;
    const eff = this.getEffectiveIntensity();
    this.element.style.background = `radial-gradient(circle at center, transparent 40%, rgba(10, 14, 28, ${eff.toFixed(3)}) 100%)`;
  }

  public dispose(): void {
    if (this.element && typeof this.element.remove === 'function') {
      this.element.remove();
    }
  }
}
