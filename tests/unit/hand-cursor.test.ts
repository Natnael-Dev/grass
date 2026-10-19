import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HandCursor } from '../../src/ui/HandCursor';

class MockElement {
  public style: Record<string, string> = {};
  public dataset: Record<string, string> = {};
  public innerHTML = '';
  public parentNode: unknown = null;
  public remove = vi.fn();
  public querySelector = vi.fn();
}

describe('HandCursor', () => {
  let cursor: HandCursor;
  let mockEl: MockElement;

  beforeEach(() => {
    mockEl = new MockElement();
    cursor = new HandCursor(mockEl as unknown as HTMLElement);
  });

  afterEach(() => {
    cursor.dispose();
  });

  it('initializes in open state with opacity 0 until pointer is detected', () => {
    expect(cursor.state).toBe('open');
    expect(mockEl.dataset.state).toBe('open');
    expect(mockEl.style.opacity).toBe('0');
  });

  it('snaps on first appearance, then lerps position at 0.35 factor per frame', () => {
    // First frame: pointer enters at (200, 100)
    cursor.update(
      0.016,
      {
        clientX: 200,
        clientY: 100,
        deltaX: 0,
        deltaY: 0,
        isDown: false,
        isInside: true,
        pointerType: 'mouse',
      },
      true,
    );

    expect(mockEl.style.opacity).toBe('1');
    // First frame snaps immediately to pointer entry position so it doesn't fly in from (0,0)
    expect(cursor.currentX).toBe(200);
    expect(cursor.currentY).toBe(100);

    // Second frame: pointer moves to (300, 200)
    cursor.update(
      0.016,
      {
        clientX: 300,
        clientY: 200,
        deltaX: 100,
        deltaY: 100,
        isDown: false,
        isInside: true,
        pointerType: 'mouse',
      },
      true,
    );
    // 200 + (300 - 200) * 0.35 = 235
    expect(cursor.currentX).toBeCloseTo(235, 1);
    // 100 + (200 - 100) * 0.35 = 135
    expect(cursor.currentY).toBeCloseTo(135, 1);
  });

  it('switches to moving state with rotation clamped to +/-12 deg when moving over terrain', () => {
    cursor.update(
      0.016,
      {
        clientX: 300,
        clientY: 200,
        deltaX: 200, // fast movement to the right
        deltaY: 0,
        isDown: false,
        isInside: true,
        pointerType: 'mouse',
      },
      true,
    );

    expect(cursor.state).toBe('moving');
    expect(mockEl.dataset.state).toBe('moving');
    // Rotation should clamp to maximum 12 degrees
    expect(cursor.targetRot).toBe(12);
  });

  it('switches to pressed state when mouse button is down', () => {
    cursor.update(
      0.016,
      {
        clientX: 300,
        clientY: 200,
        deltaX: 0,
        deltaY: 0,
        isDown: true,
        isInside: true,
        pointerType: 'mouse',
      },
      true,
    );

    expect(cursor.state).toBe('pressed');
    expect(mockEl.dataset.state).toBe('pressed');
  });

  it('stays open and has 0 rotation when pointing at the sky even if moving', () => {
    cursor.update(
      0.016,
      {
        clientX: 300,
        clientY: 50,
        deltaX: 100,
        deltaY: 0,
        isDown: false,
        isInside: true,
        pointerType: 'mouse',
      },
      false, // sky (not over terrain)
    );

    expect(cursor.state).toBe('open');
    expect(mockEl.dataset.state).toBe('open');
    expect(cursor.targetRot).toBe(0);
  });

  it('hides for touch or pen pointers', () => {
    cursor.update(
      0.016,
      {
        clientX: 300,
        clientY: 200,
        deltaX: 10,
        deltaY: 0,
        isDown: false,
        isInside: true,
        pointerType: 'touch',
      },
      true,
    );

    expect(mockEl.style.opacity).toBe('0');
  });
});
