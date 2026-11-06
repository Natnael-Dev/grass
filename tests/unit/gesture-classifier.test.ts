import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GestureClassifier } from '../../src/input/GestureClassifier';

class MockKeyboardEvent extends Event {
  public code: string;
  public key: string;
  public repeat: boolean;
  public ctrlKey: boolean;
  public altKey: boolean;
  public metaKey: boolean;

  constructor(
    type: string,
    init: {
      code?: string;
      key?: string;
      repeat?: boolean;
      ctrlKey?: boolean;
      altKey?: boolean;
      metaKey?: boolean;
    } = {},
  ) {
    super(type);
    this.code = init.code ?? '';
    this.key = init.key ?? '';
    this.repeat = init.repeat ?? false;
    this.ctrlKey = init.ctrlKey ?? false;
    this.altKey = init.altKey ?? false;
    this.metaKey = init.metaKey ?? false;
  }
}

describe('GestureClassifier', () => {
  let classifier: GestureClassifier;
  let tapSpy: ReturnType<typeof vi.fn>;
  let holdStartSpy: ReturnType<typeof vi.fn>;
  let holdEndSpy: ReturnType<typeof vi.fn>;
  let ee2Spy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    classifier = new GestureClassifier({
      holdDelayMs: 250,
      dragThresholdPx: 8,
      ee2HoldDurationMs: 10000,
    });

    tapSpy = vi.fn();
    holdStartSpy = vi.fn();
    holdEndSpy = vi.fn();
    ee2Spy = vi.fn();

    classifier.on('tap', tapSpy);
    classifier.on('holdStart', holdStartSpy);
    classifier.on('holdEnd', holdEndSpy);
    classifier.on('ee2Trigger', ee2Spy);
  });

  describe('Boundary: Tap vs Hold Time (249 ms vs 250 ms)', () => {
    it('emits tap when released at 249 ms with movement <= 8 px', () => {
      classifier.onPointerDown(100, 100, 0);
      classifier.onPointerMove(105, 105, 100); // 7.07 px displacement (<= 8 px)
      classifier.update(249);
      expect(classifier.getState()).toBe('pressing');
      expect(holdStartSpy).not.toHaveBeenCalled();

      classifier.onPointerUp(105, 105, 249);
      expect(tapSpy).toHaveBeenCalledTimes(1);
      expect(tapSpy).toHaveBeenCalledWith({
        clientX: 105,
        clientY: 105,
      });
      expect(holdStartSpy).not.toHaveBeenCalled();
      expect(holdEndSpy).not.toHaveBeenCalled();
      expect(classifier.getState()).toBe('idle');
    });

    it('emits holdStart when held for exactly 250 ms with movement <= 8 px', () => {
      classifier.onPointerDown(100, 100, 0);
      classifier.onPointerMove(105, 105, 100); // <= 8 px
      classifier.update(250);

      expect(classifier.getState()).toBe('holding');
      expect(holdStartSpy).toHaveBeenCalledTimes(1);
      expect(tapSpy).not.toHaveBeenCalled();

      // Pointer up after holding emits holdEnd, not tap
      classifier.onPointerUp(105, 105, 500);
      expect(holdEndSpy).toHaveBeenCalledTimes(1);
      expect(tapSpy).not.toHaveBeenCalled();
      expect(classifier.getState()).toBe('idle');
    });
  });

  describe('Boundary: Drag vs Tap/Hold Displacement (8 px vs 9 px)', () => {
    it('allows tap and hold if displacement is exactly 8 px', () => {
      // (100, 100) to (108, 100) = 8.0 px
      classifier.onPointerDown(100, 100, 0);
      classifier.onPointerMove(108, 100, 50);
      expect(classifier.getState()).toBe('pressing');

      classifier.update(250);
      expect(classifier.getState()).toBe('holding');
      expect(holdStartSpy).toHaveBeenCalledTimes(1);
    });

    it('transitions to dragging and prevents tap/hold if displacement is 9 px', () => {
      // (100, 100) to (109, 100) = 9.0 px (> 8 px)
      classifier.onPointerDown(100, 100, 0);
      classifier.onPointerMove(109, 100, 50);
      expect(classifier.getState()).toBe('dragging');

      // Holding past 250 ms in dragging state does not trigger holdStart
      classifier.update(300);
      expect(classifier.getState()).toBe('dragging');
      expect(holdStartSpy).not.toHaveBeenCalled();

      // Release in dragging state does not trigger tap
      classifier.onPointerUp(109, 100, 350);
      expect(tapSpy).not.toHaveBeenCalled();
      expect(holdEndSpy).not.toHaveBeenCalled();
      expect(classifier.getState()).toBe('idle');
    });
  });

  describe('Cancel and Blur handling', () => {
    it('resets cleanly from pressing on cancel without emitting events', () => {
      classifier.onPointerDown(100, 100, 0);
      expect(classifier.getState()).toBe('pressing');

      classifier.onPointerCancel();
      expect(classifier.getState()).toBe('idle');
      expect(tapSpy).not.toHaveBeenCalled();
      expect(holdStartSpy).not.toHaveBeenCalled();
      expect(holdEndSpy).not.toHaveBeenCalled();
    });

    it('emits holdEnd and resets to idle when cancel occurs during holding', () => {
      classifier.onPointerDown(100, 100, 0);
      classifier.update(250);
      expect(classifier.getState()).toBe('holding');
      expect(holdStartSpy).toHaveBeenCalledTimes(1);

      classifier.onPointerCancel();
      expect(classifier.getState()).toBe('idle');
      expect(holdEndSpy).toHaveBeenCalledTimes(1);
    });

    it('emits holdEnd on blur/reset', () => {
      classifier.onPointerDown(100, 100, 0);
      classifier.update(250);
      expect(classifier.getState()).toBe('holding');

      classifier.reset();
      expect(classifier.getState()).toBe('idle');
      expect(holdEndSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('Space Key Hold', () => {
    it('starts hold on Space keydown and ends on keyup', () => {
      const spaceDown = new MockKeyboardEvent('keydown', {
        code: 'Space',
        key: ' ',
      }) as unknown as KeyboardEvent;
      const spaceUp = new MockKeyboardEvent('keyup', {
        code: 'Space',
        key: ' ',
      }) as unknown as KeyboardEvent;

      classifier.onKeyDown(spaceDown);
      expect(classifier.getState()).toBe('holding');
      expect(holdStartSpy).toHaveBeenCalledTimes(1);

      classifier.onKeyUp(spaceUp);
      expect(classifier.getState()).toBe('idle');
      expect(holdEndSpy).toHaveBeenCalledTimes(1);
    });

    it('ignores repeat keydown events for Space', () => {
      const spaceDown = new MockKeyboardEvent('keydown', {
        code: 'Space',
        key: ' ',
      }) as unknown as KeyboardEvent;
      const spaceRepeat = new MockKeyboardEvent('keydown', {
        code: 'Space',
        key: ' ',
        repeat: true,
      }) as unknown as KeyboardEvent;

      classifier.onKeyDown(spaceDown);
      expect(holdStartSpy).toHaveBeenCalledTimes(1);

      classifier.onKeyDown(spaceRepeat);
      expect(holdStartSpy).toHaveBeenCalledTimes(1); // not called again
    });

    it('ignores Space when modifier keys are pressed', () => {
      const spaceWithCtrl = new MockKeyboardEvent('keydown', {
        code: 'Space',
        key: ' ',
        ctrlKey: true,
      }) as unknown as KeyboardEvent;

      classifier.onKeyDown(spaceWithCtrl);
      expect(classifier.getState()).toBe('idle');
      expect(holdStartSpy).not.toHaveBeenCalled();
    });
  });

  describe('EE-2 Hook Point (10 s continuous hold)', () => {
    it('triggers ee2Trigger once after 10 seconds of continuous hold', () => {
      classifier.onPointerDown(100, 100, 0);
      classifier.update(250);
      expect(classifier.getState()).toBe('holding');
      expect(ee2Spy).not.toHaveBeenCalled();

      // Advance to 9.9 seconds (9900 ms)
      classifier.update(9900);
      expect(ee2Spy).not.toHaveBeenCalled();

      // Advance past 10 seconds (10000 ms from pointerdown)
      classifier.update(10000);
      expect(ee2Spy).toHaveBeenCalledTimes(1);

      // Advance further; should not trigger again
      classifier.update(12000);
      expect(ee2Spy).toHaveBeenCalledTimes(1);
    });
  });
});
