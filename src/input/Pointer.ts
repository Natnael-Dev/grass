export interface PointerState {
  clientX: number;
  clientY: number;
  deltaX: number;
  deltaY: number;
  u: number;
  v: number;
  ndcX: number;
  ndcY: number;
  isDown: boolean;
  isInside: boolean;
  pointerType: string;
  activePointerId: number | null;
}

export class Pointer {
  public readonly state: PointerState = {
    clientX: 0,
    clientY: 0,
    deltaX: 0,
    deltaY: 0,
    u: 0.5,
    v: 0.5,
    ndcX: 0,
    ndcY: 0,
    isDown: false,
    isInside: false,
    pointerType: 'mouse',
    activePointerId: null,
  };

  public onDown?: (clientX: number, clientY: number) => void;
  public onMove?: (clientX: number, clientY: number) => void;
  public onUp?: (clientX: number, clientY: number) => void;
  public onCancel?: () => void;
  public onLeave?: () => void;

  // Integrated gestures
  public onTap?: (clientX: number, clientY: number) => void;
  public onHoldStart?: () => void;
  public onHoldEnd?: () => void;
  public onEe2Trigger?: () => void;

  private readonly canvas: HTMLCanvasElement;
  private readonly speedHistory = [0, 0, 0];
  private speedIndex = 0;

  // Gesture detection state
  private downX = 0;
  private downY = 0;
  private downTime = 0;
  private isHolding = false;
  private holdTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private ee2TimeoutId: ReturnType<typeof setTimeout> | null = null;

  private readonly onPointerDownBound: (e: PointerEvent) => void;
  private readonly onPointerMoveBound: (e: PointerEvent) => void;
  private readonly onPointerUpBound: (e: PointerEvent) => void;
  private readonly onPointerCancelBound: (e: PointerEvent) => void;
  private readonly onPointerLeaveBound: (e: PointerEvent) => void;
  private readonly onContextMenuBound: (e: MouseEvent) => void;
  private readonly onBlurBound: () => void;
  private readonly onVisibilityChangeBound: () => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    this.onPointerDownBound = this.handlePointerDown.bind(this);
    this.onPointerMoveBound = this.handlePointerMove.bind(this);
    this.onPointerUpBound = this.handlePointerUp.bind(this);
    this.onPointerCancelBound = this.handlePointerCancel.bind(this);
    this.onPointerLeaveBound = this.handlePointerLeave.bind(this);
    this.onContextMenuBound = (e: MouseEvent) => e.preventDefault();
    this.onBlurBound = this.handleRelease.bind(this);
    this.onVisibilityChangeBound = () => {
      if (document.hidden) {
        this.handleRelease();
      }
    };

