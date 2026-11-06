export class KeyboardBrush {
  public readonly groundPos = { x: 0, z: -5 };
  public isActive = false;
  public speed = 0;

  private leftPressed = false;
  private rightPressed = false;
  private upPressed = false;
  private downPressed = false;

  public onTap: ((pos: { x: number; z: number }) => void) | null = null;

  private readonly onKeyDownBound: (e: KeyboardEvent) => void;
  private readonly onKeyUpBound: (e: KeyboardEvent) => void;
  private readonly onBlurBound: () => void;

  constructor() {
    this.onKeyDownBound = this.handleKeyDown.bind(this);
    this.onKeyUpBound = this.handleKeyUp.bind(this);
    this.onBlurBound = this.resetKeys.bind(this);

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.onKeyDownBound);
      window.addEventListener('keyup', this.onKeyUpBound);
      window.addEventListener('blur', this.onBlurBound);
    }
  }

  private isTargetInput(e: KeyboardEvent): boolean {
    const target = e.target;
    if (typeof HTMLInputElement !== 'undefined' && target instanceof HTMLInputElement) {
      return true;
    }
    if (typeof HTMLTextAreaElement !== 'undefined' && target instanceof HTMLTextAreaElement) {
      return true;
    }
    if (typeof HTMLSelectElement !== 'undefined' && target instanceof HTMLSelectElement) {
      return true;
    }
    return false;
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.ctrlKey || e.altKey || e.metaKey || this.isTargetInput(e)) {
      return;
    }

    let handled = false;
    if (e.key === 'ArrowLeft') {
      this.leftPressed = true;
      handled = true;
    } else if (e.key === 'ArrowRight') {
      this.rightPressed = true;
      handled = true;
    } else if (e.key === 'ArrowUp') {
      this.upPressed = true;
      handled = true;
    } else if (e.key === 'ArrowDown') {
      this.downPressed = true;
      handled = true;
    } else if (e.key === 'Enter') {
      if (this.isActive && this.onTap) {
        this.onTap({ x: this.groundPos.x, z: this.groundPos.z });
      }
    }

    if (handled) {
      this.isActive = true;
      e.preventDefault();
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    if (e.key === 'ArrowLeft') {
      this.leftPressed = false;
    } else if (e.key === 'ArrowRight') {
      this.rightPressed = false;
    } else if (e.key === 'ArrowUp') {
      this.upPressed = false;
    } else if (e.key === 'ArrowDown') {
      this.downPressed = false;
    }
  }

  public deactivate(): void {
    this.isActive = false;
    this.resetKeys();
  }

  private resetKeys(): void {
    this.leftPressed = false;
    this.rightPressed = false;
    this.upPressed = false;
    this.downPressed = false;
    this.speed = 0;
  }

  public update(dt: number): void {
    if (!this.isActive) {
      this.speed = 0;
      return;
    }

    let vx = (this.rightPressed ? 1 : 0) - (this.leftPressed ? 1 : 0);
    let vz = (this.downPressed ? 1 : 0) - (this.upPressed ? 1 : 0); // up is -z (away), down is +z (toward)

    if (vx !== 0 || vz !== 0) {
      const len = Math.hypot(vx, vz);
      vx = (vx / len) * 9.0;
      vz = (vz / len) * 9.0;

      this.groundPos.x += vx * dt;
      this.groundPos.z += vz * dt;
      this.speed = 9.0;

      // Clamp within meadow bounds
      this.groundPos.x = Math.max(-30, Math.min(30, this.groundPos.x));
      this.groundPos.z = Math.max(-35, Math.min(10, this.groundPos.z));
    } else {
      this.speed = 0;
    }
  }

  public dispose(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.onKeyDownBound);
      window.removeEventListener('keyup', this.onKeyUpBound);
      window.removeEventListener('blur', this.onBlurBound);
    }
  }
}
