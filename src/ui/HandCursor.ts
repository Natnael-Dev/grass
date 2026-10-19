export type HandCursorState = 'open' | 'moving' | 'pressed';

export interface HandCursorPointerInput {
  clientX: number;
  clientY: number;
  deltaX: number;
  deltaY: number;
  isDown: boolean;
  isInside: boolean;
  pointerType: string;
}

export class HandCursor {
  public readonly element: HTMLElement;
  public state: HandCursorState = 'open';

  public currentX = 0;
  public currentY = 0;
  public targetX = 0;
  public targetY = 0;

  public currentRot = 0;
  public targetRot = 0;

  private isVisible = false;
  private hasPosition = false;

  private static readonly SVG_OPEN = `<svg viewBox="0 0 32 32" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 28 C9 28 8 25 8 21 L8 14 C8 12.5 9 11.5 10.5 11.5 C12 11.5 12.5 12.5 12.5 14 L12.5 10 C12.5 8.5 13.5 7.5 15 7.5 C16.5 7.5 17 8.5 17 10 L17 9 C17 7.5 18 6.5 19.5 6.5 C21 6.5 21.5 7.5 21.5 9 L21.5 12 C21.5 11 22.5 10 23.8 10 C25.2 10 25.5 11 25.5 12.5 L25.5 20 C25.5 25 22 28 17 28 Z" fill="#fffbf0" stroke="#262f22" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M8 18 C6.5 18 4.5 19.5 4.5 21.5 C4.5 23.5 6.5 25 8.5 25" fill="#fffbf0" stroke="#262f22" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M12 20 C14 22 18 22 21 19" stroke="#cfc7b8" stroke-width="1.2" stroke-linecap="round"/>
</svg>`;

  private static readonly SVG_MOVING = `<svg viewBox="0 0 32 32" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M11 28 C8.5 28 7.5 25 7.5 21 L8.5 14.5 C8.5 13 9.5 12 11 12 C12.5 12 13 13 13 14.5 L14 10.5 C14 9 15 8 16.5 8 C18 8 18.5 9 18.5 10.5 L19 9.5 C19 8 20 7 21.5 7 C23 7 23.5 8 23.5 9.5 L24 12.5 C24 11.5 25 10.5 26.2 10.5 C27.5 10.5 27.8 11.5 27.8 13 L26.5 20.5 C26 25 22 28 16.5 28 Z" fill="#fffbf0" stroke="#262f22" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M7.5 18 C6 18 4 19.5 4 21.5 C4 23.5 6 25 8 25" fill="#fffbf0" stroke="#262f22" stroke-width="1.6" stroke-linecap="round"/>
  <path d="M3 13 C5 13 7 14 8 15" stroke="#9bb887" stroke-width="1.2" stroke-linecap="round" stroke-dasharray="2 2"/>
</svg>`;

  private static readonly SVG_PRESSED = `<svg viewBox="0 0 32 32" width="32" height="32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M9 26 C7 25 6 22 6 18 C6 14 8 11 11 11 L20 11 C23 11 25 13 25 16 L25 19 C25 23 22 26 18 26 Z" fill="#fffbf0" stroke="#262f22" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M11 11 L11 17 C11 19 13 19 13 17 L13 11" fill="#fffbf0" stroke="#262f22" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M16 11 L16 17 C16 19 18 19 18 17 L18 11" fill="#fffbf0" stroke="#262f22" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M21 12 L21 17 C21 19 23 19 23 17 L23 12" fill="#fffbf0" stroke="#262f22" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M6 17 C6 17 8 20 12 20 L18 20" fill="none" stroke="#262f22" stroke-width="1.6" stroke-linecap="round"/>
</svg>`;

  constructor(existingElement?: HTMLElement) {
    if (existingElement) {
      this.element = existingElement;
    } else if (typeof document !== 'undefined') {
      const el = document.createElement('div');
      el.id = 'hand-cursor';
      el.className = 'hand-cursor';
      document.body.appendChild(el);
      this.element = el;
    } else {
      this.element = {} as HTMLElement;
    }

    this.applyBaseStyles();
    this.renderState('open');
  }

