import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HintLine } from '../../src/ui/HintLine';
import { HintSequencer } from '../../src/ui/HintSequencer';
import { COPY } from '../../src/ui/copy';
import { safeStorage } from '../../src/core/storage';

class MockElement {
  public style: Record<string, string> = {};
  public textContent = '';
  public offsetHeight = 100;
  public parentElement: unknown = null;
  public setAttribute = vi.fn();
}

describe('HintLine', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('types out text character by character when reducedMotion is false', () => {
    const el = new MockElement();
    const hintLine = new HintLine({ element: el as unknown as HTMLElement, reducedMotion: false });
    hintLine.show('hello', 3000);

    expect(hintLine.getIsVisible()).toBe(true);
    // At t=0, empty string
    expect(el.textContent).toBe('');

    // Advance 28 ms -> 'h'
    vi.advanceTimersByTime(28);
    expect(el.textContent).toBe('h');

    // Advance 28*4 = 112 ms -> 'hello'
    vi.advanceTimersByTime(112);
    expect(el.textContent).toBe('hello');

    // Advance hold time 3000 ms -> starts fade out
    vi.advanceTimersByTime(3000);
    expect(el.style.opacity).toBe('0');

    // Advance 400 ms fade duration -> hidden
    vi.advanceTimersByTime(400);
    expect(el.style.display).toBe('none');

    hintLine.dispose();
  });

  it('renders instantly without typing when reducedMotion is true', () => {
    const el = new MockElement();
    const hintLine = new HintLine({ element: el as unknown as HTMLElement, reducedMotion: true });
    hintLine.show('hello reduced', 2000);

    expect(el.textContent).toBe('hello reduced');
    vi.advanceTimersByTime(2000);
    expect(el.style.opacity).toBe('0');

    hintLine.dispose();
  });
});

describe('HintSequencer', () => {
  let mockHintLine: HintLine;

  beforeEach(() => {
    vi.useFakeTimers();
    safeStorage.clear();
    mockHintLine = {
      show: vi.fn(),
      fadeOut: vi.fn(),
      hideImmediately: vi.fn(),
      getIsVisible: vi.fn().mockReturnValue(false),
      setReducedMotion: vi.fn(),
      dispose: vi.fn(),
      element: new MockElement() as unknown as HTMLElement,
    } as unknown as HintLine;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('progresses through sequence based on user interactions', () => {
    const onComplete = vi.fn();
    const sequencer = new HintSequencer({
      hintLine: mockHintLine,
      isTouch: false,
      hintsSeen: false,
      onComplete,
    });

    sequencer.start();
    expect(mockHintLine.show).not.toHaveBeenCalled();

    // +1.5 s -> Hint 1
    vi.advanceTimersByTime(1500);
    expect(mockHintLine.show).toHaveBeenCalledWith(COPY.hints.desktop[0]);
    expect(sequencer.getCurrentStep()).toBe(1);

    // Cumulative brush < 600 px -> does not trigger step 2
    sequencer.onBrush(300);
    expect(sequencer.getCurrentStep()).toBe(1);

    // Additional brush >= 600 px total -> triggers step 2
    sequencer.onBrush(300);
    expect(sequencer.getCurrentStep()).toBe(2);
    expect(mockHintLine.show).toHaveBeenCalledWith(COPY.hints.desktop[1]);

    // Tap -> triggers step 3
    sequencer.onTap();
    expect(sequencer.getCurrentStep()).toBe(3);
    expect(mockHintLine.show).toHaveBeenCalledWith(COPY.hints.desktop[2]);

    // Lie down end -> triggers step 4
    sequencer.onLieDownEnd();
    expect(sequencer.getCurrentStep()).toBe(5);
    expect(mockHintLine.show).toHaveBeenCalledWith(COPY.hints.desktop[3]);
    expect(sequencer.isCompleted()).toBe(true);
    expect(safeStorage.getHintsSeen()).toBe(true);
    expect(onComplete).toHaveBeenCalled();

    sequencer.dispose();
  });

  it('progresses through sequence using fallback timers if user is inactive', () => {
    const sequencer = new HintSequencer({
      hintLine: mockHintLine,
      isTouch: false,
      hintsSeen: false,
    });

    sequencer.start();

    // +1.5 s -> Hint 1
    vi.advanceTimersByTime(1500);
    expect(mockHintLine.show).toHaveBeenCalledWith(COPY.hints.desktop[0]);

    // +8 s -> Hint 2 fallback
    vi.advanceTimersByTime(8000);
    expect(mockHintLine.show).toHaveBeenCalledWith(COPY.hints.desktop[1]);

    // +8 s -> Hint 3 fallback
    vi.advanceTimersByTime(8000);
    expect(mockHintLine.show).toHaveBeenCalledWith(COPY.hints.desktop[2]);

    // +12 s -> Hint 4 fallback
    vi.advanceTimersByTime(12000);
    expect(mockHintLine.show).toHaveBeenCalledWith(COPY.hints.desktop[3]);
    expect(sequencer.isCompleted()).toBe(true);

    sequencer.dispose();
  });

  it('uses touch copy variant when isTouch is true', () => {
    const sequencer = new HintSequencer({
      hintLine: mockHintLine,
      isTouch: true,
      hintsSeen: false,
    });

    sequencer.start();
    vi.advanceTimersByTime(1500);
    expect(mockHintLine.show).toHaveBeenCalledWith(COPY.hints.touch[0]);

    sequencer.dispose();
  });

  it('does nothing when hintsSeen is true (returning visitor)', () => {
    const sequencer = new HintSequencer({
      hintLine: mockHintLine,
      hintsSeen: true,
    });

    sequencer.start();
    vi.advanceTimersByTime(50000);
    expect(mockHintLine.show).not.toHaveBeenCalled();
    expect(sequencer.isCompleted()).toBe(true);

    sequencer.dispose();
  });
});
