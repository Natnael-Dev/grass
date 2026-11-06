import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Pointer } from '../../src/input/Pointer';
import { KeyboardBrush } from '../../src/input/KeyboardBrush';

// Lightweight mock environment for unit tests in Node.js
class MockCanvas extends EventTarget {
  public setPointerCapture = vi.fn();
  public getBoundingClientRect(): DOMRect {
    return {
      left: 100,
      top: 50,
      width: 800,
      height: 600,
      right: 900,
      bottom: 650,
      x: 100,
      y: 50,
      toJSON: () => ({}),
    } as DOMRect;
  }
}

class MockPointerEvent extends Event {
  public pointerId: number;
  public pointerType: string;
  public clientX: number;
  public clientY: number;
  public button: number;

  constructor(
    type: string,
    init: {
      pointerId?: number;
      pointerType?: string;
      clientX?: number;
      clientY?: number;
      button?: number;
    } = {},
  ) {
    super(type);
    this.pointerId = init.pointerId ?? 1;
    this.pointerType = init.pointerType ?? 'mouse';
    this.clientX = init.clientX ?? 0;
    this.clientY = init.clientY ?? 0;
    this.button = init.button ?? 0;
  }
}

class MockKeyboardEvent extends Event {
  public key: string;
  public ctrlKey: boolean;
  public altKey: boolean;
  public metaKey: boolean;

  constructor(
    type: string,
    init: { key?: string; ctrlKey?: boolean; altKey?: boolean; metaKey?: boolean } = {},
  ) {
    super(type);
    this.key = init.key ?? '';
    this.ctrlKey = init.ctrlKey ?? false;
    this.altKey = init.altKey ?? false;
    this.metaKey = init.metaKey ?? false;
  }
}

interface MockGlobal {
  window?: EventTarget;
  document?: EventTarget & { hidden?: boolean };
}

const g = globalThis as unknown as MockGlobal;
if (typeof g.window === 'undefined') {
  g.window = new EventTarget();
}
if (typeof g.document === 'undefined') {
  const doc = new EventTarget() as EventTarget & { hidden?: boolean };
  doc.hidden = false;
  g.document = doc;
}

describe('Pointer', () => {
  let canvas: MockCanvas;
  let pointer: Pointer;

  beforeEach(() => {
    canvas = new MockCanvas();
    pointer = new Pointer(canvas as unknown as HTMLCanvasElement);
  });

  afterEach(() => {
    pointer.dispose();
  });

  it('initializes with default values', () => {
    const s = pointer.state;
    expect(s.isDown).toBe(false);
    expect(s.pointerType).toBe('mouse');
    expect(s.isInside).toBe(false);
  });

  it('tracks primary pointer down, move, and up', () => {
    // Pointerdown at client (500, 350) -> center of canvas (x=400, y=300 relative)
    const downEvent = new MockPointerEvent('pointerdown', {
      pointerId: 1,
      pointerType: 'mouse',
      clientX: 500,
      clientY: 350,
      button: 0,
    });
    canvas.dispatchEvent(downEvent);

    expect(pointer.state.isDown).toBe(true);
    expect(pointer.state.isInside).toBe(true);
    expect(pointer.state.activePointerId).toBe(1);
    expect(pointer.state.clientX).toBe(500);
    expect(pointer.state.clientY).toBe(350);
    expect(pointer.state.u).toBeCloseTo(0.5, 3);
    expect(pointer.state.v).toBeCloseTo(0.5, 3);
    expect(pointer.state.ndcX).toBeCloseTo(0.0, 3);
    expect(pointer.state.ndcY).toBeCloseTo(0.0, 3);

    // Pointermove to client (580, 350)
    const moveEvent = new MockPointerEvent('pointermove', {
      pointerId: 1,
      pointerType: 'mouse',
      clientX: 580,
      clientY: 350,
    });
    window.dispatchEvent(moveEvent);

    expect(pointer.state.deltaX).toBe(80);
    expect(pointer.state.deltaY).toBe(0);
    expect(pointer.state.clientX).toBe(580);

    // Pointerup
    const upEvent = new MockPointerEvent('pointerup', {
      pointerId: 1,
      pointerType: 'mouse',
      clientX: 580,
      clientY: 350,
    });
    window.dispatchEvent(upEvent);

    expect(pointer.state.isDown).toBe(false);
    expect(pointer.state.activePointerId).toBeNull();
  });

  it('ignores secondary pointers when primary is active', () => {
    canvas.dispatchEvent(
      new MockPointerEvent('pointerdown', {
        pointerId: 1,
        clientX: 200,
        clientY: 200,
      }),
    );
    expect(pointer.state.activePointerId).toBe(1);

    // Second pointer
    canvas.dispatchEvent(
      new MockPointerEvent('pointerdown', {
        pointerId: 2,
        clientX: 300,
        clientY: 300,
      }),
    );
    expect(pointer.state.activePointerId).toBe(1);
    expect(pointer.state.clientX).toBe(200);
  });

  it('smooths ground speed over 3 samples', () => {
    // Feed 3 samples
    pointer.recordGroundSpeed(3.0);
    expect(pointer.getSmoothedGroundSpeed()).toBeCloseTo(1.0, 2); // 3 / 3

    pointer.recordGroundSpeed(3.0);
    expect(pointer.getSmoothedGroundSpeed()).toBeCloseTo(2.0, 2); // (3 + 3) / 3

    pointer.recordGroundSpeed(3.0);
    expect(pointer.getSmoothedGroundSpeed()).toBeCloseTo(3.0, 2); // (3 + 3 + 3) / 3

    pointer.recordGroundSpeed(6.0);
    expect(pointer.getSmoothedGroundSpeed()).toBeCloseTo(4.0, 2); // (3 + 3 + 6) / 3
  });
});

describe('KeyboardBrush', () => {
  let kb: KeyboardBrush;

  beforeEach(() => {
    kb = new KeyboardBrush();
  });

  afterEach(() => {
    kb.dispose();
  });

  it('moves virtual brush at 9 m/s along ground plane with arrow keys', () => {
    window.dispatchEvent(new MockKeyboardEvent('keydown', { key: 'ArrowRight' }));
    expect(kb.isActive).toBe(true);

    kb.update(0.5); // dt = 0.5s -> 9 * 0.5 = 4.5m
    expect(kb.groundPos.x).toBeCloseTo(4.5, 2);
    expect(kb.speed).toBeCloseTo(9.0, 2);

    window.dispatchEvent(new MockKeyboardEvent('keyup', { key: 'ArrowRight' }));
    kb.update(0.1);
    expect(kb.speed).toBe(0);
  });

  it('ignores arrow keys when Ctrl or Alt is held', () => {
    window.dispatchEvent(new MockKeyboardEvent('keydown', { key: 'ArrowRight', ctrlKey: true }));
    expect(kb.isActive).toBe(false);
  });

  it('yields active status when pointer moves', () => {
    window.dispatchEvent(new MockKeyboardEvent('keydown', { key: 'ArrowLeft' }));
    expect(kb.isActive).toBe(true);

    kb.deactivate();
    expect(kb.isActive).toBe(false);
  });
});