  private applyBaseStyles(): void {
    if (!this.element.style) return;
    const s = this.element.style;
    s.position = 'fixed';
    s.top = '0';
    s.left = '0';
    s.width = '32px';
    s.height = '32px';
    s.pointerEvents = 'none';
    s.zIndex = '9000';
    s.transformOrigin = 'center center';
    s.opacity = '0';
    s.willChange = 'transform, opacity';
    s.filter = 'drop-shadow(0 2px 5px rgba(0, 0, 0, 0.25))';
  }

  private renderState(state: HandCursorState): void {
    this.state = state;
    if (this.element.dataset) {
      this.element.dataset.state = state;
    }
    if (state === 'open') {
      this.element.innerHTML = HandCursor.SVG_OPEN;
    } else if (state === 'moving') {
      this.element.innerHTML = HandCursor.SVG_MOVING;
    } else if (state === 'pressed') {
      this.element.innerHTML = HandCursor.SVG_PRESSED;
    }
  }

  /**
   * Updates hand cursor physics and visual appearance per frame:
   * - Soft position tracking with factor 0.35/frame.
   * - Rotation clamped to +/- 12 degrees when moving over terrain.
   * - Automatic hiding for touch/pen or when pointer leaves canvas.
   * - Forced open state and 0 rotation when pointing at the sky.
   */
  public update(
    _dt: number,
    pointerInput: HandCursorPointerInput,
    isOverTerrain: boolean,
    virtualScreenPos?: { x: number; y: number } | null,
  ): void {
    const isTouchOrPen = pointerInput.pointerType === 'touch' || pointerInput.pointerType === 'pen';

    // 1. Visibility check
    if (virtualScreenPos) {
      this.isVisible = true;
      this.targetX = virtualScreenPos.x;
      this.targetY = virtualScreenPos.y;
    } else if (pointerInput.isInside && !isTouchOrPen) {
      this.isVisible = true;
      this.targetX = pointerInput.clientX;
      this.targetY = pointerInput.clientY;
    } else {
      this.isVisible = false;
    }

    if (this.element.style) {
      this.element.style.opacity = this.isVisible ? '1' : '0';
    }

    if (!this.isVisible) {
      return;
    }

    // 2. Position tracking with 0.35 soft factor
    if (!this.hasPosition) {
      this.currentX = this.targetX;
      this.currentY = this.targetY;
      this.hasPosition = true;
    } else {
      this.currentX += (this.targetX - this.currentX) * 0.35;
      this.currentY += (this.targetY - this.currentY) * 0.35;
    }

    // 3. State determination
    let nextState: HandCursorState = 'open';
    if (pointerInput.isDown) {
      nextState = 'pressed';
      this.targetRot = 0;
    } else if (isOverTerrain && (pointerInput.deltaX !== 0 || pointerInput.deltaY !== 0)) {
      nextState = 'moving';
      // Rotation: clamp(vx * 0.02, +/- 12 deg)
      const rot = pointerInput.deltaX * 0.08;
      this.targetRot = Math.max(-12, Math.min(12, rot));
    } else {
      nextState = 'open';
      this.targetRot = 0;
    }

    if (nextState !== this.state) {
      this.renderState(nextState);
    }

    // 4. Rotation damping
    this.currentRot += (this.targetRot - this.currentRot) * 0.25;

    // 5. Apply transform centered on pointer
    if (this.element.style) {
      this.element.style.transform = `translate3d(${this.currentX - 16}px, ${this.currentY - 16}px, 0) rotate(${this.currentRot.toFixed(2)}deg)`;
    }
  }

  public dispose(): void {
    if (this.element && typeof this.element.remove === 'function') {
      this.element.remove();
    }
  }
}