    this.attach();
  }

  private attach(): void {
    this.canvas.addEventListener('pointerdown', this.onPointerDownBound);
    this.canvas.addEventListener('pointerleave', this.onPointerLeaveBound);
    this.canvas.addEventListener('contextmenu', this.onContextMenuBound);

    if (typeof window !== 'undefined') {
      window.addEventListener('pointermove', this.onPointerMoveBound);
      window.addEventListener('pointerup', this.onPointerUpBound);
      window.addEventListener('pointercancel', this.onPointerCancelBound);
      window.addEventListener('blur', this.onBlurBound);
      document.addEventListener('visibilitychange', this.onVisibilityChangeBound);
    }
  }

  private updateCoordinates(e: PointerEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);

    const prevX = this.state.clientX;
    const prevY = this.state.clientY;

    this.state.clientX = e.clientX;
    this.state.clientY = e.clientY;

    if (this.state.isDown) {
      this.state.deltaX = e.clientX - prevX;
      this.state.deltaY = e.clientY - prevY;
    } else {
      this.state.deltaX = 0;
      this.state.deltaY = 0;
    }

    const relX = Math.min(Math.max(0, e.clientX - rect.left), width);
    const relY = Math.min(Math.max(0, e.clientY - rect.top), height);

    this.state.u = relX / width;
    this.state.v = relY / height;

    this.state.ndcX = this.state.u * 2 - 1;
    this.state.ndcY = -(this.state.v * 2 - 1);
    this.state.pointerType = e.pointerType || 'mouse';
  }

  private handlePointerDown(e: PointerEvent): void {
    if (this.state.activePointerId !== null && this.state.activePointerId !== e.pointerId) {
      return;
    }

    this.state.activePointerId = e.pointerId;
    this.state.isDown = true;
    this.state.isInside = true;
    this.updateCoordinates(e);

    this.downX = e.clientX;
    this.downY = e.clientY;
    this.downTime = performance.now();
    this.isHolding = false;

    this.clearGestureTimers();
    this.holdTimeoutId = setTimeout(() => {
      this.isHolding = true;
      this.onHoldStart?.();
    }, 250);

    this.ee2TimeoutId = setTimeout(() => {
      this.onEe2Trigger?.();
    }, 10000);

    try {
      this.canvas.setPointerCapture(e.pointerId);
    } catch {
      // Ignored for environments without full setPointerCapture support
    }

    this.onDown?.(e.clientX, e.clientY);
  }

  private handlePointerMove(e: PointerEvent): void {
    if (this.state.activePointerId !== null && this.state.activePointerId !== e.pointerId) {
      return;
    }

    this.state.isInside = true;
    this.updateCoordinates(e);

    if (this.state.isDown && !this.isHolding) {
      const dist = Math.hypot(e.clientX - this.downX, e.clientY - this.downY);
      if (dist > 8) {
        this.clearGestureTimers();
      }
    }

    this.onMove?.(e.clientX, e.clientY);
  }

  private handlePointerUp(e: PointerEvent): void {
    if (this.state.activePointerId === e.pointerId) {
      this.clearGestureTimers();
      if (this.isHolding) {
        this.isHolding = false;
        this.onHoldEnd?.();
      } else {
        const dist = Math.hypot(e.clientX - this.downX, e.clientY - this.downY);
        const elapsed = performance.now() - this.downTime;
        if (dist <= 8 && elapsed < 350) {
          this.onTap?.(e.clientX, e.clientY);
        }
      }

      this.state.isDown = false;
      this.state.activePointerId = null;
      this.onUp?.(e.clientX, e.clientY);
    }
  }

  private handlePointerCancel(e: PointerEvent): void {
    if (this.state.activePointerId === e.pointerId) {
      this.handleRelease();
    }
  }

  private handlePointerLeave(e: PointerEvent): void {
    if (this.state.activePointerId === null) {
      this.state.isInside = false;
    } else if (this.state.activePointerId === e.pointerId && !this.state.isDown) {
      this.state.isInside = false;
    }
    this.onLeave?.();
  }

  private handleRelease(): void {
    this.clearGestureTimers();
    if (this.isHolding) {
      this.isHolding = false;
      this.onHoldEnd?.();
    }
    this.state.isDown = false;
    this.state.activePointerId = null;
    this.state.deltaX = 0;
    this.state.deltaY = 0;
    this.onCancel?.();
  }

  private clearGestureTimers(): void {
    if (this.holdTimeoutId !== null) {
      clearTimeout(this.holdTimeoutId);
      this.holdTimeoutId = null;
    }
    if (this.ee2TimeoutId !== null) {
      clearTimeout(this.ee2TimeoutId);
      this.ee2TimeoutId = null;
    }
  }

  public resetDelta(): void {
    this.state.deltaX = 0;
    this.state.deltaY = 0;
  }

  public recordGroundSpeed(speed: number): void {
    this.speedHistory[this.speedIndex % 3] = speed;
    this.speedIndex++;
  }

  public getSmoothedGroundSpeed(): number {
    return (
      ((this.speedHistory[0] ?? 0) + (this.speedHistory[1] ?? 0) + (this.speedHistory[2] ?? 0)) / 3
    );
  }

  public get isTouchOrPen(): boolean {
    return this.state.pointerType === 'touch' || this.state.pointerType === 'pen';
  }

  public dispose(): void {
    this.clearGestureTimers();
    this.canvas.removeEventListener('pointerdown', this.onPointerDownBound);
    this.canvas.removeEventListener('pointerleave', this.onPointerLeaveBound);
    this.canvas.removeEventListener('contextmenu', this.onContextMenuBound);

    if (typeof window !== 'undefined') {
      window.removeEventListener('pointermove', this.onPointerMoveBound);
      window.removeEventListener('pointerup', this.onPointerUpBound);
      window.removeEventListener('pointercancel', this.onPointerCancelBound);
      window.removeEventListener('blur', this.onBlurBound);
      document.removeEventListener('visibilitychange', this.onVisibilityChangeBound);
    }
  }
}
