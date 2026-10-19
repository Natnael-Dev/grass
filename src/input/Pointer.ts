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

  private readonly canvas: HTMLCanvasElement;
  private readonly speedHistory = [0, 0, 0];
  private speedIndex = 0;

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
    const width = rect.width > 0 ? rect.width : 1;
    const height = rect.height > 0 ? rect.height : 1;

    const u = (e.clientX - rect.left) / width;
    const v = (e.clientY - rect.top) / height;

    this.state.deltaX = e.clientX - this.state.clientX;
    this.state.deltaY = e.clientY - this.state.clientY;

    this.state.clientX = e.clientX;
    this.state.clientY = e.clientY;
    this.state.u = Math.max(0, Math.min(1, u));
    this.state.v = Math.max(0, Math.min(1, v));
    this.state.ndcX = this.state.u * 2 - 1;
    this.state.ndcY = -(this.state.v * 2 - 1);
    this.state.pointerType = e.pointerType || 'mouse';
  }

  private handlePointerDown(e: PointerEvent): void {
    if (this.state.activePointerId !== null && this.state.activePointerId !== e.pointerId) {
      return; // Ignore secondary touch / pointer
    }

    this.state.activePointerId = e.pointerId;
    this.state.isDown = true;
    this.state.isInside = true;
    this.updateCoordinates(e);

    try {
      this.canvas.setPointerCapture(e.pointerId);
    } catch {
      // Ignored for environments without full setPointerCapture support
    }
  }

  private handlePointerMove(e: PointerEvent): void {
    if (this.state.activePointerId !== null && this.state.activePointerId !== e.pointerId) {
      return;
    }

    this.state.isInside = true;
    this.updateCoordinates(e);
  }

  private handlePointerUp(e: PointerEvent): void {
    if (this.state.activePointerId === e.pointerId) {
      this.state.isDown = false;
      this.state.activePointerId = null;
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
  }

  private handleRelease(): void {
    this.state.isDown = false;
    this.state.activePointerId = null;
    this.state.deltaX = 0;
    this.state.deltaY = 0;
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
